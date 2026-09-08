import { BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SystemSettingsService } from './system-settings.service';
import { SystemSetting } from './entities/system-setting.entity';
import { SystemSettingAuditLog } from './entities/system-setting-audit-log.entity';
import { SYSTEM_SETTING_KEYS } from './constants/system-settings.catalog';

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;
  let settingsRepo: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let auditRepo: {
    save: jest.Mock;
    create: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(() => {
    settingsRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (entity: unknown) => entity),
      create: jest.fn((entity: unknown) => entity),
    };
    auditRepo = {
      save: jest.fn(async (entity: unknown) => entity),
      create: jest.fn((entity: unknown) => entity),
    };
    dataSource = {
      transaction: jest.fn(async (cb: (manager: unknown) => Promise<unknown>) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === SystemSetting) return settingsRepo;
            if (entity === SystemSettingAuditLog) return auditRepo;
            throw new Error('unexpected entity');
          },
        }),
      ),
    };

    service = new SystemSettingsService(
      settingsRepo as unknown as Repository<SystemSetting>,
      auditRepo as unknown as Repository<SystemSettingAuditLog>,
      dataSource as unknown as DataSource,
    );
  });

  it('returns catalog defaults when DB is empty (SS-U-001)', async () => {
    const items = await service.findAll();
    const fee = items.find(
      (i) => i.key === SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FEE_THB,
    );
    expect(fee?.value).toBe('500');
    expect(fee?.defaultValue).toBe('500');
  });

  it('getNumber uses DB value when present (SS-U-002)', async () => {
    settingsRepo.find.mockResolvedValue([
      {
        SS_ID: 1,
        SETTING_KEY: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FEE_THB,
        SETTING_GROUP: 'exam',
        SETTING_VALUE: '750',
        SETTING_TYPE: 'number',
        UPDATED_BY: null,
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    ]);

    await expect(
      service.getNumber(SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FEE_THB),
    ).resolves.toBe(750);
  });

  it('rejects invalid tax id (SS-U-003)', async () => {
    await expect(
      service.updateMany(
        [{ key: SYSTEM_SETTING_KEYS.ORG_TAX_ID, value: '123' }],
        9,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid exam.defaultType (SS-U-005)', async () => {
    await expect(
      service.updateMany(
        [{ key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_TYPE, value: 'รอบอื่น' }],
        9,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid exam.defaultFormat (SS-U-006)', async () => {
    await expect(
      service.updateMany(
        [{ key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FORMAT, value: 'ออนไลน์' }],
        9,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts valid exam.defaultType and exam.defaultFormat (SS-U-007)', async () => {
    settingsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        SS_ID: 1,
        SETTING_KEY: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_TYPE,
        SETTING_GROUP: 'exam',
        SETTING_VALUE: 'รอบพิเศษ',
        SETTING_TYPE: 'string',
        UPDATED_BY: 9,
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
      {
        SS_ID: 2,
        SETTING_KEY: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FORMAT,
        SETTING_GROUP: 'exam',
        SETTING_VALUE: 'กระดาษ',
        SETTING_TYPE: 'string',
        UPDATED_BY: 9,
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    ]);

    await expect(
      service.updateMany(
        [
          { key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_TYPE, value: 'รอบพิเศษ' },
          { key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FORMAT, value: 'กระดาษ' },
        ],
        9,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_TYPE,
          value: 'รอบพิเศษ',
        }),
        expect.objectContaining({
          key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FORMAT,
          value: 'กระดาษ',
        }),
      ]),
    );
  });

  it('updates value and writes audit log (SS-U-004)', async () => {
    settingsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        SS_ID: 1,
        SETTING_KEY: SYSTEM_SETTING_KEYS.PAYMENT_SESSION_TTL_MINUTES,
        SETTING_GROUP: 'payment',
        SETTING_VALUE: '45',
        SETTING_TYPE: 'integer',
        UPDATED_BY: 9,
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    ]);

    await service.updateMany(
      [
        {
          key: SYSTEM_SETTING_KEYS.PAYMENT_SESSION_TTL_MINUTES,
          value: '45',
        },
      ],
      9,
    );

    expect(settingsRepo.save).toHaveBeenCalled();
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        SETTING_KEY: SYSTEM_SETTING_KEYS.PAYMENT_SESSION_TTL_MINUTES,
        OLD_VALUE: '30',
        NEW_VALUE: '45',
        ACTOR_USER_ID: 9,
      }),
    );
  });
});
