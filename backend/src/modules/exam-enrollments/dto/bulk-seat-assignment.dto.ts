import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeatAssignmentItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  ermId: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsPositive()
  lsId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsPositive()
  slId: number;
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
