import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok when DB ping succeeds', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ '1': 1 }]),
    } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
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
