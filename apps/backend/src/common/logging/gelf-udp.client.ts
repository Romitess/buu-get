import { Injectable, OnModuleInit } from '@nestjs/common';
import { createSocket, Socket } from 'dgram';
import { hostname } from 'os';
import { AuditLogStatus } from 'src/modules/audit-logs/entities/audit-log.entity';
import { AuditActorSnapshot } from 'src/modules/audit-logs/dto/record-audit.dto';

/** Practical single-datagram GELF ceiling; oversized messages are dropped (no chunking). */
export const GELF_MAX_BYTES = 8192;

/** Syslog severity levels used by GELF. */
export const GelfLevel = {
  ERROR: 3,
  WARNING: 4,
  INFO: 6,
  DEBUG: 7,
} as const;

export type GelfLevelValue = (typeof GelfLevel)[keyof typeof GelfLevel];

export type GelfProtocol = 'udp' | 'http';

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
}

export interface GelfHttpAccessPayload {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress?: string | null;
  userId?: number | null;
  correlationId?: string | null;
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
 * Fire-and-forget GELF client (UDP or HTTP). Never throws to callers.
 * Class name kept as GelfUdpClient for existing injection sites.
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
  private readonly sourceHost: string;
  private readonly debug: boolean;
  private socket: Socket | null = null;
  private oversizedWarned = false;
  private sendFailCount = 0;
  private sendOkLogged = false;
  private static readonly HTTP_TIMEOUT_MS = 3000;

  constructor(options: GelfClientOptions) {
    this.host = options.host.trim();
    this.enabled = this.host.length > 0;
    this.port = options.port;
    this.facility = options.facility;
    this.protocol = options.protocol;
    this.debug = options.debug === true;
    this.sourceHost = hostname();
  }

  onModuleInit(): void {
    if (!this.enabled) {
      return;
    }
    // Terminal breadcrumbs use [GraylogLogger] only when GRAYLOG_DEBUG=true.
    this.trace(
      `GELF ${this.protocol.toUpperCase()} enabled → ${this.host}:${this.port} facility=${this.facility}`,
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

  sendAudit(payload: GelfAuditPayload): void {
    if (!this.enabled) {
      return;
    }

    const level =
      payload.status === AuditLogStatus.FAILURE
        ? GelfLevel.ERROR
        : payload.status === AuditLogStatus.PARTIAL
          ? GelfLevel.WARNING
          : GelfLevel.INFO;

    const email = payload.actorSnapshot?.email;
    const psnId = payload.actorSnapshot?.psnId;

    this.send({
      version: '1.1',
      host: this.sourceHost,
      short_message: `${payload.action} ${payload.status}`,
      timestamp: Date.now() / 1000,
      level,
      facility: this.facility,
      _facility: this.facility,
      _event_type: 'audit',
      _action: payload.action,
      _status: payload.status,
      _status_detail: payload.statusDetail ?? undefined,
      _module: payload.module,
      _resource_type: payload.resourceType ?? undefined,
      _resource_id: payload.resourceId ?? undefined,
      _actor_user_id: payload.actorUserId ?? undefined,
      _actor_email: email ?? undefined,
      _actor_psn_id: psnId ?? undefined,
      _correlation_id: payload.correlationId ?? undefined,
      _ip_address: payload.ipAddress ?? undefined,
    });
    this.noteShip('audit', `${payload.action} ${payload.status}`);
  }

  sendHttpAccess(payload: GelfHttpAccessPayload): void {
    if (!this.enabled) {
      return;
    }

    const level =
      payload.statusCode >= 500
        ? GelfLevel.ERROR
        : payload.statusCode >= 400
          ? GelfLevel.WARNING
          : GelfLevel.INFO;

    this.send({
      version: '1.1',
      host: this.sourceHost,
      short_message: `${payload.method} ${payload.path} ${payload.statusCode}`,
      timestamp: Date.now() / 1000,
      level,
      facility: this.facility,
      _facility: this.facility,
      _event_type: 'http',
      _http_method: payload.method,
      _http_path: payload.path,
      _http_status: payload.statusCode,
      _duration_ms: payload.durationMs,
      _ip_address: payload.ipAddress ?? undefined,
      _actor_user_id: payload.userId ?? undefined,
      _correlation_id: payload.correlationId ?? undefined,
    });
    this.noteShip(
      'http',
      `${payload.method} ${payload.path} ${payload.statusCode}`,
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

    this.send({
      version: '1.1',
      host: this.sourceHost,
      short_message: shortMessage,
      full_message: stack && stack.length > 0 ? stack : undefined,
      timestamp: Date.now() / 1000,
      level,
      facility: this.facility,
      _facility: this.facility,
      _event_type: 'app',
      _context: context ?? undefined,
    });
    // App-log breadcrumbs are printed by GraylogLogger (terminal Nest line + debug ship).
  }

  private send(message: Record<string, unknown>): void {
    try {
      const cleaned = this.stripUndefined(message);
      if (this.protocol === 'http') {
        this.sendHttp(cleaned);
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
    if (this.sendOkLogged) {
      return;
    }
    this.sendOkLogged = true;
    this.trace(
      `GELF ${this.protocol} first message accepted by ${this.host}:${this.port}`,
    );
  }

  /** Terminal breadcrumb only when GRAYLOG_DEBUG=true (prefix GraylogLogger, never Nest Logger). */
  private noteShip(kind: 'audit' | 'http' | 'app', summary: string): void {
    this.trace(`GELF ship ${kind}: ${summary}`);
  }

  private noteSendFailure(err: unknown): void {
    this.sendFailCount += 1;
    if (this.sendFailCount <= 5) {
      this.trace(
        `GELF ${this.protocol} send failed (#${this.sendFailCount}): ${err instanceof Error ? err.message : String(err)}`,
        true,
      );
    }
  }

  /**
   * Debug/ops output for the terminal. Uses console.warn (not Nest Logger) to
   * avoid GraylogLogger ↔ sendApp recursion. Prefixed [GraylogLogger] per product UX.
   */
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

  private stripUndefined(
    value: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (nested !== undefined && nested !== null && nested !== '') {
        result[key] = nested;
      }
    }
    return result;
  }
}
