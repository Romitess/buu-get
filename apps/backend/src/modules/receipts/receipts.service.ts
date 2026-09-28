import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
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
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { resolveImageFolder } from '../platform-gateway/constants/image-category.config';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';
import { ReceiptNumberService } from './receipt-number.service';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';

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

  /**
   * เก็บ PDF ที่เว็บสร้างจากใบเสร็จรูปแบบเดิม โดยรูปลายเซ็นอยู่ในช่องภาพลายมือชื่อแล้ว
   */
  async archiveSignedReceiptFile(rcId: number, pdf: Buffer): Promise<void> {
    if (!pdf || pdf.length < 5 || pdf.subarray(0, 5).toString('utf8') !== '%PDF-') {
      throw new BadRequestException('Signed receipt file must be a PDF');
    }

    const receipt = await this.receiptsRepository.findOne({
      where: { RC_ID: rcId },
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt ID ${rcId} not found`);
    }
    if (receipt.RC_STATUS !== ReceiptStatus.ISSUED) {
      throw new ForbiddenException('Receipt is not in ISSUED status');
    }

    const folder = resolveImageFolder('receipt-file');
    const fileName = `${receipt.RC_NO || `receipt-${rcId}`}.pdf`;
    const uploadResult = (await this.platformGatewayService.uploadBuffer(
      pdf,
      fileName,
      {
        path: folder,
        fileName,
        forceFileName: true,
        bucket: 'buu-get.storage',
      },
    )) as { result?: string; filename?: string; path?: string } | undefined;

    const filePath =
      uploadResult?.result || uploadResult?.filename || uploadResult?.path;
    if (typeof filePath !== 'string' || !filePath) {
      throw new ServiceUnavailableException(
        `Failed to upload signed receipt file for receipt ${rcId}`,
      );
    }

    const normalizedPath = filePath.startsWith('/')
      ? filePath
      : `/${filePath.replace(/^\/+/, '')}`;

    await this.receiptsRepository.update(
      { RC_ID: rcId },
      { RC_FILE_PATH: normalizedPath },
    );
  }

  async downloadReceipt(
    tranxId: number,
    user: AuthenticatedUser,
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

    if (!receipt.RC_FILE_PATH?.startsWith('/')) {
      throw new NotFoundException(
        `Receipt file for Transaction ID ${tranxId} is not stored yet`,
      );
    }

    const { stream } = await this.platformGatewayService.getPublicFileStream(
      receipt.RC_FILE_PATH,
    );
    const buffer = await readableToBuffer(stream);
    return new Uint8Array(buffer);
  }
}
