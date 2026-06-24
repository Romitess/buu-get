import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageConfig, PageContent } from './entities/page-config.entity';
import { UpdatePageContentDto } from './dto/page-config.dto';

@Injectable()
export class PageConfigsService {
  constructor(
    @InjectRepository(PageConfig)
    private readonly pageConfigsRepository: Repository<PageConfig>,
  ) {}

  /**
   * คืนหน้าเดียวของระบบ (สร้างแถวว่างให้อัตโนมัติถ้ายังไม่มี)
   */
  async getPage(): Promise<PageConfig> {
    const existing = await this.pageConfigsRepository.findOne({
      where: {},
      order: { PCF_ID: 'ASC' },
    });
    if (existing) {
      return existing;
    }
    const created = this.pageConfigsRepository.create({ PCF_CONTENT: null });
    return this.pageConfigsRepository.save(created);
  }

  /**
   * อัปเดตเนื้อหาหน้าทั้งก้อน (sections + boxes)
   */
  async updatePageContent(dto: UpdatePageContentDto): Promise<PageConfig> {
    const page = await this.getPage();
    page.PCF_CONTENT = (dto.PCF_CONTENT as PageContent | undefined) ?? null;
    return this.pageConfigsRepository.save(page);
  }
}
