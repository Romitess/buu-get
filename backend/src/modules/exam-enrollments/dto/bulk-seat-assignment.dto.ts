import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeatAssignmentItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  ermId: number;

  @ApiProperty({ example: 'A-01', description: 'เลขที่นั่งสอบ' })
  @IsString()
  seatLabel: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsPositive()
  slId: number;

  @ApiProperty({
    example: 1,
    description: 'ลำดับการเรียงที่นั่ง',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  sortOrder?: number;
}

export class BulkSeatAssignmentDto {
  @ApiProperty({ type: [SeatAssignmentItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SeatAssignmentItemDto)
  assignments: SeatAssignmentItemDto[];

  @ApiProperty({ example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  sessionIds: number[];
}
