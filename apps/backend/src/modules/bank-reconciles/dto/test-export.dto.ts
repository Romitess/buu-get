import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class TestExportQueryDto {
  @ApiProperty({ description: 'รหัสรอบสอบ' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examId: number;
}

export class TestExportExamOptionDto {
  @ApiProperty()
  EXAM_ID: number;

  @ApiProperty()
  EXAM_NAME: string;

  @ApiProperty({ nullable: true })
  EXAM_ROUND: string | null;

  @ApiProperty({ nullable: true })
  EXAM_DATE: string | null;

  @ApiProperty()
  EXAM_FEE: number;

  @ApiProperty()
  exportableCount: number;
}

export class TestExportRowDto {
  @ApiProperty()
  applicantId: string;

  @ApiProperty({ nullable: true })
  referenceNo: string | null;

  @ApiProperty()
  payerName: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  paymentDate: string;

  @ApiProperty()
  paymentTime: string;
}
