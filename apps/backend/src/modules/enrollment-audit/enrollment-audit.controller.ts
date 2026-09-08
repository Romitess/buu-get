import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import {
  EnrollmentAuditService,
  EnrollmentAuditEventDto,
  EnrollmentAuditListItem,
  EnrollmentAuditSummaryDto,
} from './enrollment-audit.service';
import {
  EnrollmentAuditEventsQueryDto,
  EnrollmentAuditListQueryDto,
} from './dto/enrollment-audit-query.dto';

@ApiTags('Enrollment Audit')
@Controller('enrollment-audit')
@Roles(RoleEnum.ADMIN)
export class EnrollmentAuditController {
  constructor(private readonly enrollmentAuditService: EnrollmentAuditService) {}

  @Get('enrollments')
  @ApiOperation({ summary: 'รายชื่อผู้สมัครสำหรับดู audit (Admin)' })
  @ApiResponse({ status: HttpStatus.OK })
  async findEnrollments(
    @Query() query: EnrollmentAuditListQueryDto,
  ): Promise<PaginatedResponse<EnrollmentAuditListItem>> {
    return this.enrollmentAuditService.findEnrollments(query);
  }

  @Get('enrollments/:ermId')
  @ApiOperation({ summary: 'สรุป enrollment สำหรับหน้า audit' })
  @ApiResponse({ status: HttpStatus.OK })
  async findEnrollmentSummary(
    @Param('ermId', ParseIntPipe) ermId: number,
  ): Promise<EnrollmentAuditSummaryDto> {
    return this.enrollmentAuditService.findEnrollmentSummary(ermId);
  }

  @Get('enrollments/:ermId/events')
  @ApiOperation({
    summary: 'Timeline audit ของ enrollment (รวม federated logs)',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async findEvents(
    @Param('ermId', ParseIntPipe) ermId: number,
    @Query() query: EnrollmentAuditEventsQueryDto,
  ): Promise<EnrollmentAuditEventDto[]> {
    return this.enrollmentAuditService.findEvents(ermId, query);
  }
}
