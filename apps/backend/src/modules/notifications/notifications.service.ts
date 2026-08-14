import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { getYesterdayBangkokDateOnly } from 'src/common/utils/calendar-date.util';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { FundSourcesService } from '../fund-sources/fund-sources.service';
import {
  dailyPaymentSummaryDedupeKey,
  NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY,
} from './constants/notification.constants';
import {
  MarkAllReadResponseDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from './dto/notification-response.dto';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { Notification } from './entities/notification.entity';
import type { DailyPaymentSummaryPayload } from './interfaces/notification-payload.interface';

export interface GenerateDailyPaymentSummaryResult {
  created: number;
  skipped: boolean;
  reason?: 'zero_payments' | 'no_recipients' | 'duplicate';
  totalAmount: number;
  paidCount: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private isRunning = false;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private readonly recipientRepository: Repository<NotificationRecipient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fundSourcesService: FundSourcesService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('0 0 * * *', { timeZone: 'Asia/Bangkok' })
  async handleDailyPaymentSummaryCron(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      await this.generateDailyPaymentSummary();
    } catch (error: unknown) {
      this.logger.error(
        'Daily payment summary cron failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }

  async generateDailyPaymentSummary(
    summaryDate: string = getYesterdayBangkokDateOnly(),
  ): Promise<GenerateDailyPaymentSummaryResult> {
    const summary = await this.fundSourcesService.getDailyRevenue({
      startDate: summaryDate,
      endDate: summaryDate,
    });

    if (summary.paidCount <= 0 && summary.totalAmount <= 0) {
      this.logger.log(
        `Skip daily payment summary for ${summaryDate}: no approved payments`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'zero_payments',
        totalAmount: summary.totalAmount,
        paidCount: summary.paidCount,
      };
    }

    const financeUsers = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.ROLES_ID', 'role', 'role.ROLE_NAME = :role', {
        role: RoleEnum.FINANCE,
      })
      .where('user.USER_STATUS = :status', { status: 'ACTIVE' })
      .select(['user.USER_ID'])
      .getMany();

    if (financeUsers.length === 0) {
      this.logger.warn(
        `Skip daily payment summary for ${summaryDate}: no active finance users`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'no_recipients',
        totalAmount: summary.totalAmount,
        paidCount: summary.paidCount,
      };
    }

    const dedupeKey = dailyPaymentSummaryDedupeKey(summaryDate);
    const existing = await this.notificationRepository.findOne({
      where: { NTF_DEDUPE_KEY: dedupeKey },
    });
    if (existing) {
      return {
        created: 0,
        skipped: true,
        reason: 'duplicate',
        totalAmount: summary.totalAmount,
        paidCount: summary.paidCount,
      };
    }

    const payload: DailyPaymentSummaryPayload = {
      periodDate: summaryDate,
      totalAmount: summary.totalAmount,
      paidCount: summary.paidCount,
      rows: summary.rows,
    };
    const link = `/admin/daily-revenue-report?startDate=${summaryDate}&endDate=${summaryDate}`;
    const title = 'สรุปการชำระเงินประจำวัน';
    const body = `สรุปการชำระเงินวันที่ ${summaryDate}: ${summary.paidCount} รายการ รวม ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;

    try {
      const created = await this.dataSource.transaction(async (manager) => {
        const notification = manager.create(Notification, {
          NTF_TYPE: NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY,
          NTF_TITLE: title,
          NTF_BODY: body,
          NTF_PAYLOAD: JSON.stringify(payload),
          NTF_LINK: link,
          NTF_DEDUPE_KEY: dedupeKey,
        });
        const saved = await manager.save(Notification, notification);

        const recipients = financeUsers.map((user) =>
          manager.create(NotificationRecipient, {
            NTF_ID: saved.NTF_ID,
            USER_ID: user.USER_ID,
            NTR_READ_AT: null,
          }),
        );
        await manager.save(NotificationRecipient, recipients);
        return recipients.length;
      });

      this.logger.log(
        `Created daily payment summary ${summaryDate} for ${created} finance users (amount=${summary.totalAmount}, count=${summary.paidCount})`,
      );

      return {
        created,
        skipped: false,
        totalAmount: summary.totalAmount,
        paidCount: summary.paidCount,
      };
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        return {
          created: 0,
          skipped: true,
          reason: 'duplicate',
          totalAmount: summary.totalAmount,
          paidCount: summary.paidCount,
        };
      }
      throw error;
    }
  }

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;

    const [rows, total] = await this.recipientRepository.findAndCount({
      where: { USER_ID: user.userId },
      relations: ['NOTIFICATION'],
      order: { CREATED_AT: 'DESC', NTR_ID: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResponse(
      rows.map((row) => this.toResponse(row)),
      total,
      page,
      limit,
    );
  }

  async getUnreadCount(
    user: AuthenticatedUser,
  ): Promise<UnreadCountResponseDto> {
    const count = await this.recipientRepository.count({
      where: { USER_ID: user.userId, NTR_READ_AT: IsNull() },
    });
    return { count };
  }

  async markRead(
    user: AuthenticatedUser,
    notificationId: number,
  ): Promise<NotificationResponseDto> {
    const recipient = await this.findOwnedRecipient(
      user.userId,
      notificationId,
    );
    if (!recipient.NTR_READ_AT) {
      recipient.NTR_READ_AT = new Date();
      await this.recipientRepository.save(recipient);
    }
    return this.toResponse(recipient);
  }

  async markAllRead(user: AuthenticatedUser): Promise<MarkAllReadResponseDto> {
    const result = await this.recipientRepository.update(
      { USER_ID: user.userId, NTR_READ_AT: IsNull() },
      { NTR_READ_AT: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  private async findOwnedRecipient(
    userId: number,
    notificationId: number,
  ): Promise<NotificationRecipient> {
    const recipient = await this.recipientRepository.findOne({
      where: { USER_ID: userId, NTF_ID: notificationId },
      relations: ['NOTIFICATION'],
    });
    if (!recipient) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }
    return recipient;
  }

  private toResponse(
    recipient: NotificationRecipient,
  ): NotificationResponseDto {
    const notification = recipient.NOTIFICATION;
    return {
      NTF_ID: notification.NTF_ID,
      NTF_TYPE: notification.NTF_TYPE,
      NTF_TITLE: notification.NTF_TITLE,
      NTF_BODY: notification.NTF_BODY,
      NTF_PAYLOAD: this.parsePayload(notification.NTF_PAYLOAD),
      NTF_LINK: notification.NTF_LINK,
      NTF_READ_AT: recipient.NTR_READ_AT,
      CREATED_AT: notification.CREATED_AT,
    };
  }

  private parsePayload(raw: string): DailyPaymentSummaryPayload {
    try {
      return JSON.parse(raw) as DailyPaymentSummaryPayload;
    } catch {
      return {
        periodDate: '',
        totalAmount: 0,
        paidCount: 0,
        rows: [],
      };
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driver = error.driverError as { code?: string; errno?: number };
    return driver.code === 'ER_DUP_ENTRY' || driver.errno === 1062;
  }
}
