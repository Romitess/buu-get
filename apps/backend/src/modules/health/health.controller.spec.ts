import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GelfUdpClient } from 'src/common/logging/gelf-udp.client';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const originalAppVersion = process.env.APP_VERSION;

  afterEach(() => {
    if (originalAppVersion === undefined) {
      delete process.env.APP_VERSION;
    } else {
      process.env.APP_VERSION = originalAppVersion;
    }
  });

  it('returns ok when DB ping succeeds', async () => {
    delete process.env.APP_VERSION;
    const queryMock = jest.fn().mockResolvedValue([{ '1': 1 }]);
    const dataSource = {
      query: queryMock,
    } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      version: 'unknown',
    });
    expect(queryMock).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns trimmed APP_VERSION from the environment', async () => {
    process.env.APP_VERSION = 'v1.2.0';
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ '1': 1 }]),
    } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      version: 'v1.2.0',
    });
  });

  it('returns 503 when DB ping fails', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns graylog diagnostics with test when gelfClient is provided', async () => {
    const dataSource = {} as unknown as DataSource;
    const mockGetDiagnostics = jest.fn().mockResolvedValue({
      enabled: true,
      host: '10.5.4.37',
      port: 12201,
      connectionTest: { ok: true, durationMs: 12 },
    });
    const gelfClient = {
      getDiagnosticsWithTest: mockGetDiagnostics,
    } as unknown as GelfUdpClient;
    const controller = new HealthController(dataSource, gelfClient);

    const res = await controller.checkGraylog();
    expect(res).toEqual({
      enabled: true,
      host: '10.5.4.37',
      port: 12201,
      connectionTest: { ok: true, durationMs: 12 },
    });
    expect(mockGetDiagnostics).toHaveBeenCalled();
  });

  it('returns fallback error when gelfClient is not provided', async () => {
    const dataSource = {} as unknown as DataSource;
    const controller = new HealthController(dataSource);

    const res = await controller.checkGraylog();
    expect(res).toEqual({
      enabled: false,
      error: 'GelfUdpClient is not registered in the application context',
    });
  });
});
