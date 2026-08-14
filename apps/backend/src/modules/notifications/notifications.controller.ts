import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import {
  MarkAllReadResponseDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from './dto/notification-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@Roles(RoleEnum.FINANCE)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการแจ้งเตือนของเจ้าหน้าที่การเงิน' })
  @ApiResponse({ status: 200, description: 'รายการแจ้งเตือนแบบแบ่งหน้า' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    return this.notificationsService.findAll(user, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'ดึงจำนวนการแจ้งเตือนที่ยังไม่อ่าน' })
  @ApiResponse({ status: 200, description: 'จำนวนที่ยังไม่อ่าน' })
  getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'อ่านการแจ้งเตือนทั้งหมดของผู้ใช้ปัจจุบัน' })
  @ApiResponse({ status: 200, description: 'จำนวนรายการที่อัปเดต' })
  markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MarkAllReadResponseDto> {
    return this.notificationsService.markAllRead(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'อ่านการแจ้งเตือนรายการเดียว' })
  @ApiResponse({ status: 200, description: 'การแจ้งเตือนที่อ่านแล้ว' })
  @ApiResponse({ status: 404, description: 'ไม่พบการแจ้งเตือน' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markRead(user, id);
  }
}
