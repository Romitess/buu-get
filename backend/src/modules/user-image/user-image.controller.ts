import {
  Controller,
  Patch,
  Body,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { UserImageService } from './user-image.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  getMyImage(
    @Request()
    req: ExpressRequest & {
      user: { userId: number; email: string; role: string };
    },
  ) {
    return this.userImageService.findByUserId(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMyImage(
    @Request()
    req: ExpressRequest & {
      user: { userId: number; email: string; role: string };
    },
    @Body() dto: UpdateUserImageDto,
  ) {
    if (!dto.userImageUrl) {
      return { message: 'No image URL provided' };
    }
    return this.userImageService.upsertByUserId(
      req.user.userId,
      dto.userImageUrl,
    );
  }
}
