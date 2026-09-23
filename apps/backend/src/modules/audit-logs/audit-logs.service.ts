import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { GelfUdpClient } from 'src/common/logging/gelf-udp.client';
import { AuditSerializer, JsonObject } from './audit.serializer';
import {
  AUDIT_MODULE_NAME,
  AUDIT_EXPORT_MAX_ROWS,
} from './constants/audit.constants';
import {
  AuditLogsQueryDto,
  AuditLogResponseDto,
} from './dto/audit-logs-query.dto';
import { AuditActorSnapshot, RecordAuditInput } from './dto/record-audit.dto';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly serializer: AuditSerializer,
    private readonly gelfClient: GelfUdpClient,
  ) {}

  async record(
    input: RecordAuditInput,
    manager?: EntityManager,
  ): Promise<AuditLog> {
    const repo = manager
      ? manager.getRepository(AuditLog)
      : this.auditLogRepository;

    const afterState = this.sanitizeState(input.afterState ?? null);
    const beforeState = this.sanitizeState(input.beforeState ?? null);
    const actorSnapshot = this.sanitizeActorSnapshot(
      input.actorSnapshot ?? null,
    );
    const module = input.module ?? AUDIT_MODULE_NAME;
    const resourceId = this.truncate(input.resourceId ?? null, 64);
    const statusDetail = this.truncate(input.statusDetail ?? null, 500);
    const ipAddress = this.truncate(input.ipAddress ?? null, 45);
    const correlationId = this.truncate(input.correlationId ?? null, 36);

    // Dual-write: Graylog after sanitize, independent of MySQL success (never throws).
    try {
      this.gelfClient.sendAudit({
        action: input.action,
        status: input.status,
        statusDetail,
        module,
        resourceType: input.resourceType ?? null,
        resourceId,
        actorUserId: input.actorUserId ?? null,
        actorSnapshot,
        correlationId,
        ipAddress,
      });
    } catch (err: unknown) {
      this.logger.warn(
        `Graylog audit ship failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const row = repo.create({
      AL_ACTOR_USER_ID: input.actorUserId ?? null,
      AL_ACTOR_SNAPSHOT: this.toJsonText(actorSnapshot),
      AL_ACTION: input.action,
      AL_MODULE: module,
      AL_RESOURCE_TYPE: input.resourceType ?? null,
      AL_RESOURCE_ID: resourceId,
      AL_STATUS: input.status,
      AL_STATUS_DETAIL: statusDetail,
      AL_BEFORE_STATE: this.toJsonText(beforeState),
      AL_AFTER_STATE: this.toJsonText(afterState),
      AL_IP_ADDRESS: ipAddress,
      AL_USER_AGENT: this.truncate(input.userAgent ?? null, 512),
      AL_CORRELATION_ID: correlationId,
    });

    return repo.save(row);
  }

  /** Fire-and-forget: a failed write must never fail the business transaction. */
  recordAsync(input: RecordAuditInput): void {
    void this.record(input).catch((err: unknown) => {
      this.logger.error(
        'audit write failed',
        err instanceof Error ? err.stack : String(err),
      );
    });
  }

  async findAll(
    query: AuditLogsQueryDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const qb = this.buildFilterQuery(query);
    qb.orderBy('log.CREATED_AT', 'DESC').addOrderBy('log.AL_ID', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(
      rows.map((row) => this.toResponse(row)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<AuditLogResponseDto> {
    const row = await this.auditLogRepository.findOne({ where: { AL_ID: id } });
    if (!row) {
      throw new NotFoundException('Audit log not found');
    }
    return this.toResponse(row);
  }

  async exportRows(query: AuditLogsQueryDto): Promise<AuditLogResponseDto[]> {
    const limit = Math.min(
      query.limit ?? AUDIT_EXPORT_MAX_ROWS,
      AUDIT_EXPORT_MAX_ROWS,
    );
    const qb = this.buildFilterQuery(query);
    qb.orderBy('log.CREATED_AT', 'DESC').addOrderBy('log.AL_ID', 'DESC');
    qb.take(limit);
    const rows = await qb.getMany();
    return rows.map((row) => this.toResponse(row));
  }

  private buildFilterQuery(
    query: AuditLogsQueryDto,
  ): SelectQueryBuilder<AuditLog> {
    const qb = this.auditLogRepository.createQueryBuilder('log');

    if (query.from) {
      qb.andWhere('log.CREATED_AT >= :from', {
        from: this.normalizeRangeStart(query.from),
      });
    }
    if (query.to) {
      qb.andWhere('log.CREATED_AT <= :to', {
        to: this.normalizeRangeEnd(query.to),
      });
    }
    if (query.actorUserId !== undefined) {
      qb.andWhere('log.AL_ACTOR_USER_ID = :actorUserId', {
        actorUserId: query.actorUserId,
      });
    }
    if (query.action) {
      qb.andWhere('log.AL_ACTION = :action', { action: query.action });
    }
    if (query.module) {
      qb.andWhere('log.AL_MODULE = :module', { module: query.module });
    }
    if (query.status) {
      qb.andWhere('log.AL_STATUS = :status', { status: query.status });
    }
    if (query.resourceType) {
      qb.andWhere('log.AL_RESOURCE_TYPE = :resourceType', {
        resourceType: query.resourceType,
      });
    }
    if (query.resourceId) {
      qb.andWhere('log.AL_RESOURCE_ID = :resourceId', {
        resourceId: query.resourceId,
      });
    }

    return qb;
  }

  private sanitizeState(
    state: Record<string, unknown> | null,
  ): JsonObject | null {
    if (!state) {
      return null;
    }
    const stripped = this.serializer.stripDenied(state);
    if (
      stripped === null ||
      typeof stripped !== 'object' ||
      Array.isArray(stripped)
    ) {
      return null;
    }
    return this.serializer.capSize(stripped as JsonObject);
  }

  private sanitizeActorSnapshot(
    snapshot: AuditActorSnapshot | null,
  ): AuditActorSnapshot | null {
    if (!snapshot) {
      return null;
    }
    const next: AuditActorSnapshot = {};
    if (typeof snapshot.userId === 'number') {
      next.userId = snapshot.userId;
    }
    if (typeof snapshot.psnId === 'string' && snapshot.psnId.length > 0) {
      next.psnId = snapshot.psnId;
    }
    if (typeof snapshot.email === 'string' && snapshot.email.length > 0) {
      next.email = snapshot.email;
    }
    if (
      Array.isArray(snapshot.roles) &&
      snapshot.roles.every((role) => typeof role === 'string')
    ) {
      next.roles = snapshot.roles;
    }
    return Object.keys(next).length > 0 ? next : null;
  }

  private toJsonText(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return JSON.stringify(value);
  }

  private parseJsonObject(raw: string | null): Record<string, unknown> | null {
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private toResponse(row: AuditLog): AuditLogResponseDto {
    return {
      id: row.AL_ID,
      actorUserId: row.AL_ACTOR_USER_ID,
      actorSnapshot: this.parseJsonObject(row.AL_ACTOR_SNAPSHOT),
      action: row.AL_ACTION,
      module: row.AL_MODULE,
      resourceType: row.AL_RESOURCE_TYPE,
      resourceId: row.AL_RESOURCE_ID,
      status: row.AL_STATUS,
      statusDetail: row.AL_STATUS_DETAIL,
      beforeState: this.parseJsonObject(row.AL_BEFORE_STATE),
      afterState: this.parseJsonObject(row.AL_AFTER_STATE),
      ipAddress: row.AL_IP_ADDRESS,
      userAgent: row.AL_USER_AGENT,
      correlationId: row.AL_CORRELATION_ID,
      createdAt: row.CREATED_AT,
    };
  }

  private truncate(value: string | null, max: number): string | null {
    if (value === null) {
      return null;
    }
    return value.length <= max ? value : value.slice(0, max);
  }

  private normalizeRangeStart(value: string): string {
    return value.length === 10 ? `${value} 00:00:00.000000` : value;
  }

  private normalizeRangeEnd(value: string): string {
    return value.length === 10 ? `${value} 23:59:59.999999` : value;
  }
}
