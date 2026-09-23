import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { GelfUdpClient } from './gelf-udp.client';

type RequestWithUser = Request & { user?: AuthenticatedUser };

const SKIP_PATH_PREFIXES = ['/api/health', '/api/docs'];

/**
 * Ships every HTTP request/response to Graylog via grayLog() field schema
 * (no body — avoids secrets). No-op when Graylog is disabled.
 */
@Injectable()
export class HttpAccessInterceptor implements NestInterceptor {
  constructor(private readonly gelfClient: GelfUdpClient) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.gelfClient.isEnabled()) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();
    const path = request.originalUrl?.split('?')[0] ?? request.url ?? '';

    if (SKIP_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return next.handle();
    }

    const started = Date.now();
    const method = request.method ?? 'UNKNOWN';
    const ip = this.extractIp(request);
    const correlationId = this.extractCorrelationId(request);
    const userId = this.extractUserId(request.user);
    const fullName = this.extractFullName(request.user);

    return next.handle().pipe(
      tap(() => {
        this.gelfClient.sendHttpAccess({
          method,
          path,
          statusCode: response.statusCode || 200,
          durationMs: Date.now() - started,
          ipAddress: ip,
          userId,
          fullName,
          correlationId,
        });
      }),
      catchError((err: unknown) => {
        this.gelfClient.sendHttpAccess({
          method,
          path,
          statusCode: this.statusFromError(err),
          durationMs: Date.now() - started,
          ipAddress: ip,
          userId,
          fullName,
          correlationId,
        });
        return throwError(() => err);
      }),
    );
  }

  private statusFromError(err: unknown): number {
    if (err instanceof HttpException) {
      return err.getStatus();
    }
    return 500;
  }

  private extractUserId(user: AuthenticatedUser | undefined): string | null {
    if (!user) {
      return null;
    }
    if (user.actorType === 'person' && user.personId) {
      return user.personId;
    }
    if (typeof user.userId === 'number') {
      return String(user.userId);
    }
    return null;
  }

  private extractFullName(user: AuthenticatedUser | undefined): string | null {
    if (!user?.email) {
      return null;
    }
    return user.email;
  }

  private extractIp(request: RequestWithUser): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      return forwarded.split(',')[0].trim().slice(0, 45);
    }
    return request.ip?.slice(0, 45) ?? null;
  }

  private extractCorrelationId(request: RequestWithUser): string | null {
    const header = request.headers['x-correlation-id'];
    if (typeof header === 'string' && header.trim().length > 0) {
      return header.trim().slice(0, 36);
    }
    return null;
  }
}
