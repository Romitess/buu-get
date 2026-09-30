import { CallHandler, ExecutionContext, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { GelfUdpClient } from './gelf-udp.client';
import { HttpAccessInterceptor } from './http-access.interceptor';

describe('HttpAccessInterceptor', () => {
  let gelfClient: { isEnabled: jest.Mock; sendHttpAccess: jest.Mock };
  let interceptor: HttpAccessInterceptor;

  const makeContext = (
    path: string,
    method = 'GET',
    headers: Record<string, string> = {},
    ip = '::1',
    body?: unknown,
    params?: Record<string, unknown>,
  ) => {
    const request = {
      method,
      originalUrl: path,
      url: path,
      protocol: 'http',
      headers: {
        host: 'localhost:3000',
        'user-agent':
          'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        ...headers,
      },
      ip,
      socket: { remoteAddress: ip },
      user: { userId: 9, actorType: 'user', email: 'a@b.com' },
      body,
      params: params ?? {},
      query: {},
    };
    const response = { statusCode: 200 };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    gelfClient = {
      isEnabled: jest.fn().mockReturnValue(true),
      sendHttpAccess: jest.fn(),
    };
    interceptor = new HttpAccessInterceptor(
      gelfClient as unknown as GelfUdpClient,
    );
  });

  it('skips when Graylog disabled', () => {
    gelfClient.isEnabled.mockReturnValue(false);
    const next: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(makeContext('/api/auth/login', 'POST'), next)
      .subscribe();
    expect(gelfClient.sendHttpAccess).not.toHaveBeenCalled();
  });

  it('skips health checks', () => {
    const next: CallHandler = { handle: () => of({ ok: true }) };
    interceptor.intercept(makeContext('/api/health'), next).subscribe();
    expect(gelfClient.sendHttpAccess).not.toHaveBeenCalled();
  });

  it('ships successful requests as http events with parameter and remarks', () => {
    const next: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(
        makeContext(
          '/api/approval-settings/config-type/c5q3p254a254',
          'POST',
          {},
          '172.17.0.1',
          { draw: '1', FACDEP_ID: '12' },
          { id: '12' },
        ),
        next,
      )
      .subscribe();
    expect(gelfClient.sendHttpAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/approval-settings/config-type/c5q3p254a254',
        statusCode: 200,
        userId: '9',
        fullName: 'a@b.com',
        ipAddress: '172.17.0.1',
        userAgent: expect.stringContaining('Chrome'),
        pageUrl:
          'http://localhost:3000/api/approval-settings/config-type/c5q3p254a254',
        parameter: '["12"]',
        accessData: '{"draw":"1","FACDEP_ID":"12"}',
        remarks: JSON.stringify({
          method: 'POST',
          url: 'http://localhost:3000/api/approval-settings/config-type/c5q3p254a254',
        }),
      }),
    );
  });

  it('passes SPA menu headers when present', () => {
    const next: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(
        makeContext('/api/exam/schedules', 'GET', {
          'x-current-menu-label': 'สอบ',
          'x-current-submenu-label': 'ตาราง',
          referer: 'http://localhost:9000/exams',
        }),
        next,
      )
      .subscribe();
    expect(gelfClient.sendHttpAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        menu: 'สอบ',
        subMenu: 'ตาราง',
        pageUrl: 'http://localhost:9000/exams',
      }),
    );
  });

  it('ships failed requests with HttpException status', () => {
    const next: CallHandler = {
      handle: () => throwError(() => new HttpException('nope', 401)),
    };
    interceptor
      .intercept(makeContext('/api/auth/login', 'POST'), next)
      .subscribe({ error: () => undefined });
    expect(gelfClient.sendHttpAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        statusCode: 401,
      }),
    );
  });
});
