import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ENROLLMENT_ADMIN_ROLES,
  USER_ADMIN_ROLES,
} from 'src/common/constants/role-groups';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
  requireUserId,
} from 'src/common/utils/authz.util';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MsgPersonsService } from 'src/modules/msg-persons/msg-persons.service';

@ApiTags('user-profile')
@Controller('user-profile')
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly msgPersonsService: MsgPersonsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findMe(@CurrentUser() user: AuthenticatedUser) {
    const userId = requireUserId(
      user,
      'Personnel accounts cannot access candidate profile',
    );
    return this.userProfileService.findByUserId(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const userId = requireUserId(
      user,
      'Personnel accounts cannot edit personal profile',
    );
    const userProfile = await this.userProfileService.findByUserId(userId);
    const name = userProfile.userFullnameTh || user.email;
    // ถือเป็นผู้สมัครก็ต่อเมื่อทุก role ของ user เป็น candidate/user เท่านั้น
    // (ถ้ามี role เจ้าหน้าที่ปนอยู่ด้วย ให้ถือเป็นเจ้าหน้าที่)
    const userRoles = user.roles ?? (user.role ? [user.role] : []);
    const isCandidate =
      userRoles.length > 0 &&
      userRoles.every((r) => {
        const v = r.toLowerCase();
        return v === 'candidate' || v === 'user';
      });
    const modifier = {
      modifierId: userId,
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
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    // :id is USER_PROFILE_ID — ownership is via profile.userId (USER_ID), not profile id
    const targetProfile = await this.userProfileService.findOne(id);
    assertSelfOrRoles(
      user,
      targetProfile.userId,
      ENROLLMENT_ADMIN_ROLES,
      'Access denied: cannot update another user profile',
    );

    // Self-update ของผู้สมัครเท่านั้น; เจ้าหน้าที่ (รวม person) แก้โปรไฟล์ผู้สมัครได้ตามเดิม
    const isSelfUpdate =
      user.userId != null && user.userId === targetProfile.userId;
    if (isSelfUpdate) {
      requireUserId(user, 'Personnel accounts cannot edit personal profile');
    }

    let modifierName = user.email;
    const modifierUserId = user.userId;
    if (modifierUserId != null) {
      try {
        const modProfile =
          await this.userProfileService.findByUserId(modifierUserId);
        if (modProfile?.userFullnameTh) {
          modifierName = modProfile.userFullnameTh;
        }
      } catch {
        // Ignored — keep email as fallback
      }
    } else if (user.personId) {
      // ไม่มี USER_ID — พยายามโหลดชื่อจาก MSG_T_PERSON โดยใช้ MsgPersonsService
      try {
        const person = await this.msgPersonsService.findEntityById(
          String(user.personId),
        );
        if (person) {
          const first =
            person.PSN_FNAMETH?.trim() || person.PSN_FNAMEEN?.trim() || '';
          const last =
            person.PSN_LNAMETH?.trim() || person.PSN_LNAMEEN?.trim() || '';
          const formatted = [first, last].filter(Boolean).join(' ').trim();
          if (formatted) {
            modifierName = formatted;
          } else {
            modifierName = user.email
              ? `${user.email} [PSN:${user.personId}]`
              : `PSN:${user.personId}`;
          }
        } else {
          modifierName = user.email
            ? `${user.email} [PSN:${user.personId}]`
            : `PSN:${user.personId}`;
        }
      } catch {
        // หากเกิดข้อผิดพลาด ให้เก็บค่า fallback เดิม
        modifierName = user.email
          ? `${user.email} [PSN:${user.personId}]`
          : `PSN:${user.personId}`;
      }
    }

    // ถือเป็นผู้สมัครก็ต่อเมื่อทุก role ของ user เป็น candidate/user เท่านั้น
    // (ถ้ามี role เจ้าหน้าที่ปนอยู่ด้วย ให้ถือเป็นเจ้าหน้าที่)
    const userRoles = user.roles ?? (user.role ? [user.role] : []);
    const isCandidate =
      userRoles.length > 0 &&
      userRoles.every((r) => {
        const v = r.toLowerCase();
        return v === 'candidate' || v === 'user';
      });
    const modifier = {
      // 0 = บุคลากร (person) ไม่มี USER_ID — คอลัมน์เป็น int ไม่มี FK constraint
      modifierId: modifierUserId ?? 0,
      modifierName,
      modifierRole: isCandidate ? 'ผู้สมัครสอบ' : 'เจ้าหน้าที่',
      activeRole: user.activeRole ?? user.role,
    };

    return this.userProfileService.update(id, updateUserProfileDto, modifier);
  }

  @Delete(':id')
  @Roles(...USER_ADMIN_ROLES)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProfileService.remove(id);
  }
}
