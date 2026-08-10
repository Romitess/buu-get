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
}

export class AssistEventDto {
  @ApiProperty()
  seq: number;

  @ApiProperty({ enum: CheckInAssistEventType })
  type: CheckInAssistEventType;

  @ApiProperty()
  scannedCode: string;

  @ApiProperty()
  scannerUserId: number;

  @ApiProperty()
  at: string;

  @ApiPropertyOptional({ type: AssistCandidateSummaryDto })
  candidate?: AssistCandidateSummaryDto;
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
