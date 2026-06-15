import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageConfig } from './entities/page-config.entity';

@Injectable()
export class HomepageService {
  constructor(
    @InjectRepository(PageConfig)
    private readonly pageConfigsRepository: Repository<PageConfig>,
  ) {}

  /**
   * คืน active config พร้อมโครงสร้าง sections + boxes (เก็บใน PCF_CONTENT) ในครั้งเดียว
   */
  async getActiveHomepage(): Promise<PageConfig> {
    const config = await this.pageConfigsRepository.findOne({
      where: { PCF_ACTIVE: true },
    });
    if (!config) {
      throw new NotFoundException('No active page config found');
    }
    return config;
  }
}
