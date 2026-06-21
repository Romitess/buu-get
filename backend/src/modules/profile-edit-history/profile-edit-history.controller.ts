import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfileEditHistoryService } from './profile-edit-history.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LatestImagesDto } from './dto/latest-images.dto';

@ApiTags('profile-edit-history')
@Controller('profile-edit-history')
export class ProfileEditHistoryController {
  constructor(private readonly historyService: ProfileEditHistoryService) {}

  @Get('profile/:userProfileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findByProfileId(
    @Param('userProfileId', ParseIntPipe) userProfileId: number,
  ) {
    return await this.historyService.findByUserProfileId(userProfileId);
  }

  /**
   * คืนรูปโปรไฟล์ล่าสุดจากประวัติของหลาย profileId ใน request เดียว
   * (ใช้แทนการยิงทีละ profileId แบบ N+1 จากหน้า จัดการที่นั่งสอบ)
   */
  @Post('latest-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findLatestImages(
    @Body() dto: LatestImagesDto,
  ): Promise<Record<number, string | null>> {
    return await this.historyService.findLatestImagesByProfileIds(
      dto.profileIds,
    );
  }
}
