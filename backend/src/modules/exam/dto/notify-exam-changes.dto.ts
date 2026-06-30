import {
  IsArray,
  IsString,
  IsNotEmpty,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ExamChangeItemDto {
  @ApiProperty({ example: 'วันที่สอบ', description: 'ชื่อรายการที่ถูกแก้ไข' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '10 ก.ค. 2568', description: 'ค่าเดิมก่อนแก้ไข' })
  @IsString()
  oldValue: string;

  @ApiProperty({ example: '15 ก.ค. 2568', description: 'ค่าใหม่หลังแก้ไข' })
  @IsString()
  newValue: string;
}

export class NotifyExamChangesDto {
  @ApiProperty({
    type: [ExamChangeItemDto],
    description: 'รายการการเปลี่ยนแปลง',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ExamChangeItemDto)
  changes: ExamChangeItemDto[];
}
