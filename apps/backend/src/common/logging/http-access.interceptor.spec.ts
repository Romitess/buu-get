import { CallHandler, ExecutionContext, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { GelfUdpClient } from './gelf-udp.client';
import { HttpAccessInterceptor } from './http-access.interceptor';

describe('HttpAccessInterceptor', () => {
  let gelfClient: { isEnabled: jest.Mock; sendHttpAccess: jest.Mock };
  let interceptor: HttpAccessInterceptor;

  const makeContext = (path: string, method = 'GET') => {
    const request = {
      method,
      originalUrl: path,
      url: path,
      headers: {},
      ip: '127.0.0.1',
      user: { userId: 9, actorType: 'user', email: 'a@b.com' },
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

  it('ships successful requests as http events', () => {
    const next: CallHandler = { handle: () => of({ ok: true }) };
    interceptor
      .intercept(makeContext('/api/auth/login', 'POST'), next)
      .subscribe();
    expect(gelfClient.sendHttpAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 200,
        userId: '9',
        fullName: 'a@b.com',
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
