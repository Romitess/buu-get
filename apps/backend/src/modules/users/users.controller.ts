import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  USER_ADMIN_ROLES,
  USER_LIST_ROLES,
} from 'src/common/constants/role-groups';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
} from 'src/common/utils/authz.util';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(...USER_ADMIN_ROLES)
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(...USER_LIST_ROLES)
  @ApiOkResponse({ description: 'รายการผู้ใช้แบบแบ่งหน้า' })
  async findAll(
    @Query() query: UsersQueryDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    assertSelfOrRoles(user, id, USER_ADMIN_ROLES);
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles(...USER_ADMIN_ROLES)
  @ApiOkResponse({ type: UserResponseDto })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserRolesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, body.roleIds);
  }

  @Delete(':id')
  @Roles(...USER_ADMIN_ROLES)
  @ApiOkResponse({ description: 'ลบผู้ใช้งานสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
