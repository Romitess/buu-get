import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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

export interface PendingPaymentResult {
  transaction: Transaction;
  receipt: Receipt;
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
        transaction.TRANX_MATCH_STATUS = TransactionMatchStatus.UNMATCH;
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
          TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH,
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
      enrollment.ERM_STATUS = ExamEnrollmentStatus.PAID;
      await enrollmentRepository.save(enrollment);

      return { transaction, receipt };
    });
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find({ relations: ['ENROLLMENT'] });
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
}
