import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { appendFileSync } from 'fs';
import { join } from 'path';

/**
 * AllExceptionsFilter — global filter ที่ทำให้ error response ทุก endpoint มีรูปแบบเดียวกัน
 *
 * - HttpException: คงค่า statusCode/message/error ตามเดิม (ไม่ทำลาย contract ที่ frontend อ่านอยู่)
 *   แล้วเพิ่ม timestamp/path
 * - error ที่ไม่ใช่ HttpException (เช่น throw new Error ใน integration layer, DB error):
 *   ตอบ 500 รูปแบบเดียวกัน โดย log รายละเอียดจริงไว้ฝั่ง server เท่านั้น — ไม่ leak stack/internal ให้ client
 */
interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.resolveStatus(exception);
    const { message, error } = this.resolveMessage(exception);

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      // log เฉพาะฝั่ง server — รายละเอียดจริงไม่ควรหลุดไปหา client
      const detail =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        detail,
      );
      if (request.url?.includes('check-in-assist/room-stations')) {
        try {
          appendFileSync(
            join(process.cwd(), 'room-stations-500.log'),
            `${new Date().toISOString()} ${request.method} ${request.url}\n${detail}\n\n`,
          );
        } catch {
          // ignore logging failures
        }
      }
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown): {
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { message: res, error: exception.name };
      }
      const obj = res as Record<string, unknown>;
      const message = (obj.message ?? exception.message) as string | string[];
      const error = (obj.error as string) ?? exception.name;
      return { message, error };
    }

    // non-HttpException → ไม่ leak รายละเอียดภายในให้ client
    return {
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
