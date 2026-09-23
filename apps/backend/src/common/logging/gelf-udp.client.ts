import { Injectable, Logger } from '@nestjs/common';
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

export interface GelfUdpClientOptions {
  host: string;
  port: number;
  facility: string;
}

@Injectable()
export class GelfUdpClient {
  private readonly logger = new Logger(GelfUdpClient.name);
  private readonly enabled: boolean;
  private readonly host: string;
  private readonly port: number;
  private readonly facility: string;
  private readonly sourceHost: string;
  private socket: Socket | null = null;
  private oversizedWarned = false;
  private sendFailedWarned = false;

  constructor(options: GelfUdpClientOptions) {
    this.host = options.host.trim();
    this.enabled = this.host.length > 0;
    this.port = options.port;
    this.facility = options.facility;
    this.sourceHost = hostname();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Fire-and-forget audit event. Never throws. Omits before/after state and secrets.
   */
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
  }

  /**
   * Fire-and-forget application log line. Never throws.
   */
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
      _event_type: 'app',
      _context: context ?? undefined,
    });
  }

  private send(message: Record<string, unknown>): void {
    try {
      const cleaned = this.stripUndefined(message);
      const body = `${JSON.stringify(cleaned)}\0`;
      if (Buffer.byteLength(body, 'utf8') > GELF_MAX_BYTES) {
        if (!this.oversizedWarned) {
          this.oversizedWarned = true;
          this.logger.warn(
            `GELF message exceeds ${GELF_MAX_BYTES} bytes; dropped (no chunking)`,
          );
        }
        return;
      }

      const socket = this.getSocket();
      socket.send(body, this.port, this.host, (err) => {
        if (err && !this.sendFailedWarned) {
          this.sendFailedWarned = true;
          this.logger.warn(
            `GELF UDP send failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      });
    } catch (err: unknown) {
      if (!this.sendFailedWarned) {
        this.sendFailedWarned = true;
        this.logger.warn(
          `GELF UDP send failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private getSocket(): Socket {
    if (!this.socket) {
      this.socket = createSocket('udp4');
      this.socket.unref();
      this.socket.on('error', (err) => {
        if (!this.sendFailedWarned) {
          this.sendFailedWarned = true;
          this.logger.warn(`GELF UDP socket error: ${err.message}`);
        }
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
