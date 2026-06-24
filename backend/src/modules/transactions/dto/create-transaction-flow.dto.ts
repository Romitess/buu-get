import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionFlowDto {
  @ApiProperty({ description: 'Enrollment ID (ERM_ID)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  ermId: number;

  @ApiProperty({ description: 'Payment Config ID (PC_ID)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  pcId: number;

  @ApiProperty({ description: 'Payment Amount', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}
