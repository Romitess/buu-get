import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptsRepository: Repository<Receipt>,
  ) {}

  async create(createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    const receipt = this.receiptsRepository.create(createReceiptDto);
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
    Object.assign(receipt, updateReceiptDto);
    return this.receiptsRepository.save(receipt);
  }

  async remove(id: number): Promise<void> {
    const receipt = await this.findOne(id);
    await this.receiptsRepository.softRemove(receipt);
  }

  async downloadReceipt(tranxId: number): Promise<Uint8Array> {
    const receipt = await this.receiptsRepository.findOne({
      where: { TRANX_ID: tranxId },
    });

    if (!receipt) {
      throw new NotFoundException(
        `Receipt for Transaction ID ${tranxId} not found`,
      );
    }

    if (receipt.RC_STATUS !== ReceiptStatus.ISSUED) {
      throw new ForbiddenException(`Receipt is not in ISSUED status`);
    }

    // Return a valid minimal PDF buffer (displays "Hello, world!")
    const minimalPdfBase64 =
      'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkJPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9GCg==';
    return Buffer.from(minimalPdfBase64, 'base64');
  }
}
