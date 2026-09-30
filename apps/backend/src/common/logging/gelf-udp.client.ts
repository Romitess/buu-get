import { Injectable, OnModuleInit } from '@nestjs/common';
import { createSocket, Socket } from 'dgram';
import { connect as netConnect, Socket as NetSocket } from 'net';
import { AuditLogStatus } from 'src/modules/audit-logs/entities/audit-log.entity';
import { AuditActorSnapshot } from 'src/modules/audit-logs/dto/record-audit.dto';
import {
  menuFromApiPath,
  normalizeClientIp,
  parseClientBrowser,
  parseClientEquipment,
} from './graylog-client.util';

/** Practical single-datagram GELF ceiling; oversized messages are dropped (no chunking). */
export const GELF_MAX_BYTES = 8192;

/** Syslog severity levels used by GELF / grayLog() manual. */
export const GelfLevel = {
  EMERGENCY: 0,
  ALERT: 1,
  CRITICAL: 2,
  ERROR: 3,
  WARNING: 4,
  NOTICE: 5,
  INFO: 6,
  DEBUG: 7,
} as const;

export type GelfLevelValue = (typeof GelfLevel)[keyof typeof GelfLevel];

/** tcp = GELF TCP + null delimiter (matches university Graylog / gelf-pro). */
export type GelfProtocol = 'udp' | 'tcp' | 'http';

/** Event values allowed by the university grayLog() manual. */
export const GRAYLOG_EVENTS = [
  'middleware',
  'view',
  'add',
  'edit',
  'insert',
  'update',
  'delete',
  'import',
  'export',
  'download',
  'login',
  'logout',
] as const;

export type GrayLogEvent = (typeof GRAYLOG_EVENTS)[number];

const GRAYLOG_STANDARD_KEYS = new Set([
  'source',
  'event',
  'parameter',
  'status',
  'remarks',
  'menu',
  'sub_menu',
  'access_id',
  'access_data',
  'user_id',
  'full_name',
  'browser',
  'equipment',
  'ip_address',
  'url',
]);

/**
 * Business log payload matching the university `grayLog($logData, $logLevel, $logCustom)` manual.
 */
export interface GrayLogData {
  source?: string;
  event?: GrayLogEvent;
  parameter?: string;
  /** true/1 = success, false/0 = failure */
  status?: boolean | number;
  remarks?: string;
  menu?: string;
  sub_menu?: string;
  access_id?: string;
  access_data?: string;
  user_id?: string;
  full_name?: string;
  short_message?: string;
  browser?: string;
  equipment?: string;
  ip_address?: string;
  url?: string;
  /** Extra keys when custom=true */
  [key: string]: unknown;
}

export interface GelfAuditPayload {
  action: string;
  status: AuditLogStatus;
  statusDetail?: string | null;
  module: string;
  resourceType?: string | null;
  resourceId?: string | null;
  actorUserId?: number | null;
  actorSnapshot?: AuditActorSnapshot | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Sanitized before-state (e.g. email/username) for parameter — never passwords. */
  beforeState?: Record<string, unknown> | null;
}

export interface GelfHttpAccessPayload {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress?: string | null;
  userId?: string | null;
  fullName?: string | null;
  correlationId?: string | null;
  userAgent?: string | null;
  /** Override path-derived menu when SPA headers provide labels */
  menu?: string | null;
  subMenu?: string | null;
  pageUrl?: string | null;
  accessData?: string | null;
  parameter?: string | null;
  remarks?: string | null;
  url?: string | null;
}

export interface GelfClientOptions {
  host: string;
  port: number;
  facility: string;
  protocol: GelfProtocol;
  /** When true, every ship is printed to the Nest console (for diagnosing Graylog ingest). */
  debug?: boolean;
}

/**
 * Build a GELF 1.1 payload from grayLog() manual fields.
 * `short_message` defaults to Thai messageShort with full_name. `host` is system source name.
 */
export function buildGrayLogPayload(
  logData: GrayLogData,
  logLevel: number = GelfLevel.INFO,
  logCustom = false,
  defaultSource = 'buuget',
): Record<string, unknown> {
  const fullName =
    typeof logData.full_name === 'string' ? logData.full_name.trim() : '';
  const userId =
    typeof logData.user_id === 'string' ? logData.user_id.trim() : '';
  const event = typeof logData.event === 'string' ? logData.event.trim() : '';

  let shortMessage: string;
  if (
    typeof logData.short_message === 'string' &&
    logData.short_message.length > 0
  ) {
    shortMessage = logData.short_message;
  } else if (event === 'middleware' || fullName || userId) {
    shortMessage = `ผู้เข้าใช้งาน : ${fullName}`;
  } else {
    shortMessage = event || defaultSource;
  }

  const source =
    typeof logData.source === 'string' && logData.source.trim().length > 0
      ? logData.source.trim()
      : defaultSource;

  const level = clampLevel(logLevel);

  const status =
    typeof logData.status === 'boolean'
      ? logData.status
      : typeof logData.status === 'number'
        ? logData.status
        : undefined;

  const payload: Record<string, unknown> = {
    version: '1.1',
    host: source,
    short_message: shortMessage.slice(0, 250),
    timestamp: Date.now() / 1000,
    level,
    _event: event || undefined,
    _parameter:
      typeof logData.parameter === 'string' ? logData.parameter : undefined,
    _status: status,
    _menu: typeof logData.menu === 'string' ? logData.menu : undefined,
    _sub_menu:
      typeof logData.sub_menu === 'string' ? logData.sub_menu : undefined,
    _remarks: typeof logData.remarks === 'string' ? logData.remarks : undefined,
    _access_id:
      typeof logData.access_id === 'string' ? logData.access_id : undefined,
    _access_data:
      typeof logData.access_data === 'string' ? logData.access_data : undefined,
    _user_id: userId || undefined,
    _full_name: fullName || undefined,
    _browser: typeof logData.browser === 'string' ? logData.browser : undefined,
    _equipment:
      typeof logData.equipment === 'string' ? logData.equipment : undefined,
    _ip_address:
      typeof logData.ip_address === 'string' ? logData.ip_address : undefined,
    _url: typeof logData.url === 'string' ? logData.url : undefined,
  };

  if (logCustom) {
    for (const [key, value] of Object.entries(logData)) {
      if (GRAYLOG_STANDARD_KEYS.has(key)) {
        continue;
      }
      if (value === undefined || value === null || value === '') {
        continue;
      }
      const field = key.startsWith('_') ? key : `_${key}`;
      // Reserve GELF core keys
      if (
        field === '_version' ||
        field === '_host' ||
        field === '_short_message' ||
        field === '_timestamp' ||
        field === '_level'
      ) {
        continue;
      }
      payload[field] = value;
    }
  }

  return stripEmpty(payload);
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return GelfLevel.INFO;
  }
  return Math.min(7, Math.max(0, Math.trunc(level)));
}

function stripEmpty(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (nested !== undefined && nested !== null && nested !== '') {
      result[key] = nested;
    }
  }
  return result;
}

function mapAuditActionToEvent(action: string): GrayLogEvent | undefined {
  if (action === 'AUTH.LOGIN') {
    return 'login';
  }
  if (action === 'CERTIFICATE.DOWNLOAD') {
    return 'download';
  }
  if (action === 'AUDIT.EXPORT') {
    return 'export';
  }
  if (
    action.endsWith('.CREATE') ||
    action.endsWith('.ISSUE') ||
    action === 'AUTH.REGISTER' ||
    action === 'AUTH.OTP.SEND' ||
    action === 'PAYMENT.CREATE'
  ) {
    return 'insert';
  }
  if (
    action.endsWith('.UPDATE') ||
    action.endsWith('.CHANGE') ||
    action.endsWith('.CANCEL') ||
    action.endsWith('.VOID') ||
    action.endsWith('.RECONCILE') ||
    action === 'AUTH.OTP.VERIFY'
  ) {
    return 'update';
  }
  if (action.endsWith('.DELETE')) {
    return 'delete';
  }
  return undefined;
}

function parameterFromBeforeState(
  beforeState: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!beforeState) {
    return undefined;
  }
  if (typeof beforeState.email === 'string' && beforeState.email.length > 0) {
    return beforeState.email;
  }
  if (
    typeof beforeState.username === 'string' &&
    beforeState.username.length > 0
  ) {
    return beforeState.username;
  }
  return undefined;
}

/**
 * Fire-and-forget GELF client (UDP, TCP, or HTTP). Never throws to callers.
 * Class name kept as GelfUdpClient for existing injection sites.
 *
 * TCP framing matches gelf-pro: one connect per message, uncompressed JSON,
 * null frame delimiter (0x00) — required by university GELF TCP inputs.
 *
 * Diagnostics use console.* — never Nest Logger — to avoid recursion when
 * GraylogLogger mirrors every Nest log back into sendApp.
 */
@Injectable()
export class GelfUdpClient implements OnModuleInit {
  private readonly enabled: boolean;
  private readonly host: string;
  private readonly port: number;
  private readonly facility: string;
  private readonly protocol: GelfProtocol;
  private readonly debug: boolean;
  private socket: Socket | null = null;
  private oversizedWarned = false;
  private sendFailCount = 0;
  private sendOkLogged = false;
  private lastErrorMessage: string | null = null;
  private lastSentAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastErrorAt: Date | null = null;
  private static readonly HTTP_TIMEOUT_MS = 3000;
  /** Matches gelf-pro tcp adapter default. */
  private static readonly TCP_TIMEOUT_MS = 10000;

  constructor(options: GelfClientOptions) {
    this.host = options.host.trim();
    this.enabled = this.host.length > 0;
    this.port = options.port;
    this.facility = options.facility;
    this.protocol = options.protocol;
    this.debug = options.debug === true;
  }

  onModuleInit(): void {
    if (!this.enabled) {
      console.warn(
        '[GraylogLogger] Graylog logging is DISABLED (GRAYLOG_HOST is unset or empty).',
      );
      return;
    }
    console.warn(
      `[GraylogLogger] GELF ${this.protocol.toUpperCase()} enabled → ${this.host}:${this.port} facility=${this.facility}`,
    );
    this.sendApp(
      GelfLevel.INFO,
      `buu-get Graylog sink ready protocol=${this.protocol} facility=${this.facility}`,
      'GraylogLogger',
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isDebug(): boolean {
    return this.debug;
  }

  /**
   * University-manual entry point: grayLog($logData, $logLevel=6, $logCustom=false).
   */
  grayLog(
    logData: GrayLogData,
    logLevel: number = GelfLevel.INFO,
    logCustom = false,
  ): void {
    if (!this.enabled) {
      return;
    }
    this.lastSentAt = new Date();
    const payload = buildGrayLogPayload(
      logData,
      logLevel,
      logCustom,
      this.facility,
    );
    // gelf-pro sets fields.facility → Graylog searches facility:buuget
    if (this.facility.trim().length > 0) {
      payload._facility = this.facility;
    }
    this.send(payload);
    this.noteShip(
      String(logData.event ?? 'log'),
      typeof payload.short_message === 'string' ? payload.short_message : '',
    );
  }

  sendAudit(payload: GelfAuditPayload): void {
    if (!this.enabled) {
      return;
    }

    const success = payload.status === AuditLogStatus.SUCCESS;
    const level =
      payload.status === AuditLogStatus.FAILURE
        ? GelfLevel.WARNING
        : payload.status === AuditLogStatus.PARTIAL
          ? GelfLevel.NOTICE
          : GelfLevel.INFO;

    const email = payload.actorSnapshot?.email;
    const psnId = payload.actorSnapshot?.psnId;
    const userId =
      psnId ??
      (payload.actorUserId != null ? String(payload.actorUserId) : undefined);
    const parameter =
      parameterFromBeforeState(payload.beforeState) ?? email ?? undefined;
    const ua = payload.userAgent ?? undefined;
    const ip = normalizeClientIp(payload.ipAddress ?? null) ?? undefined;

    this.grayLog(
      {
        event: mapAuditActionToEvent(payload.action),
        parameter,
        status: success,
        remarks: payload.statusDetail ?? undefined,
        menu: payload.resourceType ?? payload.module ?? 'buu-get',
        user_id: userId,
        full_name: email ?? userId,
        correlation_id: payload.correlationId ?? undefined,
        ip_address: ip,
        browser: parseClientBrowser(ua),
        equipment: parseClientEquipment(ua),
      },
      level,
      true,
    );
  }

  sendHttpAccess(payload: GelfHttpAccessPayload): void {
    if (!this.enabled) {
      return;
    }

    const ok = payload.statusCode < 400;
    const level =
      payload.statusCode >= 500
        ? GelfLevel.ERROR
        : payload.statusCode >= 400
          ? GelfLevel.WARNING
          : GelfLevel.INFO;

    const fromPath = menuFromApiPath(payload.path);
    const menu =
      (payload.menu && payload.menu.trim().length > 0
        ? payload.menu.trim()
        : fromPath.menu) || fromPath.menu;
    const subMenu =
      (payload.subMenu && payload.subMenu.trim().length > 0
        ? payload.subMenu.trim()
        : fromPath.subMenu) || undefined;
    const ua = payload.userAgent ?? undefined;
    const ip = normalizeClientIp(payload.ipAddress ?? null) ?? undefined;
    const resolvedUrl = payload.url ?? payload.pageUrl ?? payload.path;

    const remarks =
      payload.remarks ??
      JSON.stringify({
        method: payload.method,
        url: resolvedUrl,
      });

    this.grayLog(
      {
        event: 'middleware',
        parameter: payload.parameter ?? '[]',
        status: ok ? 1 : 0,
        remarks,
        menu,
        sub_menu: subMenu,
        user_id: payload.userId ?? undefined,
        full_name: payload.fullName ?? undefined,
        correlation_id: payload.correlationId ?? undefined,
        ip_address: ip,
        browser: parseClientBrowser(ua),
        equipment: parseClientEquipment(ua),
        url: resolvedUrl,
        access_data: payload.accessData ?? undefined,
        http_status: payload.statusCode,
        duration_ms: payload.durationMs,
      },
      level,
      true,
    );
  }

  sendApp(
    level: GelfLevelValue,
    message: string,
    context?: string,
    stack?: string,
  ): void {
    if (!this.enabled) {
      return;
    }

    const shortMessage =
      message.length > 250 ? `${message.slice(0, 247)}...` : message;

    // Nest ops logs: no manual event token (would invent invalid events),
    // and do not set full_name to prevent "ผู้เข้าใช้งาน : Mapped route..."
    this.grayLog(
      {
        short_message: shortMessage,
        remarks: stack && stack.length > 0 ? stack : shortMessage,
        menu: context ?? undefined,
        sub_menu: 'app',
      },
      level,
      false,
    );
  }

  private send(message: Record<string, unknown>): void {
    try {
      const cleaned = stripEmpty(message);
      if (this.protocol === 'http') {
        this.sendHttp(cleaned);
        return;
      }
      if (this.protocol === 'tcp') {
        this.sendTcp(cleaned);
        return;
      }
      this.sendUdp(cleaned);
    } catch (err: unknown) {
      this.noteSendFailure(err);
    }
  }

  private sendUdp(cleaned: Record<string, unknown>): void {
    const body = Buffer.from(`${JSON.stringify(cleaned)}\0`, 'utf8');
    if (body.length > GELF_MAX_BYTES) {
      if (!this.oversizedWarned) {
        this.oversizedWarned = true;
        this.trace(
          `GELF message exceeds ${GELF_MAX_BYTES} bytes; dropped (no chunking)`,
          true,
        );
      }
      return;
    }

    const socket = this.getSocket();
    socket.send(body, this.port, this.host, (err) => {
      if (err) {
        this.noteSendFailure(err);
        return;
      }
      this.noteSendSuccess();
    });
  }

  /**
   * GELF TCP with null frame delimiter — same framing as gelf-pro tcp adapter.
   * New connection per message (no reuse).
   */
  private sendTcp(cleaned: Record<string, unknown>): void {
    const json = JSON.stringify(cleaned).replace(/\0/g, '');
    const msg = Buffer.from(json, 'utf8');
    if (msg.length + 1 > GELF_MAX_BYTES) {
      if (!this.oversizedWarned) {
        this.oversizedWarned = true;
        this.trace(
          `GELF message exceeds ${GELF_MAX_BYTES} bytes; dropped (no chunking)`,
          true,
        );
      }
      return;
    }
    const packet = Buffer.concat([msg, Buffer.from([0x00])]);

    let settled = false;
    const settle = (err?: Error | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (err) {
        this.noteSendFailure(err);
        return;
      }
      this.noteSendSuccess();
    };

    let client: NetSocket;
    try {
      client = netConnect({
        host: this.host,
        port: this.port,
        family: 4,
      });
    } catch (err: unknown) {
      this.noteSendFailure(err);
      return;
    }

    client.setTimeout(GelfUdpClient.TCP_TIMEOUT_MS, () => {
      client.emit(
        'error',
        new Error(`Timeout (${GelfUdpClient.TCP_TIMEOUT_MS} ms)`),
      );
    });

    client.once('error', (err: Error) => {
      client.end();
      client.destroy();
      settle(err);
    });

    client.once('connect', () => {
      client.end(packet, () => {
        settle(null);
      });
    });
  }

  private sendHttp(cleaned: Record<string, unknown>): void {
    const body = JSON.stringify(cleaned);
    if (Buffer.byteLength(body, 'utf8') > GELF_MAX_BYTES) {
      if (!this.oversizedWarned) {
        this.oversizedWarned = true;
        this.trace(
          `GELF message exceeds ${GELF_MAX_BYTES} bytes; dropped (no chunking)`,
          true,
        );
      }
      return;
    }

    const url = `http://${this.host}:${this.port}/gelf`;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, GelfUdpClient.HTTP_TIMEOUT_MS);

    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          this.noteSendFailure(
            new Error(`HTTP ${res.status} ${res.statusText} from ${url}`),
          );
          return;
        }
        this.noteSendSuccess();
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? `timeout after ${GelfUdpClient.HTTP_TIMEOUT_MS}ms posting ${url}`
            : err instanceof Error
              ? err.message
              : String(err);
        this.noteSendFailure(new Error(message));
      })
      .finally(() => {
        clearTimeout(timer);
      });
  }

  private noteSendSuccess(): void {
    this.lastSuccessAt = new Date();
    if (this.sendOkLogged) {
      return;
    }
    this.sendOkLogged = true;
    this.trace(
      `GELF ${this.protocol} first message accepted by ${this.host}:${this.port}`,
    );
  }

  private noteShip(kind: string, summary: string): void {
    this.trace(`GELF ship ${kind}: ${summary}`);
  }

  private noteSendFailure(err: unknown): void {
    this.sendFailCount += 1;
    this.lastErrorAt = new Date();
    this.lastErrorMessage = err instanceof Error ? err.message : String(err);
    if (this.sendFailCount <= 5) {
      this.trace(
        `GELF ${this.protocol} send failed (#${this.sendFailCount}): ${this.lastErrorMessage}`,
        true,
      );
    }
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      host: this.host || null,
      port: this.port,
      protocol: this.protocol,
      facility: this.facility,
      debug: this.debug,
      sendFailCount: this.sendFailCount,
      sendOkLogged: this.sendOkLogged,
      lastErrorMessage: this.lastErrorMessage,
      lastSentAt: this.lastSentAt ? this.lastSentAt.toISOString() : null,
      lastSuccessAt: this.lastSuccessAt
        ? this.lastSuccessAt.toISOString()
        : null,
      lastErrorAt: this.lastErrorAt ? this.lastErrorAt.toISOString() : null,
    };
  }

  async testConnection(timeoutMs = 4000): Promise<{
    ok: boolean;
    durationMs: number;
    error?: string;
    details?: string;
  }> {
    if (!this.enabled) {
      return {
        ok: false,
        durationMs: 0,
        error: 'Graylog is disabled (GRAYLOG_HOST is unset or empty)',
      };
    }

    if (this.protocol === 'http') {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`http://${this.host}:${this.port}/gelf`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timer);
        return {
          ok: res.status < 500,
          durationMs: Date.now() - start,
          details: `HTTP status: ${res.status}`,
        };
      } catch (err: unknown) {
        return {
          ok: false,
          durationMs: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    const start = Date.now();
    return new Promise((resolve) => {
      let settled = false;
      let client: NetSocket;
      try {
        client = netConnect({
          host: this.host,
          port: this.port,
          family: 4,
        });
      } catch (err: unknown) {
        resolve({
          ok: false,
          durationMs: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
        });
        return;
      }

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          client.destroy();
          resolve({
            ok: false,
            durationMs: Date.now() - start,
            error: `TCP connect timeout after ${timeoutMs}ms to ${this.host}:${this.port}`,
          });
        }
      }, timeoutMs);

      client.once('connect', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          client.end();
          client.destroy();
          resolve({
            ok: true,
            durationMs: Date.now() - start,
            details: `Successfully connected to ${this.host}:${this.port} via TCP`,
          });
        }
      });

      client.once('error', (err: Error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          client.destroy();
          resolve({
            ok: false,
            durationMs: Date.now() - start,
            error: `${err.name}: ${err.message}`,
          });
        }
      });
    });
  }

  async getDiagnosticsWithTest(): Promise<Record<string, unknown>> {
    const diagnostics = this.getDiagnostics();
    const connectionTest = await this.testConnection();
    return {
      ...diagnostics,
      connectionTest,
    };
  }

  private trace(message: string, force = false): void {
    if (!force && !this.debug) {
      return;
    }
    console.warn(`[GraylogLogger] ${message}`);
  }

  private getSocket(): Socket {
    if (!this.socket) {
      this.socket = createSocket('udp4');
      this.socket.unref();
      this.socket.on('error', (err) => {
        this.noteSendFailure(err);
      });
    }
    return this.socket;
  }
}
