import { Controller, Body, Patch, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { PageConfigsService } from './page-configs.service';
import { UpdatePageContentDto } from './dto/page-config.dto';
import { PageConfig } from './entities/page-config.entity';

@ApiTags('Page Builder - Configs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.STAFF, RoleEnum.REGISTRATION_OFFICER)
@Controller('page-builder')
export class PageConfigsController {
  constructor(private readonly pageConfigsService: PageConfigsService) {}

  @Patch('content')
  @ApiOperation({ summary: 'อัปเดตเนื้อหาหน้า (sections + boxes) ทั้งก้อน' })
  @ApiResponse({ status: 200, type: PageConfig })
  update(@Body() dto: UpdatePageContentDto): Promise<PageConfig> {
    return this.pageConfigsService.updatePageContent(dto);
  }
}
