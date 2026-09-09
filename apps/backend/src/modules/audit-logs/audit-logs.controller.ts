import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { AuditLogsService } from './audit-logs.service';
import { AuditAction } from './constants/audit-actions';
import {
  AuditLogsQueryDto,
  AuditLogResponseDto,
} from './dto/audit-logs-query.dto';
import { AuditLogStatus } from './entities/audit-log.entity';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@Roles(RoleEnum.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'รายการ platform audit log (Admin)' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query() query: AuditLogsQueryDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    return this.auditLogsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({
    summary:
      'Export audit logs ตามฟิลเตอร์ (สูงสุด 5000 แถว) สำหรับ compliance',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async export(
    @Query() query: AuditLogsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: AuditLogResponseDto[] }> {
    const data = await this.auditLogsService.exportRows(query);
    this.auditLogsService.recordAsync({
      action: AuditAction.AUDIT_EXPORT,
      resourceType: 'audit-log',
      status: AuditLogStatus.SUCCESS,
      actorUserId: user.userId,
      actorSnapshot: {
        userId: user.userId,
        email: user.email,
        roles: user.roles ?? [user.role],
      },
      afterState: {
        rowCount: data.length,
        filters: {
          from: query.from ?? null,
          to: query.to ?? null,
          actorUserId: query.actorUserId ?? null,
          action: query.action ?? null,
          module: query.module ?? null,
          status: query.status ?? null,
        },
      },
    });
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'รายละเอียด audit log รายแถว' })
  @ApiResponse({ status: HttpStatus.OK, type: AuditLogResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AuditLogResponseDto> {
    return this.auditLogsService.findOne(id);
  }
}
