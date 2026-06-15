import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PageConfig } from './entities/page-config.entity';
import {
  CreatePageConfigDto,
  UpdatePageConfigDto,
} from './dto/page-config.dto';

@Injectable()
export class PageConfigsService {
  constructor(
    @InjectRepository(PageConfig)
    private readonly pageConfigsRepository: Repository<PageConfig>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreatePageConfigDto): Promise<PageConfig> {
    const config = this.pageConfigsRepository.create(createDto);
    return this.pageConfigsRepository.save(config);
  }

  async findAll(): Promise<PageConfig[]> {
    return this.pageConfigsRepository.find({ order: { PCF_ID: 'ASC' } });
  }

  async findOne(id: number): Promise<PageConfig> {
    const config = await this.pageConfigsRepository.findOne({
      where: { PCF_ID: id },
    });
    if (!config) {
      throw new NotFoundException(`PageConfig with ID ${id} not found`);
    }
    return config;
  }

  async update(
    id: number,
    updateDto: UpdatePageConfigDto,
  ): Promise<PageConfig> {
    const config = await this.findOne(id);
    Object.assign(config, updateDto);
    return this.pageConfigsRepository.save(config);
  }

  async remove(id: number): Promise<void> {
    const config = await this.findOne(id);
    await this.pageConfigsRepository.softRemove(config);
  }

  /**
   * เปิดใช้งานชุดหน้านี้ และปิดชุดอื่นทั้งหมด (เปิดได้ครั้งละ 1 ชุด)
   */
  async activate(id: number): Promise<PageConfig> {
    await this.findOne(id);
    return this.dataSource.transaction(async (manager) => {
      await manager.update(PageConfig, {}, { PCF_ACTIVE: false });
      await manager.update(PageConfig, { PCF_ID: id }, { PCF_ACTIVE: true });
      const updated = await manager.findOne(PageConfig, {
        where: { PCF_ID: id },
      });
      return updated as PageConfig;
    });
  }
}
