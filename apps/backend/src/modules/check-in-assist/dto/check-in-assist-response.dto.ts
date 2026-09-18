import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckInAssistEventType } from '../entities/check-in-assist-event.entity';
import { CheckInAssistSessionStatus } from '../entities/check-in-assist-session.entity';

export class AssistCandidateSummaryDto {
  @ApiProperty()
  ermId: number;

  @ApiPropertyOptional()
  nationalId?: string;

  @ApiPropertyOptional({ nullable: true })
  passportNo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  testTakerCode?: string | null;

  @ApiProperty()
  titleTh: string;

  @ApiProperty()
  fullnameTh: string;

  @ApiPropertyOptional({ nullable: true })
  titleEn?: string | null;

  @ApiPropertyOptional({ nullable: true })
  fullnameEn?: string | null;

  @ApiProperty()
  seatNumber: string;

  @ApiPropertyOptional({ nullable: true })
  profileImage?: string | null;

  @ApiPropertyOptional({ nullable: true })
  voucherNo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  examType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  testSession?: string | null;

  @ApiProperty({ description: 'สถานะ attendance (4=INTIME)' })
  attendanceStatus: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'อาคาร + เลขห้องสอบของผู้เข้าสอบ',
  })
  roomLabel?: string | null;

  @ApiPropertyOptional({ nullable: true })
  floorNo?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ช่วงเวลาสอบ HH:mm–HH:mm',
  })
  sessionTime?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'เวลาเช็กอินเข้าห้องสอบ (ISO) เมื่อเคยเช็กอินแล้ว',
  })
  checkedInAt?: string | null;
}

export class AssistExpectedRoomDto {
  @ApiProperty()
  slId: number;

  @ApiProperty()
  locationName: string;

  @ApiPropertyOptional({ nullable: true })
  roomNo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  floorNo?: number | null;

  @ApiProperty()
  seatNumber: string;

  @ApiPropertyOptional({ nullable: true })
  sessionStart?: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionEnd?: string | null;
}

export class AssistEventDto {
  @ApiProperty()
  seq: number;

  @ApiProperty({ enum: CheckInAssistEventType })
  type: CheckInAssistEventType;

  @ApiProperty()
  scannedCode: string;

  @ApiProperty({ description: 'รหัสบุคลากรผู้แสกน (PSN_ID)' })
  scannerPsnId: string;

  @ApiProperty()
  at: string;

  @ApiPropertyOptional({ type: AssistCandidateSummaryDto })
  candidate?: AssistCandidateSummaryDto;

  @ApiPropertyOptional({
    type: AssistExpectedRoomDto,
    nullable: true,
    description: 'ห้องที่ถูกต้องเมื่อ type=WRONG_ROOM',
  })
  expectedRoom?: AssistExpectedRoomDto | null;
}

export class CreateCheckInAssistSessionResponseDto {
  @ApiProperty()
  casId: number;

  @ApiProperty()
  joinToken: string;

  @ApiProperty()
  expiresAt: string;
}

export class CheckInAssistSessionMetaDto {
  @ApiProperty()
  casId: number;

  @ApiProperty()
  examId: number;

  @ApiPropertyOptional()
  examName?: string;

  @ApiProperty({ enum: CheckInAssistSessionStatus })
  status: CheckInAssistSessionStatus;

  @ApiProperty()
  expiresAt: string;
}

export class ListAssistEventsResponseDto {
  @ApiProperty({ type: [AssistEventDto] })
  events: AssistEventDto[];

  @ApiProperty()
  latestSeq: number;
}

export class CloseAssistSessionResponseDto {
  @ApiProperty({ example: 'CLOSED' })
  status: CheckInAssistSessionStatus;
}

export class MyCheckInRoomDto {
  @ApiProperty()
  slId: number;

  @ApiProperty()
  examId: number;

  @ApiProperty()
  examName: string;

  @ApiPropertyOptional({ nullable: true })
  sessionStart?: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionEnd?: string | null;

  @ApiProperty()
  locationName: string;

  @ApiPropertyOptional({ nullable: true })
  roomNo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  floorNo?: number | null;

  @ApiProperty({ type: [String] })
  proctorNames: string[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  attendedCount: number;

  @ApiPropertyOptional({ nullable: true })
  activeStationCasId?: number | null;
}

export class RoomStationResponseDto {
  @ApiProperty()
  casId: number;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  slId: number;

  @ApiProperty()
  examId: number;

  @ApiProperty()
  examName: string;

  @ApiPropertyOptional({ nullable: true })
  sessionStart?: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionEnd?: string | null;

  @ApiProperty()
  locationName: string;

  @ApiPropertyOptional({ nullable: true })
  roomNo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  floorNo?: number | null;

  @ApiProperty({ type: [String] })
  proctorNames: string[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  attendedCount: number;
}
