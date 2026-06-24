import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import * as https from 'https';
import * as tls from 'tls';
import * as qs from 'qs';
import { MoodleSyncLogsService } from '../moodle-sync-logs/moodle-sync-logs.service';
import { MoodleAction } from '../moodle-sync-logs/entities/moodle-sync-log.entity';
import { MoodleLogMeta } from './types/moodle.types';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRYABLE_CODES = new Set([
  'ECONNABORTED',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
]);

/** error ที่ Moodle ส่งกลับมาแม้ HTTP 200 */
interface MoodleExceptionBody {
  exception: string;
  errorcode?: string;
  message?: string;
}

function isMoodleException(body: unknown): body is MoodleExceptionBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'exception' in (body as Record<string, unknown>)
  );
}

/**
 * Low-level client เรียก Moodle Web Service (REST) + บันทึก moodle_sync_log ทุกครั้ง
 */
@Injectable()
export class MoodleClientService {
  private readonly logger = new Logger(MoodleClientService.name);
  private httpsAgent?: https.Agent;

  constructor(
    private readonly configService: ConfigService,
    private readonly syncLogsService: MoodleSyncLogsService,
  ) {}

  /**
   * https agent ที่ต่อไป IP ภายในได้ แต่ verify cert ตามชื่อโดเมน (SNI = MOODLE_NAME)
   * เพราะ cert ออกให้ *.buu.ac.th ไม่ใช่ IP — ต่อด้วย IP ตรง ๆ จะ verify ไม่ผ่าน
   */
  private getHttpsAgent(serverName: string): https.Agent {
    if (!this.httpsAgent) {
      this.httpsAgent = new https.Agent({
        keepAlive: true,
        servername: serverName,
        checkServerIdentity: (_host, cert) =>
          tls.checkServerIdentity(serverName, cert),
      });
    }
    return this.httpsAgent;
  }

  /**
   * เรียก Moodle WS function หนึ่งครั้ง — log ผล (สำเร็จ/ล้มเหลว) เสมอ
   * @param params พารามิเตอร์เฉพาะของ function (ไม่ต้องใส่ wstoken/wsfunction/format)
   */
  async call<T>(
    action: MoodleAction,
    params: Record<string, unknown>,
    meta: MoodleLogMeta,
  ): Promise<T> {
    // ต่อ TCP ไป IP ภายใน (PRIVATE_IP) แต่ verify TLS + ส่ง Host/SNI ตามชื่อโดเมน (MOODLE_NAME)
    const ip = this.configService
      .getOrThrow<string>('MOODLE_PRIVATE_IP')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');
    const serverName = this.configService.getOrThrow<string>('MOODLE_NAME');
    const token = this.configService.getOrThrow<string>('MOODLE_WS_TOKEN');
    const url = `https://${ip}/webservice/rest/server.php`;

    const body = qs.stringify({
      wstoken: token,
      wsfunction: action,
      moodlewsrestformat: 'json',
      ...params,
    });

    let httpStatus: number | null = null;
    let responseBody: unknown = null;
    let errorMessage: string | null = null;

    try {
      const response = await this.postWithRetry(url, body, serverName);
      httpStatus = response.status;
      responseBody = response.data;

      if (isMoodleException(responseBody)) {
        errorMessage = `${responseBody.errorcode ?? 'moodle_exception'}: ${
          responseBody.message ?? ''
        }`.trim();
        throw new Error(errorMessage);
      }

      return responseBody as T;
    } catch (error) {
      if (!errorMessage) {
        errorMessage =
          error instanceof Error ? error.message : 'Unknown Moodle error';
      }
      throw error;
    } finally {
      await this.writeLog(
        action,
        url,
        params,
        responseBody,
        httpStatus,
        errorMessage,
        meta,
      );
    }
  }

  private async postWithRetry(url: string, body: string, serverName: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await axios.post(url, body, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // ให้ Moodle/proxy route ตามโดเมน (กัน redirect http→https ที่ทำ POST→GET)
            Host: serverName,
          },
          httpsAgent: this.getHttpsAgent(serverName),
          // ใช้ https ตรงแล้ว ไม่ควรมี redirect — ถ้ามีให้ fail ดังกว่าปล่อยให้ body หาย
          maxRedirects: 0,
          // Moodle ตอบ 200 เสมอ — รับทุก status ไว้ตรวจ body เอง
          validateStatus: () => true,
        });
      } catch (error) {
        lastError = error;
        const code = (error as AxiosError).code;
        if (attempt < MAX_RETRIES && code && RETRYABLE_CODES.has(code)) {
          await this.delay(500 * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** ปิดบัง field ที่อ่อนไหว (เช่น password) ก่อนเก็บลง log */
  private maskPayload(
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    const mask = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(mask);
      }
      if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          out[key] = /password/i.test(key) ? '***' : mask(val);
        }
        return out;
      }
      return value;
    };
    return mask(params) as Record<string, unknown>;
  }

  private async writeLog(
    action: MoodleAction,
    url: string,
    params: Record<string, unknown>,
    responseBody: unknown,
    httpStatus: number | null,
    errorMessage: string | null,
    meta: MoodleLogMeta,
  ): Promise<void> {
    try {
      await this.syncLogsService.create({
        USER_ID: meta.userId,
        ML_ACTION: action,
        ML_WS_FUNCTION: action,
        ML_REQUEST_URL: url,
        ML_REQUEST_PAYLOAD: this.maskPayload(params),
        ML_RESPONSE_BODY:
          responseBody && typeof responseBody === 'object'
            ? (responseBody as Record<string, unknown>)
            : responseBody !== null
              ? { value: responseBody }
              : undefined,
        ML_HTTP_METHOD: 'POST',
        ML_HTTP_STATUS: httpStatus ?? undefined,
        ML_ERROR_MASSAGE: errorMessage ?? undefined,
        ML_REF_TYPE: meta.refType,
        ML_REF_ID: meta.refId,
        ML_MOODLE_REF_ID: meta.moodleRefId ?? 0,
      });
    } catch (logError) {
      // ห้ามให้การ log ล้มเหลวไปกระทบ flow หลัก
      this.logger.error(
        `บันทึก moodle_sync_log ไม่สำเร็จ (${action})`,
        logError instanceof Error ? logError.stack : String(logError),
      );
    }
  }
}
