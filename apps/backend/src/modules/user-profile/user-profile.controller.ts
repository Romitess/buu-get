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
  Query,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { USER_ADMIN_ROLES } from 'src/common/constants/role-groups';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
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
      user: { userId: number; email: string; role: string; roles: string[] };
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
      user: { userId: number; email: string; role: string; roles: string[] };
    },
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const userProfile = await this.userProfileService.findByUserId(
      req.user.userId,
    );
    const name = userProfile.userFullnameTh || req.user.email;
    // ถือเป็นผู้สมัครก็ต่อเมื่อทุก role ของ user เป็น candidate/user เท่านั้น
    // (ถ้ามี role เจ้าหน้าที่ปนอยู่ด้วย ให้ถือเป็นเจ้าหน้าที่)
    const userRoles = req.user.roles ?? (req.user.role ? [req.user.role] : []);
    const isCandidate =
      userRoles.length > 0 &&
      userRoles.every((r) => {
        const v = r.toLowerCase();
        return v === 'candidate' || v === 'user';
      });
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
  @Roles(...USER_ADMIN_ROLES)
  create(@Body() createUserProfileDto: CreateUserProfileDto) {
    return this.userProfileService.create(createUserProfileDto);
  }

  @Get()
  @Roles(...USER_ADMIN_ROLES)
  findAll(@Query() query: PaginationQueryDto) {
    return this.userProfileService.findAll(query);
  }

  @Get(':id')
  @Roles(...USER_ADMIN_ROLES)
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
      user: { userId: number; email: string; role: string; roles: string[] };
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

    // ถือเป็นผู้สมัครก็ต่อเมื่อทุก role ของ user เป็น candidate/user เท่านั้น
    // (ถ้ามี role เจ้าหน้าที่ปนอยู่ด้วย ให้ถือเป็นเจ้าหน้าที่)
    const userRoles = req.user.roles ?? (req.user.role ? [req.user.role] : []);
    const isCandidate =
      userRoles.length > 0 &&
      userRoles.every((r) => {
        const v = r.toLowerCase();
        return v === 'candidate' || v === 'user';
      });
    const modifier = {
      modifierId: req.user.userId,
      modifierName,
      modifierRole: isCandidate ? 'ผู้สมัครสอบ' : 'เจ้าหน้าที่',
    };

    return this.userProfileService.update(id, updateUserProfileDto, modifier);
  }

  @Delete(':id')
  @Roles(...USER_ADMIN_ROLES)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProfileService.remove(id);
  }
}
