import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import { VoidedReceipt } from './entities/voided-receipt.entity';
import { CreateVoidedReceiptDto } from './dto/create-voided-receipt.dto';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import {
  Transaction,
  TransactionPaymentStatus,
} from '../transactions/entities/transaction.entity';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import {
  TransactionApiType,
  TransactionStatusHistory,
} from '../transaction-status-history/entities/transaction-status-history.entity';

@Injectable()
export class VoidedReceiptsService {
  constructor(
    @InjectRepository(VoidedReceipt)
    private readonly voidedReceiptRepository: Repository<VoidedReceipt>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateVoidedReceiptDto,
    voidedByUserId: number,
  ): Promise<VoidedReceipt> {
    const reason = createDto.VR_REASON.trim();
    if (!reason) {
      throw new BadRequestException('Void reason is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const receiptRepository = manager.getRepository(Receipt);
      const voidedRepository = manager.getRepository(VoidedReceipt);
      const transactionRepository = manager.getRepository(Transaction);
      const enrollmentRepository = manager.getRepository(ExamEnrollment);
      const historyRepository = manager.getRepository(TransactionStatusHistory);

      const receipt = await receiptRepository.findOne({
        where: { RC_ID: createDto.RC_ID },
        relations: ['TRANSACTION', 'VOIDED_RECEIPT'],
      });

      if (!receipt) {
        throw new NotFoundException(
          `Receipt with ID ${createDto.RC_ID} not found`,
        );
      }

      if (receipt.RC_STATUS !== ReceiptStatus.ISSUED) {
        throw new BadRequestException('Only ISSUED receipts can be voided');
      }

      if (receipt.VOIDED_RECEIPT) {
        throw new ConflictException(
          `Receipt with ID ${createDto.RC_ID} is already voided`,
        );
      }

      const transaction = receipt.TRANSACTION;
      if (!transaction) {
        throw new NotFoundException(
          `Transaction for receipt ID ${createDto.RC_ID} not found`,
        );
      }

      if (
        transaction.TRANX_PAYMENT_STATUS === TransactionPaymentStatus.REFUND ||
        transaction.TRANX_PAYMENT_STATUS ===
          TransactionPaymentStatus.RECEIPT_VOIDED
      ) {
        throw new ConflictException(
          'Transaction is already refunded or receipt-voided',
        );
      }

      const previousStatus = transaction.TRANX_PAYMENT_STATUS;

      receipt.RC_STATUS = ReceiptStatus.VOIDED;
      await receiptRepository.save(receipt);

      const voidedReceipt = voidedRepository.create({
        RC_ID: receipt.RC_ID,
        VR_BY: voidedByUserId,
        VR_REASON: reason,
      });
      const savedVoided = await voidedRepository.save(voidedReceipt);

      transaction.TRANX_PAYMENT_STATUS =
        TransactionPaymentStatus.RECEIPT_VOIDED;
      await transactionRepository.save(transaction);

      await historyRepository.save(
        historyRepository.create({
          TRANX_ID: transaction.TRANX_ID,
          TSH_FROM: String(previousStatus),
          TSH_TO: String(TransactionPaymentStatus.RECEIPT_VOIDED),
          TSH_API_TYPE: TransactionApiType.REVERSAL,
          TSH_RESP_CODE: '000',
          TSH_RESP_MESSAGE: 'Receipt voided',
        }),
      );

      const enrollment = await enrollmentRepository.findOne({
        where: { ERM_ID: transaction.ERM_ID },
      });
      if (enrollment) {
        enrollment.ERM_STATUS = ExamEnrollmentStatus.CANCELLED;
        await enrollmentRepository.save(enrollment);
      }

      return savedVoided;
    });
  }

  async findAll(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<VoidedReceipt>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.voidedReceiptRepository.findAndCount({
      relations: ['RECEIPT', 'USER'],
      skip: (page - 1) * limit,
      take: limit,
      order: { VR_ID: 'DESC' },
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number): Promise<VoidedReceipt> {
    const voidedReceipt = await this.voidedReceiptRepository.findOne({
      where: { VR_ID: id },
      relations: ['RECEIPT', 'USER'],
    });
    if (!voidedReceipt) {
      throw new NotFoundException(`Voided Receipt with ID ${id} not found`);
    }
    return voidedReceipt;
  }
}
