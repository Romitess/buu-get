import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
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
import {
  CreatePageConfigDto,
  UpdatePageConfigDto,
} from './dto/page-config.dto';
import { PageConfig } from './entities/page-config.entity';

@ApiTags('Page Builder - Configs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller('page-builder/configs')
export class PageConfigsController {
  constructor(private readonly pageConfigsService: PageConfigsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างชุดหน้าใหม่' })
  @ApiResponse({ status: 201, type: PageConfig })
  create(@Body() dto: CreatePageConfigDto): Promise<PageConfig> {
    return this.pageConfigsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงชุดหน้าทั้งหมด' })
  @ApiResponse({ status: 200, type: [PageConfig] })
  findAll(): Promise<PageConfig[]> {
    return this.pageConfigsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงชุดหน้าด้วย ID' })
  @ApiResponse({ status: 200, type: PageConfig })
  @ApiResponse({ status: 404, description: 'ไม่พบชุดหน้า' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PageConfig> {
    return this.pageConfigsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขชุดหน้า' })
  @ApiResponse({ status: 200, type: PageConfig })
  @ApiResponse({ status: 404, description: 'ไม่พบชุดหน้า' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePageConfigDto,
  ): Promise<PageConfig> {
    return this.pageConfigsService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'เปิดใช้งานชุดหน้านี้ (ปิดชุดอื่นอัตโนมัติ)' })
  @ApiResponse({ status: 200, type: PageConfig })
  @ApiResponse({ status: 404, description: 'ไม่พบชุดหน้า' })
  activate(@Param('id', ParseIntPipe) id: number): Promise<PageConfig> {
    return this.pageConfigsService.activate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบชุดหน้า (Soft delete)' })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบชุดหน้า' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.pageConfigsService.remove(id);
  }
}
