import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Readable } from 'stream';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import { FINANCE_ROLES } from 'src/common/constants/role-groups';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
} from 'src/common/utils/authz.util';
import { generateReceiptVerifyCode } from 'src/common/utils/verification-code.util';
import { buildReceiptNo } from 'src/common/utils/receipt-no.util';
import { buildReceiptItemDescription } from 'src/common/utils/receipt-description.util';
import { buildReceiptPdf } from 'src/common/utils/build-receipt-pdf.util';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';
import { ReceiptNumberService } from './receipt-number.service';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';

const BUU_ORGANIZATION = {
  nameTH: 'มหาวิทยาลัยบูรพา',
  nameEN: 'BURAPHA UNIVERSITY',
} as const;

async function readableToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptsRepository: Repository<Receipt>,
    private readonly receiptNumberService: ReceiptNumberService,
    private readonly platformGatewayService: PlatformGatewayService,
  ) {}

  async create(createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    const receipt = this.receiptsRepository.create({
      ...createReceiptDto,
      RC_VERIFY_CODE: generateReceiptVerifyCode(),
    });
    return this.receiptsRepository.save(receipt);
  }

  async findAll(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<Receipt>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.receiptsRepository.findAndCount({
      relations: ['TRANSACTION'],
      skip: (page - 1) * limit,
      take: limit,
      order: { RC_ID: 'DESC' },
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findIssued(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<Receipt>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.receiptsRepository.findAndCount({
      where: { RC_STATUS: ReceiptStatus.ISSUED },
      relations: [
        'TRANSACTION',
        'TRANSACTION.ENROLLMENT',
        'TRANSACTION.ENROLLMENT.USER',
        'TRANSACTION.ENROLLMENT.USER.PROFILE',
        'TRANSACTION.ENROLLMENT.SESSION',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM.FUND_SOURCE',
        'TRANSACTION.BANK_RECONCILES',
        'TRANSACTION.BANK_RECONCILES.USER',
        'TRANSACTION.BANK_RECONCILES.USER.PROFILE',
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        RC_ISSUED_AT: 'DESC',
        CREATED_AT: 'DESC',
        RC_ID: 'DESC',
      },
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findOne({
      where: { RC_ID: id },
      relations: ['TRANSACTION'],
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    return receipt;
  }

  async update(
    id: number,
    updateReceiptDto: UpdateReceiptDto,
  ): Promise<Receipt> {
    const receipt = await this.findOne(id);
    const oldStatus = receipt.RC_STATUS;
    Object.assign(receipt, updateReceiptDto);
    const newStatus = receipt.RC_STATUS;

    // If status changed to ISSUED and doesn't have a number yet, allocate it
    if (
      newStatus === ReceiptStatus.ISSUED &&
      oldStatus !== ReceiptStatus.ISSUED &&
      !receipt.RC_NO
    ) {
      await this.receiptsRepository.manager.transaction(async (manager) => {
        await this.receiptNumberService.assignOnIssue(manager, [id]);
      });
      return this.findOne(id);
    }

    return this.receiptsRepository.save(receipt);
  }

  async remove(id: number): Promise<void> {
    const receipt = await this.findOne(id);
    await this.receiptsRepository.softRemove(receipt);
  }

  async downloadReceipt(
    tranxId: number,
    user: AuthenticatedUser,
    options?: { unsigned?: boolean },
  ): Promise<Uint8Array> {
    const receipt = await this.receiptsRepository.findOne({
      where: { TRANX_ID: tranxId },
      relations: [
        'TRANSACTION',
        'TRANSACTION.ENROLLMENT',
        'TRANSACTION.ENROLLMENT.SESSION',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM',
      ],
    });

    if (!receipt) {
      throw new NotFoundException(
        `Receipt for Transaction ID ${tranxId} not found`,
      );
    }

    const ownerUserId = receipt.TRANSACTION?.ENROLLMENT?.USER_ID;
    if (ownerUserId == null) {
      throw new NotFoundException(
        `Receipt for Transaction ID ${tranxId} not found`,
      );
    }
    assertSelfOrRoles(
      user,
      ownerUserId,
      FINANCE_ROLES,
      'Access denied: receipt does not belong to you',
    );

    if (receipt.RC_STATUS !== ReceiptStatus.ISSUED) {
      throw new ForbiddenException(`Receipt is not in ISSUED status`);
    }

    // ใบที่ออกหลังมี e-sign — ดาวน์โหลดไฟล์ archive จาก MinIO
    // ยกเว้น unsigned=true: สร้าง PDF ใหม่แบบไม่มีลายเซ็นทุกครั้ง
    if (!options?.unsigned && receipt.RC_FILE_PATH?.startsWith('/')) {
      const { stream } = await this.platformGatewayService.getPublicFileStream(
        receipt.RC_FILE_PATH,
      );
      const buffer = await readableToBuffer(stream);
      return new Uint8Array(buffer);
    }

    const transaction = receipt.TRANSACTION;
    const exam = transaction?.ENROLLMENT?.SESSION?.EXAM;
    const referenceDate =
      receipt.RC_ISSUED_AT ?? transaction?.TRANX_PAID_AT ?? receipt.CREATED_AT;
    const receiptNo = buildReceiptNo(
      receipt.RC_NO,
      receipt.RC_ID,
      referenceDate,
      receipt.CREATED_AT,
    );
    const description = buildReceiptItemDescription(
      exam?.EXAM_ROUND,
      exam?.EXAM_FISCAL_YEAR,
    );
    const amountNumber = Number(transaction?.TRANX_AMOUNT ?? 0);
    const amount = Number.isFinite(amountNumber)
      ? amountNumber.toFixed(2)
      : '0.00';
    const issuedAt =
      referenceDate instanceof Date
        ? referenceDate.toISOString()
        : referenceDate
          ? String(referenceDate)
          : '-';

    return buildReceiptPdf({
      organizationNameTh: BUU_ORGANIZATION.nameTH,
      organizationNameEn: BUU_ORGANIZATION.nameEN,
      receiptNo,
      issuedAt,
      payerName: receipt.RC_NAME?.trim() || '-',
      taxId: receipt.RC_TAX_ID != null ? String(receipt.RC_TAX_ID) : null,
      amount,
      description,
      examRound: exam?.EXAM_ROUND ?? null,
      examDate: exam?.EXAM_DATE ?? null,
      verifyCode: receipt.RC_VERIFY_CODE,
    });
  }
}
