import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
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
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ '1': 1 }]),
    } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      version: 'unknown',
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
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
});
