import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BlockedSeatStatus } from '../entities/exam-blocked-seat.entity';

export class ReplaceExamBlockedSeatItemDto {
  @ApiProperty({ example: 1, description: 'Location seat ID' })
  @IsInt()
  LS_ID: number;

  @ApiProperty({
    example: BlockedSeatStatus.BLOCKED,
    enum: BlockedSeatStatus,
    description: 'Override status for this session',
  })
  @IsEnum(BlockedSeatStatus)
  BLOCK_STATUS: BlockedSeatStatus;
}

export class ReplaceExamBlockedSeatsDto {
  @ApiProperty({ type: [ReplaceExamBlockedSeatItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceExamBlockedSeatItemDto)
  seats: ReplaceExamBlockedSeatItemDto[];
}
