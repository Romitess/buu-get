import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Request as ExpressRequest } from 'express';

@ApiTags('user-profile')
@Controller('user-profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findMe(
    @Request()
    req: ExpressRequest & {
      user: { userId: number; email: string; role: string };
    },
  ) {
    return this.userProfileService.findByUserId(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMe(
    @Request()
    req: ExpressRequest & {
      user: { userId: number; email: string; role: string };
    },
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const userProfile = await this.userProfileService.findByUserId(
      req.user.userId,
    );
    const name = userProfile.userFullnameTh || req.user.email;
    const isCandidate =
      req.user.role?.toLowerCase() === 'candidate' ||
      req.user.role?.toLowerCase() === 'user';
    const modifier = {
      modifierId: req.user.userId,
      modifierName: name,
      modifierRole: isCandidate ? 'ผู้สมัครสอบ' : 'เจ้าหน้าที่',
    };
    return this.userProfileService.update(
      userProfile.userProfileId,
      updateUserProfileDto,
      modifier,
    );
  }

  @Post()
  create(@Body() createUserProfileDto: CreateUserProfileDto) {
    return this.userProfileService.create(createUserProfileDto);
  }

  @Get()
  findAll() {
    return this.userProfileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userProfileService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request()
    req: ExpressRequest & {
      user: { userId: number; email: string; role: string };
    },
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    let modifierName = req.user.email;
    try {
      const modProfile = await this.userProfileService.findByUserId(
        req.user.userId,
      );
      if (modProfile && modProfile.userFullnameTh) {
        modifierName = modProfile.userFullnameTh;
      }
    } catch {
      // Ignored
    }

    const isCandidate =
      req.user.role?.toLowerCase() === 'candidate' ||
      req.user.role?.toLowerCase() === 'user';
    const modifier = {
      modifierId: req.user.userId,
      modifierName,
      modifierRole: isCandidate ? 'ผู้สมัครสอบ' : 'เจ้าหน้าที่',
    };

    return this.userProfileService.update(id, updateUserProfileDto, modifier);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProfileService.remove(id);
  }
}
