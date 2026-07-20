import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import { FINANCE_ROLES } from 'src/common/constants/role-groups';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
} from 'src/common/utils/authz.util';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import {
  Transaction,
  TransactionChannel,
  TransactionMatchStatus,
  TransactionPaymentMethod,
  TransactionPaymentStatus,
} from './entities/transaction.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { CreatePendingPaymentDto } from './dto/create-pending-payment.dto';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { PaymentConfig } from '../payment-configs/entities/payment-config.entity';
import { CreateTransactionFlowDto } from './dto/create-transaction-flow.dto';
import { ConfirmPaymentFlowDto } from './dto/confirm-payment-flow.dto';
import {
  TransactionStatusHistory,
  TransactionApiType,
} from '../transaction-status-history/entities/transaction-status-history.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { TransactionProfile } from '../transaction-profiles/entities/transaction-profile.entity';

export interface PendingPaymentResult {
  transaction: Transaction;
  receipt: Receipt;
}

export interface TransactionFlowResult {
  TRANX_ID: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction =
      this.transactionsRepository.create(createTransactionDto);
    return this.transactionsRepository.save(transaction);
  }

  async createTransactionForFlow(
    dto: CreateTransactionFlowDto,
  ): Promise<TransactionFlowResult> {
    return this.dataSource.transaction(async (manager) => {
      const transactionRepository = manager.getRepository(Transaction);
      const historyRepository = manager.getRepository(TransactionStatusHistory);
      const paymentConfigRepository = manager.getRepository(PaymentConfig);
      const enrollmentRepository = manager.getRepository(ExamEnrollment);

      const pcExists = await paymentConfigRepository.exists({
        where: { PC_ID: dto.pcId },
      });
      if (!pcExists) {
        throw new NotFoundException(
          `Payment config with ID ${dto.pcId} not found`,
        );
      }

      const enrollmentExists = await enrollmentRepository.exists({
        where: { ERM_ID: dto.ermId },
      });
      if (!enrollmentExists) {
        throw new NotFoundException(
          `Enrollment with ID ${dto.ermId} not found`,
        );
      }

      let transaction = await transactionRepository.findOne({
        where: { ERM_ID: dto.ermId },
        order: { TRANX_CREATED_AT: 'DESC' },
      });

      if (transaction?.TRANX_PAYMENT_STATUS === TransactionPaymentStatus.PAID) {
        throw new ConflictException(
          'A paid transaction already exists for this enrollment',
        );
      }

      const previousStatus = transaction?.TRANX_PAYMENT_STATUS ?? null;

      if (transaction) {
        transaction.PC_ID = dto.pcId;
        transaction.TRANX_AMOUNT = dto.amount;
        transaction.TRANX_QR_CODE =
          previousStatus === TransactionPaymentStatus.PENDING
            ? (transaction.TRANX_QR_CODE ?? uuidv4())
            : uuidv4();
        transaction.TRANX_PAYMENT_STATUS = TransactionPaymentStatus.PENDING;
        transaction.TRANX_MATCH_STATUS = TransactionMatchStatus.UNMATCH;
        transaction.TRANX_PAYMENT_METHOD = TransactionPaymentMethod.QR;
        transaction.TRANX_BANK_CODE = 'KTB';
        transaction.TRANX_CHANNEL = TransactionChannel.QR;
        transaction.TRANX_PAID_AT = null;
        transaction.TRANX_REJECTED_AT = null;
        transaction.TRANX_UPDATED_AT = new Date();
      } else {
        transaction = transactionRepository.create({
          ERM_ID: dto.ermId,
          PC_ID: dto.pcId,
          TRANX_QR_CODE: uuidv4(),
          TRANX_AMOUNT: dto.amount,
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PENDING,
          TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH,
          TRANX_PAYMENT_METHOD: TransactionPaymentMethod.QR,
          TRANX_BANK_CODE: 'KTB',
          TRANX_CHANNEL: TransactionChannel.QR,
          TRANX_CREATED_AT: new Date(),
        });
      }

      const savedTransaction = await transactionRepository.save(transaction);

      if (previousStatus !== TransactionPaymentStatus.PENDING) {
        const history = historyRepository.create({
          TRANX_ID: savedTransaction.TRANX_ID,
          TSH_FROM:
            previousStatus === null
              ? null
              : this.toHistoryStatus(previousStatus),
          TSH_TO: this.toHistoryStatus(TransactionPaymentStatus.PENDING),
          TSH_API_TYPE: TransactionApiType.PAYMENT,
          TSH_RESP_CODE: '000',
          TSH_RESP_MESSAGE:
            previousStatus === null
              ? 'Created pending transaction'
              : 'Restarted pending transaction',
        });
        await historyRepository.save(history);
      }

      return { TRANX_ID: savedTransaction.TRANX_ID };
    });
  }

  async confirmPaymentFlow(
    tranxId: number,
    dto: ConfirmPaymentFlowDto,
    user: AuthenticatedUser,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const transactionRepository = manager.getRepository(Transaction);
      const paymentConfigRepository = manager.getRepository(PaymentConfig);
      const historyRepository = manager.getRepository(TransactionStatusHistory);
      const refRepository = manager.getRepository(TransactionRef);

      const transaction = await transactionRepository.findOne({
        where: { TRANX_ID: tranxId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${tranxId} not found`);
      }

      const enrollment = await manager.getRepository(ExamEnrollment).findOne({
        where: { ERM_ID: transaction.ERM_ID },
      });
      this.assertEnrollmentAccess(user, enrollment);

      if (
        transaction.TRANX_PAYMENT_STATUS !== TransactionPaymentStatus.PENDING
      ) {
        throw new BadRequestException('Transaction is not in PENDING status');
      }

      const paymentConfig = await paymentConfigRepository.findOne({
        where: { PC_ID: transaction.PC_ID },
      });

      if (!paymentConfig) {
        throw new NotFoundException(
          `Payment config with ID ${transaction.PC_ID} not found`,
        );
      }

      if (!paymentConfig.PC_IS_ACTIVE) {
        throw new BadRequestException('Payment configuration is inactive');
      }

      if (
        paymentConfig.PC_EFFECTIVE_TO &&
        paymentConfig.PC_EFFECTIVE_TO < new Date()
      ) {
        throw new BadRequestException('Payment configuration is expired');
      }

      transaction.TRANX_PAYMENT_STATUS = TransactionPaymentStatus.PAID;
      transaction.TRANX_PAID_AT = new Date();
      transaction.TRANX_UPDATED_AT = new Date();
      await transactionRepository.save(transaction);

      // อัปเดตสถานะการสมัครสอบเป็น PAID
      const enrollmentRepository = manager.getRepository(ExamEnrollment);
      const enrollmentToUpdate = await enrollmentRepository.findOne({
        where: { ERM_ID: transaction.ERM_ID },
      });
      if (enrollmentToUpdate) {
        enrollmentToUpdate.ERM_STATUS = ExamEnrollmentStatus.PAID;
        await enrollmentRepository.save(enrollmentToUpdate);
      }

      const history = historyRepository.create({
        TRANX_ID: tranxId,
        TSH_FROM: this.toHistoryStatus(TransactionPaymentStatus.PENDING),
        TSH_TO: this.toHistoryStatus(TransactionPaymentStatus.PAID),
        TSH_API_TYPE: TransactionApiType.APPROVE,
        TSH_RESP_CODE: '000',
        TSH_RESP_MESSAGE: 'Payment confirmed',
      });
      await historyRepository.save(history);

      const refCreatedAt = new Date();
      const ref = refRepository.create({
        TRANX_ID: tranxId,
        TSC_REF1: dto.userCode,
        TSC_REF2: this.buildEnrollmentRefCode(transaction.ERM_ID, refCreatedAt),
        TSC_BANK_REF: paymentConfig.PC_COMP_CODE,
        TSC_PARTNER_REF: paymentConfig.PC_PROD_CODE,
      });
      await refRepository.save(ref);

      // จัดการข้อมูลใบเสร็จ
      await this.handleReceiptSync(manager, tranxId, dto);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async expireTransaction(
    tranxId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const transactionRepository = manager.getRepository(Transaction);
      const historyRepository = manager.getRepository(TransactionStatusHistory);

      const transaction = await transactionRepository.findOne({
        where: { TRANX_ID: tranxId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${tranxId} not found`);
      }

      const enrollment = await manager.getRepository(ExamEnrollment).findOne({
        where: { ERM_ID: transaction.ERM_ID },
      });
      this.assertEnrollmentAccess(user, enrollment);

      if (
        transaction.TRANX_PAYMENT_STATUS !== TransactionPaymentStatus.PENDING
      ) {
        throw new BadRequestException('Transaction is not in PENDING status');
      }

      transaction.TRANX_PAYMENT_STATUS = TransactionPaymentStatus.EXPIRED;
      transaction.TRANX_UPDATED_AT = new Date();
      await transactionRepository.save(transaction);

      const history = historyRepository.create({
        TRANX_ID: tranxId,
        TSH_FROM: this.toHistoryStatus(TransactionPaymentStatus.PENDING),
        TSH_TO: this.toHistoryStatus(TransactionPaymentStatus.EXPIRED),
        TSH_API_TYPE: TransactionApiType.PAYMENT,
        TSH_RESP_CODE: '000',
        TSH_RESP_MESSAGE: 'Payment expired',
      });
      await historyRepository.save(history);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleReceiptSync(
    manager: EntityManager,
    tranxId: number,
    dto: ConfirmPaymentFlowDto,
  ): Promise<void> {
    if (dto.receiptName) {
      const receiptRepository = manager.getRepository(Receipt);
      let receipt = await receiptRepository.findOne({
        where: { TRANX_ID: tranxId },
      });

      // ตรวจสอบว่าเป็นตัวเลขหรือไม่ (เพื่อเลี่ยงข้อผิดพลาด bigint ในบาง DB)
      const safeTaxId =
        dto.receiptTaxId && /^\d+$/.test(dto.receiptTaxId)
          ? dto.receiptTaxId
          : null;

      if (receipt) {
        receipt.RC_TAX_ID = safeTaxId ?? receipt.RC_TAX_ID;
        receipt.RC_NAME = dto.receiptName ?? receipt.RC_NAME;
        receipt.RC_PHONE = dto.receiptPhone ?? receipt.RC_PHONE;
        receipt.RC_ADDRESS = dto.receiptAddress ?? receipt.RC_ADDRESS;
        receipt.RC_STATUS = ReceiptStatus.UNISSUED;
        receipt.UPDATED_AT = new Date();
      } else {
        receipt = receiptRepository.create({
          TRANX_ID: tranxId,
          RC_TAX_ID: safeTaxId,
          RC_NAME: dto.receiptName,
          RC_PHONE: dto.receiptPhone,
          RC_ADDRESS: dto.receiptAddress,
          RC_STATUS: ReceiptStatus.UNISSUED,
          RC_SIGNATURE_ID: uuidv4(),
        });
      }
      receipt = await receiptRepository.save(receipt);
      await this.syncTransactionProfileFromReceipt(manager, receipt);
    }
  }

  private async syncTransactionProfileFromReceipt(
    manager: EntityManager,
    receipt: Receipt,
  ): Promise<void> {
    const profileRepository = manager.getRepository(TransactionProfile);
    const taxId = this.parseReceiptTaxId(receipt.RC_TAX_ID);

    let profile = await profileRepository.findOne({
      where: { TRANX_ID: receipt.TRANX_ID },
    });

    if (profile) {
      profile.TP_NAME = receipt.RC_NAME ?? '';
      profile.TP_ADDRESS = receipt.RC_ADDRESS ?? '';
      profile.TP_TAX_ID = taxId;
      profile.TP_PHONE = receipt.RC_PHONE ?? '';
    } else {
      profile = profileRepository.create({
        TRANX_ID: receipt.TRANX_ID,
        TP_NAME: receipt.RC_NAME ?? '',
        TP_ADDRESS: receipt.RC_ADDRESS ?? '',
        TP_TAX_ID: taxId,
        TP_PHONE: receipt.RC_PHONE ?? '',
      });
    }

    await profileRepository.save(profile);
  }

  private parseReceiptTaxId(taxId: string | null): number {
    if (!taxId) return 0;

    const parsedTaxId = parseInt(taxId, 10);
    return Number.isNaN(parsedTaxId) ? 0 : parsedTaxId;
  }

  private buildEnrollmentRefCode(
    enrollmentId: number,
    createdAt: Date,
  ): string {
    if (
      !Number.isInteger(enrollmentId) ||
      enrollmentId < 0 ||
      enrollmentId > 999999
    ) {
      throw new BadRequestException(
        'Enrollment ID must be between 0 and 999999 to generate transaction reference',
      );
    }

    const year = String(createdAt.getFullYear()).slice(-2);
    const day = String(createdAt.getDate()).padStart(2, '0');
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const enrollmentCode = String(enrollmentId).padStart(6, '0');

    return `${year}${day}${month}${enrollmentCode}`;
  }

  private toHistoryStatus(status: TransactionPaymentStatus): string {
    return String(status);
  }

  async createPendingPayment(
    dto: CreatePendingPaymentDto,
  ): Promise<PendingPaymentResult> {
    return this.dataSource.transaction(async (manager) => {
      const enrollmentRepository = manager.getRepository(ExamEnrollment);
      const transactionRepository = manager.getRepository(Transaction);
      const receiptRepository = manager.getRepository(Receipt);
      const paymentConfigRepository = manager.getRepository(PaymentConfig);

      const enrollment = await enrollmentRepository.findOne({
        where: { ERM_ID: dto.ERM_ID },
        relations: ['SESSION', 'SESSION.EXAM'],
      });
      if (!enrollment) {
        throw new NotFoundException(
          `Enrollment with ID ${dto.ERM_ID} not found`,
        );
      }

      const paymentConfigExists = await paymentConfigRepository.exists({
        where: { PC_ID: 1 },
      });
      if (!paymentConfigExists) {
        throw new NotFoundException('Payment config with ID 1 not found');
      }

      const examFee = enrollment.SESSION?.EXAM?.EXAM_FEE;
      if (examFee === null || examFee === undefined) {
        throw new BadRequestException('Exam fee is not configured');
      }
      if (Number(examFee) !== Number(dto.TRANX_AMOUNT)) {
        throw new BadRequestException('Payment amount does not match exam fee');
      }

      let transaction = await transactionRepository.findOne({
        where: { ERM_ID: dto.ERM_ID },
        relations: ['RECEIPTS'],
        order: { TRANX_CREATED_AT: 'DESC' },
      });

      if (
        transaction &&
        ![
          TransactionPaymentStatus.PENDING,
          TransactionPaymentStatus.PAID,
        ].includes(transaction.TRANX_PAYMENT_STATUS)
      ) {
        throw new ConflictException(
          'A non-pending transaction already exists for this enrollment',
        );
      }

      if (transaction) {
        transaction.PC_ID = 1;
        transaction.TRANX_AMOUNT = Number(examFee);
        transaction.TRANX_QR_CODE ||= uuidv4();
        transaction.TRANX_PAYMENT_METHOD = TransactionPaymentMethod.QR;
        transaction.TRANX_PAYMENT_STATUS = TransactionPaymentStatus.PAID;
        transaction.TRANX_MATCH_STATUS = TransactionMatchStatus.MATCH;
        transaction.TRANX_BANK_CODE = 'KTB';
        transaction.TRANX_CHANNEL = TransactionChannel.QR;
      } else {
        transaction = transactionRepository.create({
          ERM_ID: dto.ERM_ID,
          PC_ID: 1,
          TRANX_AMOUNT: Number(examFee),
          TRANX_QR_CODE: uuidv4(),
          TRANX_PAYMENT_METHOD: TransactionPaymentMethod.QR,
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
          TRANX_MATCH_STATUS: TransactionMatchStatus.MATCH,
          TRANX_BANK_CODE: 'KTB',
          TRANX_CHANNEL: TransactionChannel.QR,
        });
      }
      transaction = await transactionRepository.save(transaction);

      let receipt = transaction.RECEIPTS?.[0];
      if (receipt) {
        receipt.RC_TAX_ID = dto.RC_TAX_ID;
        receipt.RC_NAME = dto.RC_NAME;
        receipt.RC_PHONE = dto.RC_PHONE;
        receipt.RC_ADDRESS = dto.RC_ADDRESS;
        receipt.RC_STATUS = ReceiptStatus.UNISSUED;
      } else {
        receipt = receiptRepository.create({
          TRANX_ID: transaction.TRANX_ID,
          RC_TAX_ID: dto.RC_TAX_ID,
          RC_NAME: dto.RC_NAME,
          RC_PHONE: dto.RC_PHONE,
          RC_ADDRESS: dto.RC_ADDRESS,
          RC_STATUS: ReceiptStatus.UNISSUED,
          RC_SIGNATURE_ID: uuidv4(),
        });
      }
      receipt = await receiptRepository.save(receipt);
      await this.syncTransactionProfileFromReceipt(manager, receipt);
      enrollment.ERM_STATUS = ExamEnrollmentStatus.PAID;
      await enrollmentRepository.save(enrollment);

      return { transaction, receipt };
    });
  }

  async findAll(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<Transaction>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.transactionsRepository.findAndCount({
      relations: ['ENROLLMENT'],
      skip: (page - 1) * limit,
      take: limit,
      order: { TRANX_ID: 'DESC' },
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { TRANX_ID: id },
      relations: ['ENROLLMENT'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async update(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);
    Object.assign(transaction, updateTransactionDto);
    return this.transactionsRepository.save(transaction);
  }

  async updateByErmId(
    ermId: number,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction | null> {
    const transaction = await this.transactionsRepository.findOne({
      where: { ERM_ID: ermId },
      order: { TRANX_CREATED_AT: 'DESC' },
    });

    if (!transaction) {
      return null;
    }

    Object.assign(transaction, updateTransactionDto);
    return this.transactionsRepository.save(transaction);
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionsRepository.softRemove(transaction);
  }

  private assertEnrollmentAccess(
    user: AuthenticatedUser,
    enrollment: ExamEnrollment | null,
  ): void {
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found for this transaction');
    }

    assertSelfOrRoles(
      user,
      enrollment.USER_ID,
      FINANCE_ROLES,
      'Access denied: transaction does not belong to you',
    );
  }
}
