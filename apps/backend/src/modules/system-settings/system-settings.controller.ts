import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  SYSTEM_SETTINGS_READ_ROLES,
  SYSTEM_SETTINGS_WRITE_ROLES,
} from 'src/common/constants/role-groups';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import {
  SystemSettingItemDto,
  UpdateSystemSettingsDto,
} from './dto/system-settings.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('System Settings')
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @Roles(...SYSTEM_SETTINGS_READ_ROLES)
  @ApiOperation({
    summary: 'ดึงค่าการตั้งค่าระบบทั้งหมด (จัดกลุ่มใน response)',
  })
  @ApiResponse({ status: 200, type: [SystemSettingItemDto] })
  findAll(): Promise<SystemSettingItemDto[]> {
    return this.systemSettingsService.findAll();
  }

  @Patch()
  @Roles(...SYSTEM_SETTINGS_WRITE_ROLES)
  @ApiOperation({ summary: 'อัปเดตค่าการตั้งค่าระบบ (admin / super_admin)' })
  @ApiResponse({ status: 200, type: [SystemSettingItemDto] })
  update(
    @Body() dto: UpdateSystemSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SystemSettingItemDto[]> {
    return this.systemSettingsService.updateMany(dto.settings, user.userId);
  }
}
