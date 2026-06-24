import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlockedSeatStatus } from '../entities/exam-blocked-seat.entity';

export class CreateExamBlockedSeatDto {
  @ApiProperty({ example: 1, description: 'รหัสที่นั่งในห้องสอบ (FK)' })
  @IsInt()
  LS_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสรอบสอบ (FK)' })
  @IsInt()
  SS_ID: number;

  @ApiProperty({
    example: BlockedSeatStatus.BLOCKED,
    enum: BlockedSeatStatus,
    description: 'สถานะการ block (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)',
    required: false,
  })
  @IsOptional()
  @IsEnum(BlockedSeatStatus)
  BLOCK_STATUS?: BlockedSeatStatus;
}
