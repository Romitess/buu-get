import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HomepageService } from './homepage.service';
import { PageConfig } from './entities/page-config.entity';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Page Builder - Homepage')
@Controller('page-builder/homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'ดึง active homepage (config + sections + boxes) สำหรับแสดงผล',
  })
  @ApiResponse({ status: 200, description: 'ข้อมูล homepage ที่เปิดใช้งาน' })
  @ApiResponse({ status: 404, description: 'ไม่มีชุดหน้าที่เปิดใช้งาน' })
  getActiveHomepage(): Promise<PageConfig> {
    return this.homepageService.getActiveHomepage();
  }
}
