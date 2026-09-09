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
  EnrollmentAuditApplicantListItem,
  EnrollmentAuditApplicantEnrollmentDto,
} from './enrollment-audit.service';
import {
  EnrollmentAuditEventsQueryDto,
  EnrollmentAuditListQueryDto,
  EnrollmentAuditApplicantsQueryDto,
} from './dto/enrollment-audit-query.dto';

@ApiTags('Enrollment Audit')
@Controller('enrollment-audit')
@Roles(RoleEnum.ADMIN)
export class EnrollmentAuditController {
  constructor(
    private readonly enrollmentAuditService: EnrollmentAuditService,
  ) {}

  @Get('applicants')
  @ApiOperation({
    summary: 'รายชื่อผู้สมัครแบบ unique user สำหรับหน้า audit (Admin)',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async findApplicants(
    @Query() query: EnrollmentAuditApplicantsQueryDto,
  ): Promise<PaginatedResponse<EnrollmentAuditApplicantListItem>> {
    return this.enrollmentAuditService.findApplicants(query);
  }

  @Get('applicants/:userId/enrollments')
  @ApiOperation({ summary: 'รายการรอบสอบของผู้สมัครสำหรับเลือกบน timeline' })
  @ApiResponse({ status: HttpStatus.OK })
  async findApplicantEnrollments(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<EnrollmentAuditApplicantEnrollmentDto[]> {
    return this.enrollmentAuditService.findApplicantEnrollments(userId);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'รายชื่อ enrollment สำหรับดู audit (Admin)' })
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
