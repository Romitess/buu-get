import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  FINANCE_ROLES,
  FUND_SOURCE_READ_ROLES,
} from 'src/common/constants/role-groups';
import { FundSourcesService } from './fund-sources.service';
import { CreateFundSourceDto } from './dto/create-fund-source.dto';
import { UpdateFundSourceDto } from './dto/update-fund-source.dto';
import { DailyRevenueQueryDto } from './dto/daily-revenue-query.dto';
import { DailyRevenueSummary } from './interfaces/daily-revenue.interface';
import { FundSource } from './entities/fund-source.entity';

@ApiTags('Fund Sources')
@Controller('fund-sources')
export class FundSourcesController {
  constructor(private readonly fundSourcesService: FundSourcesService) {}

  @Post()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'สร้างแหล่งทุนใหม่' })
  @ApiResponse({
    status: 201,
    description: 'สร้างแหล่งทุนสำเร็จ',
    type: FundSource,
  })
  create(
    @Body() createFundSourceDto: CreateFundSourceDto,
  ): Promise<FundSource> {
    return this.fundSourcesService.create(createFundSourceDto);
  }

  @Get()
  @Roles(...FUND_SOURCE_READ_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลแหล่งทุนทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการแหล่งทุนทั้งหมด',
    type: [FundSource],
  })
  findAll(): Promise<FundSource[]> {
    return this.fundSourcesService.findAll();
  }

  @Get('daily-revenue')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ดึงรายงานสรุปการรับเงินประจำวัน' })
  @ApiResponse({
    status: 200,
    description: 'รายงานสรุปการรับเงินประจำวัน',
  })
  getDailyRevenue(
    @Query() query: DailyRevenueQueryDto,
  ): Promise<DailyRevenueSummary> {
    return this.fundSourcesService.getDailyRevenue(query);
  }

  @Get('departments')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลส่วนงานทั้งหมดสำหรับใช้ทำฟิลเตอร์' })
  @ApiResponse({
    status: 200,
    description: 'ข้อมูลส่วนงานทั้งหมด',
  })
  getDepartments(): Promise<{ label: string; value: string }[]> {
    return this.fundSourcesService.getDepartments();
  }

  @Get(':id')
  @Roles(...FUND_SOURCE_READ_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลแหล่งทุนด้วย ID' })
  @ApiResponse({
    status: 200,
    description: 'ข้อมูลแหล่งทุนที่พบ',
    type: FundSource,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบแหล่งทุน' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<FundSource> {
    return this.fundSourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลแหล่งทุน' })
  @ApiResponse({
    status: 200,
    description: 'แก้ไขแหล่งทุนสำเร็จ',
    type: FundSource,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบแหล่งทุน' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFundSourceDto: UpdateFundSourceDto,
  ): Promise<FundSource> {
    return this.fundSourcesService.update(id, updateFundSourceDto);
  }

  @Delete(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ลบข้อมูลแหล่งทุน (Soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'ลบแหล่งทุนสำเร็จ',
  })
  @ApiResponse({ status: 404, description: 'ไม่พบแหล่งทุน' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.fundSourcesService.remove(id);
  }
}
