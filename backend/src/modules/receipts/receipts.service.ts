import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from './entities/receipt.entity';
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

  async findAll(): Promise<Receipt[]> {
    return this.receiptsRepository.find({ relations: ['TRANSACTION'] });
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
      throw new NotFoundException(`Receipt for Transaction ID ${tranxId} not found`);
    }

    if (receipt.RC_STATUS !== 1) { // 1 = ISSUED
      throw new ForbiddenException(`Receipt is not in ISSUED status`);
    }

    // Return a valid minimal PDF buffer (displays "Hello, world!")
    const minimalPdfBase64 = 'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkJPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9GCg==';
    return Buffer.from(minimalPdfBase64, 'base64');
  }
}
