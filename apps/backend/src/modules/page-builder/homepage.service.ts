import { Injectable } from '@nestjs/common';
import { PageConfig } from './entities/page-config.entity';
import { PageConfigsService } from './page-configs.service';

@Injectable()
export class HomepageService {
  constructor(private readonly pageConfigsService: PageConfigsService) {}

  /**
   * คืนเนื้อหาหน้า (sections + boxes) สำหรับแสดงผลหน้าแรก
   */
  async getActiveHomepage(): Promise<PageConfig> {
    return this.pageConfigsService.getPage();
  }
}
