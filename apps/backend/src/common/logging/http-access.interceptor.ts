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
import {
  menuContextFromHeaders,
  resolveClientIp,
  resolvePageUrl,
} from './graylog-client.util';

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
    const ip = resolveClientIp({
      headers: request.headers as Record<string, unknown>,
      requestIp: request.ip,
      socketIp: request.socket?.remoteAddress,
    });
    const correlationId = this.extractCorrelationId(request);
    const userId = this.extractUserId(request.user);
    const fullName = this.extractFullName(request.user);
    const userAgent = this.extractUserAgent(request);
    const menuCtx = menuContextFromHeaders(
      request.headers as Record<string, unknown>,
    );
    const pageUrl = resolvePageUrl({
      headers: request.headers as Record<string, unknown>,
      protocol: request.protocol,
      host:
        typeof request.headers.host === 'string'
          ? request.headers.host
          : undefined,
      apiUrl: path,
    });

    const ship = (statusCode: number): void => {
      this.gelfClient.sendHttpAccess({
        method,
        path,
        statusCode,
        durationMs: Date.now() - started,
        ipAddress: ip,
        userId,
        fullName,
        correlationId,
        userAgent,
        menu: menuCtx.menu || null,
        subMenu: menuCtx.subMenu || null,
        pageUrl,
      });
    };

    return next.handle().pipe(
      tap(() => {
        ship(response.statusCode || 200);
      }),
      catchError((err: unknown) => {
        ship(this.statusFromError(err));
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

  private extractUserAgent(request: RequestWithUser): string | null {
    const ua = request.headers['user-agent'];
    return typeof ua === 'string' && ua.length > 0 ? ua.slice(0, 512) : null;
  }

  private extractCorrelationId(request: RequestWithUser): string | null {
    const header = request.headers['x-correlation-id'];
    if (typeof header === 'string' && header.trim().length > 0) {
      return header.trim().slice(0, 36);
    }
    return null;
  }
}
