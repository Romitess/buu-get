import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProfileEditHistoryService } from './profile-edit-history.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ENROLLMENT_ADMIN_ROLES } from 'src/common/constants/role-groups';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
  userHasAnyRole,
} from 'src/common/utils/authz.util';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LatestImagesDto } from './dto/latest-images.dto';
import { UserProfile } from '../user-profile/entities/user-profile.entity';

@ApiTags('profile-edit-history')
@Controller('profile-edit-history')
export class ProfileEditHistoryController {
  constructor(
    private readonly historyService: ProfileEditHistoryService,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  @Get('profile/:userProfileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findByProfileId(
    @Param('userProfileId', ParseIntPipe) userProfileId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const profile = await this.userProfileRepository.findOne({
      where: { userProfileId },
      select: { userProfileId: true, userId: true },
    });
    if (!profile) {
      throw new NotFoundException(`UserProfile #${userProfileId} not found`);
    }
    assertSelfOrRoles(
      user,
      profile.userId,
      ENROLLMENT_ADMIN_ROLES,
      'Access denied: cannot read another user profile history',
    );
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Record<number, string | null>> {
    if (
      !userHasAnyRole(user, ENROLLMENT_ADMIN_ROLES) &&
      dto.profileIds.length > 0
    ) {
      const profiles = await this.userProfileRepository.find({
        where: { userProfileId: In(dto.profileIds) },
        select: { userProfileId: true, userId: true },
      });
      if (profiles.some((p) => p.userId !== user.userId)) {
        throw new ForbiddenException(
          'Access denied: cannot read another user profile images',
        );
      }
    }
    return await this.historyService.findLatestImagesByProfileIds(
      dto.profileIds,
    );
  }
}
