import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  USER_ADMIN_ROLES,
  USER_LIST_ROLES,
} from 'src/common/constants/role-groups';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { MsgPersonResponseDto } from './dto/msg-person-response.dto';
import { MsgPersonsQueryDto } from './dto/msg-persons-query.dto';
import { UpdateMsgPersonRolesDto } from './dto/update-msg-person-roles.dto';
import { MsgPersonsService } from './msg-persons.service';

@ApiTags('msg-persons')
@Controller('msg-persons')
export class MsgPersonsController {
  constructor(private readonly msgPersonsService: MsgPersonsService) {}

  @Get()
  @Roles(...USER_LIST_ROLES)
  @ApiOkResponse({ description: 'รายการบุคลากรแบบแบ่งหน้า' })
  async findAll(
    @Query() query: MsgPersonsQueryDto,
  ): Promise<PaginatedResponse<MsgPersonResponseDto>> {
    return this.msgPersonsService.findAll(query);
  }

  @Get(':psnId')
  @Roles(...USER_LIST_ROLES)
  @ApiOkResponse({ type: MsgPersonResponseDto })
  async findOne(@Param('psnId') psnId: string): Promise<MsgPersonResponseDto> {
    return this.msgPersonsService.findOne(psnId);
  }

  @Patch(':psnId/roles')
  @Roles(...USER_ADMIN_ROLES)
  @ApiOkResponse({
    type: MsgPersonResponseDto,
    description:
      'ตั้งบทบาทเจ้าหน้าที่บน PERSON_ROLES (แหล่งสิทธิ์ตามโมเดลใหม่)',
  })
  async updateRoles(
    @Param('psnId') psnId: string,
    @Body() body: UpdateMsgPersonRolesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MsgPersonResponseDto> {
    return this.msgPersonsService.updateRoles(psnId, body.roleIds, actor);
  }
}
