import { NotFoundException } from '@nestjs/common';
import { IsNull, type DataSource, type Repository } from 'typeorm';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';
import type { FundSourcesService } from '../fund-sources/fund-sources.service';
import type { User } from '../users/entities/user.entity';
import { NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY } from './constants/notification.constants';
import type { NotificationRecipient } from './entities/notification-recipient.entity';
import type { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

type UserQueryBuilder = {
  innerJoin: jest.Mock;
  where: jest.Mock;
  select: jest.Mock;
  getMany: jest.Mock;
};

const financeUser: AuthenticatedUser = {
  userId: 10,
  email: 'finance@example.com',
  role: RoleEnum.FINANCE,
  roles: [RoleEnum.FINANCE],
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: {
    findOne: jest.Mock;
  };
  let recipientRepository: {
    findAndCount: jest.Mock;
    count: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let userQueryBuilder: UserQueryBuilder;
  let userRepository: {
    createQueryBuilder: jest.Mock;
  };
  let fundSourcesService: {
    getDailyRevenue: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(() => {
    notificationRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    recipientRepository = {
      findAndCount: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    userQueryBuilder = {
      innerJoin: jest.fn(),
      where: jest.fn(),
      select: jest.fn(),
      getMany: jest.fn().mockResolvedValue([{ USER_ID: 10 }, { USER_ID: 11 }]),
    };
    userQueryBuilder.innerJoin.mockReturnValue(userQueryBuilder);
    userQueryBuilder.where.mockReturnValue(userQueryBuilder);
    userQueryBuilder.select.mockReturnValue(userQueryBuilder);
    userRepository = {
      createQueryBuilder: jest.fn(() => userQueryBuilder),
    };
    fundSourcesService = {
      getDailyRevenue: jest.fn().mockResolvedValue({
        rows: [{ index: 1, examName: 'BUU-GET', amount: 1500 }],
        totalAmount: 1500,
        paidCount: 3,
      }),
    };
    dataSource = {
      transaction: jest.fn(),
    };

    service = new NotificationsService(
      notificationRepository as unknown as Repository<Notification>,
      recipientRepository as unknown as Repository<NotificationRecipient>,
      userRepository as unknown as Repository<User>,
      fundSourcesService as unknown as FundSourcesService,
      dataSource as unknown as DataSource,
    );
  });

  describe('generateDailyPaymentSummary', () => {
    it('skips when there are no approved payments', async () => {
      fundSourcesService.getDailyRevenue.mockResolvedValue({
        rows: [],
        totalAmount: 0,
        paidCount: 0,
      });

      const result = await service.generateDailyPaymentSummary('2026-08-13');

      expect(result).toEqual({
        created: 0,
        skipped: true,
        reason: 'zero_payments',
        totalAmount: 0,
        paidCount: 0,
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('calls getDailyRevenue for the summary date window', async () => {
      dataSource.transaction.mockResolvedValue(2);

      await service.generateDailyPaymentSummary('2026-08-13');

      expect(fundSourcesService.getDailyRevenue).toHaveBeenCalledWith({
        startDate: '2026-08-13',
        endDate: '2026-08-13',
      });
    });

    it('fans out to ACTIVE finance users only', async () => {
      dataSource.transaction.mockResolvedValue(2);

      const result = await service.generateDailyPaymentSummary('2026-08-13');

      expect(userQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'user.ROLES_ID',
        'role',
        'role.ROLE_NAME = :role',
        { role: RoleEnum.FINANCE },
      );
      expect(userQueryBuilder.where).toHaveBeenCalledWith(
        'user.USER_STATUS = :status',
        { status: 'ACTIVE' },
      );
      expect(result.created).toBe(2);
      expect(result.skipped).toBe(false);
    });

    it('skips when there are no finance recipients', async () => {
      userQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.generateDailyPaymentSummary('2026-08-13');

      expect(result.reason).toBe('no_recipients');
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('skips when a digest for the same date already exists', async () => {
      notificationRepository.findOne.mockResolvedValue({ NTF_ID: 1 });

      const result = await service.generateDailyPaymentSummary('2026-08-13');

      expect(result.reason).toBe('duplicate');
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('inserts notification and recipients inside a transaction', async () => {
      const manager = {
        create: jest.fn((entity: unknown, data: unknown) => data),
        save: jest
          .fn()
          .mockResolvedValueOnce({ NTF_ID: 99 })
          .mockResolvedValueOnce([]),
      };
      dataSource.transaction.mockImplementation(
        async (work: (mgr: typeof manager) => Promise<number>) => work(manager),
      );

      const result = await service.generateDailyPaymentSummary('2026-08-13');

      expect(manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          NTF_TYPE: NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY,
          NTF_DEDUPE_KEY: 'daily_payment_summary:2026-08-13',
          NTF_LINK:
            '/admin/daily-revenue-report?startDate=2026-08-13&endDate=2026-08-13',
        }),
      );
      expect(result.created).toBe(2);
    });
  });

  describe('findAll', () => {
    it('returns paginated notifications scoped to the caller', async () => {
      const payload = {
        periodDate: '2026-08-13',
        totalAmount: 1500,
        paidCount: 3,
        rows: [{ index: 1, examName: 'BUU-GET', amount: 1500 }],
      };
      recipientRepository.findAndCount.mockResolvedValue([
        [
          {
            NTR_ID: 1,
            NTF_ID: 7,
            USER_ID: 10,
            NTR_READ_AT: null,
            CREATED_AT: new Date('2026-08-14T00:00:00.000Z'),
            NOTIFICATION: {
              NTF_ID: 7,
              NTF_TYPE: NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY,
              NTF_TITLE: 'สรุปการชำระเงินประจำวัน',
              NTF_BODY: 'body',
              NTF_PAYLOAD: JSON.stringify(payload),
              NTF_LINK: '/admin/daily-revenue-report',
              CREATED_AT: new Date('2026-08-14T00:00:00.000Z'),
            },
          },
        ],
        1,
      ]);

      const result = await service.findAll(financeUser, { page: 1, limit: 10 });

      expect(recipientRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { USER_ID: 10 },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.data[0]?.NTF_ID).toBe(7);
      expect(result.data[0]?.NTF_PAYLOAD.paidCount).toBe(3);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('counts only unread rows for the caller', async () => {
      recipientRepository.count.mockResolvedValue(4);

      const result = await service.getUnreadCount(financeUser);

      expect(recipientRepository.count).toHaveBeenCalledWith({
        where: { USER_ID: 10, NTR_READ_AT: IsNull() },
      });
      expect(result).toEqual({ count: 4 });
    });
  });

  describe('markRead', () => {
    it('sets NTR_READ_AT when unread', async () => {
      const recipient = {
        NTR_ID: 1,
        NTF_ID: 7,
        USER_ID: 10,
        NTR_READ_AT: null as Date | null,
        NOTIFICATION: {
          NTF_ID: 7,
          NTF_TYPE: NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY,
          NTF_TITLE: 'title',
          NTF_BODY: 'body',
          NTF_PAYLOAD: JSON.stringify({
            periodDate: '2026-08-13',
            totalAmount: 0,
            paidCount: 1,
            rows: [],
          }),
          NTF_LINK: '/admin/daily-revenue-report',
          CREATED_AT: new Date('2026-08-14T00:00:00.000Z'),
        },
      };
      recipientRepository.findOne.mockResolvedValue(recipient);
      recipientRepository.save.mockImplementation((row: typeof recipient) =>
        Promise.resolve(row),
      );

      const result = await service.markRead(financeUser, 7);

      expect(recipientRepository.save).toHaveBeenCalled();
      expect(result.NTF_READ_AT).toBeInstanceOf(Date);
    });

    it('is idempotent when already read', async () => {
      const readAt = new Date('2026-08-14T01:00:00.000Z');
      recipientRepository.findOne.mockResolvedValue({
        NTR_ID: 1,
        NTF_ID: 7,
        USER_ID: 10,
        NTR_READ_AT: readAt,
        NOTIFICATION: {
          NTF_ID: 7,
          NTF_TYPE: NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY,
          NTF_TITLE: 'title',
          NTF_BODY: 'body',
          NTF_PAYLOAD: '{}',
          NTF_LINK: null,
          CREATED_AT: readAt,
        },
      });

      const result = await service.markRead(financeUser, 7);

      expect(recipientRepository.save).not.toHaveBeenCalled();
      expect(result.NTF_READ_AT).toEqual(readAt);
    });

    it('throws NotFoundException when the notification is not owned', async () => {
      recipientRepository.findOne.mockResolvedValue(null);

      await expect(service.markRead(financeUser, 99)).rejects.toThrow(
        NotFoundException,
      );
      expect(recipientRepository.findOne).toHaveBeenCalledWith({
        where: { USER_ID: 10, NTF_ID: 99 },
        relations: ['NOTIFICATION'],
      });
    });
  });

  describe('markAllRead', () => {
    it('updates unread rows for the caller', async () => {
      recipientRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.markAllRead(financeUser);

      expect(recipientRepository.update).toHaveBeenCalledWith(
        { USER_ID: 10, NTR_READ_AT: IsNull() },
        { NTR_READ_AT: expect.any(Date) as Date },
      );
      expect(result).toEqual({ updated: 2 });
    });
  });
});
