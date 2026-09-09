import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLogsService } from './audit-logs.service';
import { AuditSerializer } from './audit.serializer';
import { AuditAction } from './constants/audit-actions';
import { AUDIT_METADATA_KEY } from './constants/audit.constants';
import { AuditLogStatus } from './entities/audit-log.entity';
import { RoleEnum } from '../roles/enums/role.enum';

describe('AuditInterceptor', () => {
  const serializer = new AuditSerializer();
  let reflector: { getAllAndOverride: jest.Mock };
  let auditLogsService: { recordAsync: jest.Mock };
  let interceptor: AuditInterceptor;
  const setHeader = jest.fn();

  const loginOptions = {
    action: AuditAction.AUTH_LOGIN,
    resourceType: 'user',
    bodyKeys: ['email'],
    resultKeys: ['user.id', 'user.email', 'user.roles'],
    resourceIdFrom: 'user.id',
  };

  const createContext = (body: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          body,
          params: {},
          headers: {},
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        }),
        getResponse: () => ({ setHeader }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    auditLogsService = { recordAsync: jest.fn() };
    interceptor = new AuditInterceptor(
      reflector as unknown as Reflector,
      auditLogsService as unknown as AuditLogsService,
      serializer,
    );
    setHeader.mockClear();
  });

  it('does not write when @Audit metadata is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = await lastValueFrom(
      interceptor.intercept(createContext({}), {
        handle: () => of({ ok: true }),
      }),
    );
    expect(result).toEqual({ ok: true });
    expect(auditLogsService.recordAsync).not.toHaveBeenCalled();
  });

  it('records SUCCESS without tokens or passwords', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === AUDIT_METADATA_KEY ? loginOptions : undefined,
    );

    await lastValueFrom(
      interceptor.intercept(
        createContext({ email: 'a@b.com', password: 'secret' }),
        {
          handle: () =>
            of({
              accessToken: 'jwt-token',
              user: { id: 12, email: 'a@b.com', roles: [RoleEnum.CANDIDATE] },
            }),
        },
      ),
    );

    expect(auditLogsService.recordAsync).toHaveBeenCalledTimes(1);
    const payload = auditLogsService.recordAsync.mock.calls[0][0] as {
      status: AuditLogStatus;
      beforeState: Record<string, unknown> | null;
      afterState: Record<string, unknown> | null;
      resourceId: string | null;
      actorUserId: number | null;
    };
    expect(payload.status).toBe(AuditLogStatus.SUCCESS);
    expect(payload.resourceId).toBe('12');
    expect(payload.actorUserId).toBe(12);
    expect(payload.beforeState).toEqual({ email: 'a@b.com' });
    expect(payload.afterState).toEqual({
      user: { id: 12, email: 'a@b.com', roles: [RoleEnum.CANDIDATE] },
    });
    expect(JSON.stringify(payload)).not.toContain('secret');
    expect(JSON.stringify(payload)).not.toContain('jwt-token');
  });

  it('records FAILURE for thrown HttpException', async () => {
    reflector.getAllAndOverride.mockReturnValue(loginOptions);

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createContext({ email: 'a@b.com', password: 'secret' }),
          {
            handle: () =>
              throwError(
                () => new BadRequestException('Invalid email or password'),
              ),
          },
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(auditLogsService.recordAsync).toHaveBeenCalledTimes(1);
    const payload = auditLogsService.recordAsync.mock.calls[0][0] as {
      status: AuditLogStatus;
      statusDetail: string;
      actorUserId: number | null;
      beforeState: Record<string, unknown> | null;
    };
    expect(payload.status).toBe(AuditLogStatus.FAILURE);
    expect(payload.statusDetail).toBe('Invalid email or password');
    expect(payload.actorUserId).toBeNull();
    expect(payload.beforeState).toEqual({ email: 'a@b.com' });
  });
});
