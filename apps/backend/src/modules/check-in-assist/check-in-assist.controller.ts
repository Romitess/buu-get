import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  CHECK_IN_ROLES,
  ENROLLMENT_ADMIN_ROLES,
} from 'src/common/constants/role-groups';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { CheckInAssistService } from './check-in-assist.service';
import { CreateCheckInAssistSessionDto } from './dto/create-check-in-assist-session.dto';
import { CreateRoomStationDto } from './dto/create-room-station.dto';
import { SubmitCheckInAssistScanDto } from './dto/submit-check-in-assist-scan.dto';
import {
  AssistEventDto,
  CheckInAssistSessionMetaDto,
  CloseAssistSessionResponseDto,
  CreateCheckInAssistSessionResponseDto,
  ListAssistEventsResponseDto,
  MyCheckInRoomDto,
  RoomStationResponseDto,
} from './dto/check-in-assist-response.dto';

@ApiTags('check-in-assist')
@Controller('check-in-assist')
@Roles(...CHECK_IN_ROLES)
export class CheckInAssistController {
  constructor(private readonly checkInAssistService: CheckInAssistService) {}

  @Get('my-rooms')
  @ApiOperation({ summary: 'รายการห้องสอบที่เปิดสถานีเช็คอินได้' })
  @ApiOkResponse({ type: MyCheckInRoomDto, isArray: true })
  listMyRooms(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date?: string,
  ): Promise<MyCheckInRoomDto[]> {
    return this.checkInAssistService.listMyRooms(user, date);
  }

  @Post('room-stations')
  @ApiOperation({ summary: 'เปิดสถานีเช็คอินประจำห้อง (มือถือ standalone)' })
  @ApiOkResponse({ type: RoomStationResponseDto })
  openRoomStation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRoomStationDto,
  ): Promise<RoomStationResponseDto> {
    return this.checkInAssistService.openRoomStation(user, dto.slId);
  }

  @Get('room-stations/:casId')
  @ApiOperation({ summary: 'ดึงสถานีเช็คอินประจำห้องที่เปิดอยู่' })
  @ApiOkResponse({ type: RoomStationResponseDto })
  getRoomStation(
    @Param('casId', ParseIntPipe) casId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RoomStationResponseDto> {
    return this.checkInAssistService.getRoomStation(casId, user);
  }

  @Post('sessions')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้าง session ช่วยแสกนด้วยมือถือ (host)' })
  @ApiOkResponse({ type: CreateCheckInAssistSessionResponseDto })
  createSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckInAssistSessionDto,
  ): Promise<CreateCheckInAssistSessionResponseDto> {
    return this.checkInAssistService.createSession(user, dto);
  }

  @Get('sessions/by-token/:joinToken')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'ดึง metadata session จาก join token' })
  @ApiOkResponse({ type: CheckInAssistSessionMetaDto })
  getSessionByToken(
    @Param('joinToken') joinToken: string,
  ): Promise<CheckInAssistSessionMetaDto> {
    return this.checkInAssistService.getSessionByToken(joinToken);
  }

  @Get('sessions/:casId/events')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'ดึง events ใหม่สำหรับ host poll' })
  @ApiOkResponse({ type: ListAssistEventsResponseDto })
  listEvents(
    @Param('casId', ParseIntPipe) casId: number,
    @Query('afterSeq') afterSeqRaw?: string,
  ): Promise<ListAssistEventsResponseDto> {
    const afterSeq = Number(afterSeqRaw ?? 0);
    const safeAfterSeq =
      Number.isFinite(afterSeq) && afterSeq > 0 ? afterSeq : 0;
    return this.checkInAssistService.listEvents(casId, safeAfterSeq);
  }

  @Post('sessions/:casId/scans')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'ส่งผลการแสกนจากมือถือ' })
  @ApiOkResponse({ type: AssistEventDto })
  submitScan(
    @Param('casId', ParseIntPipe) casId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitCheckInAssistScanDto,
  ): Promise<AssistEventDto> {
    return this.checkInAssistService.submitScan(casId, user, dto.code);
  }

  @Post('sessions/:casId/close')
  @ApiOperation({ summary: 'ปิด session ช่วยแสกน / สถานีประจำห้อง (host)' })
  @ApiOkResponse({ type: CloseAssistSessionResponseDto })
  closeSession(
    @Param('casId', ParseIntPipe) casId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CloseAssistSessionResponseDto> {
    return this.checkInAssistService.closeSession(casId, user);
  }
}
