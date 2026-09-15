import {
  Controller,
  Patch,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';
import { UserImageService } from './user-image.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  AuthenticatedUser,
  requireUserId,
} from 'src/common/utils/authz.util';

class UpdateUserImageDto {
  @ApiProperty({ example: '/user_images/abc123.jpg' })
  @IsString()
  @IsOptional()
  userImageUrl?: string;
}

@ApiTags('user-image')
@Controller('user-image')
export class UserImageController {
  constructor(private readonly userImageService: UserImageService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyImage(@CurrentUser() user: AuthenticatedUser) {
    const userId = requireUserId(
      user,
      'Personnel accounts cannot access candidate profile image',
    );
    return this.userImageService.findByUserId(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMyImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserImageDto,
  ) {
    const userId = requireUserId(
      user,
      'Personnel accounts cannot edit personal profile image',
    );
    if (!dto.userImageUrl) {
      return { message: 'No image URL provided' };
    }
    return this.userImageService.upsertByUserId(userId, dto.userImageUrl);
  }
}
