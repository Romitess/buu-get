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
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async findAll(@Query('role') role?: string): Promise<UserResponseDto[]> {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @ApiOkResponse({ type: UserResponseDto })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('roleIds') roleIds: number[],
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, roleIds);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'ลบผู้ใช้งานสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
