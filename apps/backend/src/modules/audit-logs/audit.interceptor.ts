import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { AuditLogsService } from './audit-logs.service';
import { AuditSerializer, JsonObject } from './audit.serializer';
import {
  AUDIT_CORRELATION_HEADER,
  AUDIT_METADATA_KEY,
  AUDIT_MODULE_NAME,
} from './constants/audit.constants';
import { AuditOptions } from './decorators/audit.decorator';
import { AuditActorSnapshot } from './dto/record-audit.dto';
import { AuditLogStatus } from './entities/audit-log.entity';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
    private readonly serializer: AuditSerializer,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<AuditOptions | undefined>(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();
    const correlationId = this.resolveCorrelationId(request);
    response.setHeader('X-Correlation-Id', correlationId);

    const beforeState = this.serializer.pick(request.body, options.bodyKeys);
    const ipAddress = this.extractIp(request);
    const userAgent = this.extractUserAgent(request);

    return next.handle().pipe(
      tap((data: unknown) => {
        const afterState = this.serializer.pick(data, options.resultKeys);
        const actor = this.resolveActor(request.user, afterState, beforeState);
        this.auditLogsService.recordAsync({
          action: options.action,
          module: AUDIT_MODULE_NAME,
          resourceType: options.resourceType,
          resourceId: this.resolveResourceId(options, request, data),
          status: AuditLogStatus.SUCCESS,
          actorUserId: actor.actorUserId,
          actorSnapshot: actor.actorSnapshot,
          beforeState,
          afterState,
          ipAddress,
          userAgent,
          correlationId,
        });
      }),
      catchError((err: unknown) => {
        const actor = this.resolveActor(request.user, null, beforeState);
        this.auditLogsService.recordAsync({
          action: options.action,
          module: AUDIT_MODULE_NAME,
          resourceType: options.resourceType,
          resourceId: this.resolveResourceId(options, request, undefined),
          status: AuditLogStatus.FAILURE,
          statusDetail: this.extractStatusDetail(err),
          actorUserId: actor.actorUserId,
          actorSnapshot: actor.actorSnapshot,
          beforeState,
          afterState: null,
          ipAddress,
          userAgent,
          correlationId,
        });
        return throwError(() => err);
      }),
    );
  }

  private resolveActor(
    user: AuthenticatedUser | undefined,
    afterState: JsonObject | null,
    beforeState: JsonObject | null,
  ): { actorUserId: number | null; actorSnapshot: AuditActorSnapshot | null } {
    if (user) {
      return {
        actorUserId: user.userId,
        actorSnapshot: {
          userId: user.userId,
          email: user.email,
          roles: user.roles ?? [user.role],
        },
      };
    }

    const resultUser = this.asObject(afterState?.user);
    const resultUserId = resultUser?.id;
    if (typeof resultUserId === 'number') {
      const snapshot: AuditActorSnapshot = { userId: resultUserId };
      if (typeof resultUser?.email === 'string') {
        snapshot.email = resultUser.email;
      }
      if (Array.isArray(resultUser?.roles)) {
        const roles = resultUser.roles.filter(
          (role): role is string => typeof role === 'string',
        );
        if (roles.length > 0) {
          snapshot.roles = roles;
        }
      }
      return { actorUserId: resultUserId, actorSnapshot: snapshot };
    }

    const email =
      typeof beforeState?.email === 'string' ? beforeState.email : undefined;
    if (email) {
      return { actorUserId: null, actorSnapshot: { email } };
    }

    return { actorUserId: null, actorSnapshot: null };
  }

  private resolveResourceId(
    options: AuditOptions,
    request: RequestWithUser,
    result: unknown,
  ): string | null {
    if (options.resourceIdParam) {
      const param = request.params?.[options.resourceIdParam];
      if (typeof param === 'string' && param.length > 0) {
        return param;
      }
    }
    if (options.resourceIdFrom && result !== undefined && result !== null) {
      const value = this.serializer.getPath(result, options.resourceIdFrom);
      if (typeof value === 'number' || typeof value === 'string') {
        return String(value);
      }
    }
    return null;
  }

  private resolveCorrelationId(request: RequestWithUser): string {
    const header = request.headers[AUDIT_CORRELATION_HEADER];
    if (typeof header === 'string' && header.trim().length > 0) {
      return header.trim().slice(0, 36);
    }
    return randomUUID();
  }

  private extractIp(request: RequestWithUser): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      return forwarded.split(',')[0].trim().slice(0, 45);
    }
    const ip = request.ip ?? request.socket?.remoteAddress;
    return ip ? ip.slice(0, 45) : null;
  }

  private extractUserAgent(request: RequestWithUser): string | null {
    const ua = request.headers['user-agent'];
    return typeof ua === 'string' && ua.length > 0 ? ua.slice(0, 512) : null;
  }

  private extractStatusDetail(err: unknown): string | null {
    if (err instanceof HttpException) {
      const payload = err.getResponse();
      if (typeof payload === 'string') {
        return payload.slice(0, 500);
      }
      if (payload && typeof payload === 'object' && 'message' in payload) {
        const message = payload.message;
        if (typeof message === 'string') {
          return message.slice(0, 500);
        }
        if (Array.isArray(message)) {
          return message.map(String).join('; ').slice(0, 500);
        }
      }
      return err.message.slice(0, 500);
    }
    return 'Unexpected error';
  }

  private asObject(value: unknown): JsonObject | null {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as JsonObject;
    }
    return null;
  }
}
