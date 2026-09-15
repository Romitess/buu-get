import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FINANCE_ROLES } from 'src/common/constants/role-groups';
import { AuthenticatedUser, requireUserId } from 'src/common/utils/authz.util';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { VoidedReceiptsService } from './voided-receipts.service';
import { CreateVoidedReceiptDto } from './dto/create-voided-receipt.dto';
import { VoidedReceipt } from './entities/voided-receipt.entity';

@ApiTags('Voided Receipts')
@Controller('voided-receipts')
@Roles(...FINANCE_ROLES)
export class VoidedReceiptsController {
  constructor(private readonly voidedReceiptsService: VoidedReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'ยกเลิกใบเสร็จรับเงินพร้อมระบุเหตุผล' })
  @ApiResponse({ status: 201, type: VoidedReceipt })
  async create(
    @Body() createDto: CreateVoidedReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VoidedReceipt> {
    return await this.voidedReceiptsService.create(
      createDto,
      requireUserId(user),
    );
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการใบเสร็จที่ถูกยกเลิกทั้งหมด' })
  @ApiResponse({ status: 200, description: 'รายการแบบแบ่งหน้า' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<VoidedReceipt>> {
    return await this.voidedReceiptsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการยกเลิกใบเสร็จตาม ID' })
  @ApiResponse({ status: 200, type: VoidedReceipt })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<VoidedReceipt> {
    return await this.voidedReceiptsService.findOne(id);
  }
}
