import { Logger, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { AuditLogsService } from './audit-logs.service';
import { AuditSerializer } from './audit.serializer';
import { AuditAction } from './constants/audit-actions';
import { AuditLog, AuditLogStatus } from './entities/audit-log.entity';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let qb: {
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
    getMany: jest.Mock;
  };

  const savedRow: AuditLog = {
    AL_ID: 1,
    AL_ACTOR_USER_ID: 12,
    AL_ACTOR_SNAPSHOT: JSON.stringify({ userId: 12, email: 'a@b.com' }),
    AL_ACTION: AuditAction.AUTH_LOGIN,
    AL_MODULE: 'buu-get',
    AL_RESOURCE_TYPE: 'user',
    AL_RESOURCE_ID: '12',
    AL_STATUS: AuditLogStatus.SUCCESS,
    AL_STATUS_DETAIL: null,
    AL_BEFORE_STATE: JSON.stringify({ email: 'a@b.com' }),
    AL_AFTER_STATE: JSON.stringify({ user: { id: 12 } }),
    AL_IP_ADDRESS: '127.0.0.1',
    AL_USER_AGENT: 'jest',
    AL_CORRELATION_ID: 'corr-1',
    CREATED_AT: new Date('2026-09-09T01:00:00.000Z'),
  };

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[savedRow], 1]),
      getMany: jest.fn().mockResolvedValue([savedRow]),
    };
    repository = {
      create: jest.fn((payload: Partial<AuditLog>) => payload),
      save: jest.fn(async (entity: AuditLog) => ({ ...savedRow, ...entity })),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };
    service = new AuditLogsService(
      repository as unknown as Repository<AuditLog>,
      new AuditSerializer(),
    );
  });

  it('persists an insert-only row', async () => {
    await service.record({
      action: AuditAction.AUTH_LOGIN,
      status: AuditLogStatus.SUCCESS,
      actorUserId: 12,
      actorSnapshot: { userId: 12, email: 'a@b.com' },
      resourceType: 'user',
      resourceId: '12',
      beforeState: { email: 'a@b.com', password: 'secret' },
    });

    expect(repository.create).toHaveBeenCalled();
    const created = repository.create.mock.calls[0][0] as AuditLog;
    expect(created.AL_ACTION).toBe(AuditAction.AUTH_LOGIN);
    expect(created.AL_BEFORE_STATE).toBe(JSON.stringify({ email: 'a@b.com' }));
    expect(created.AL_BEFORE_STATE).not.toContain('secret');
    expect(repository.save).toHaveBeenCalled();
  });

  it('recordAsync swallows persistence errors', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    repository.save.mockRejectedValue(new Error('db down'));
    expect(() =>
      service.recordAsync({
        action: AuditAction.AUTH_LOGIN,
        status: AuditLogStatus.FAILURE,
      }),
    ).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    errorSpy.mockRestore();
  });

  it('lists with filters and pagination', async () => {
    const result = await service.findAll({
      page: 2,
      limit: 10,
      action: AuditAction.AUTH_LOGIN,
      status: AuditLogStatus.SUCCESS,
      actorUserId: 12,
      from: '2026-09-01',
      to: '2026-09-09',
    });

    expect(qb.andWhere).toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.meta.total).toBe(1);
    expect(result.data[0].action).toBe(AuditAction.AUTH_LOGIN);
    expect(result.data[0].beforeState).toEqual({ email: 'a@b.com' });
  });

  it('throws when a row is missing', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('caps export rows', async () => {
    await service.exportRows({ limit: 99999 });
    expect(qb.take).toHaveBeenCalledWith(5000);
  });
});
