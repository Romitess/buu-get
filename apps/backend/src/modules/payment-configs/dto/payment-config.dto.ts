import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePaymentConfigDto {
  @ApiProperty({
    description: 'ชื่อผู้ให้บริการ',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  PROVIDER_NAME!: string;

  @ApiProperty({
    description: 'รหัสบริษัทที่ตกลงกับธนาคารไว้',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  PC_COMP_CODE!: string;

  @ApiProperty({
    description: 'รหัสสินค้า/บริการที่ตกลงกับธนาคารไว้',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  PC_PROD_CODE!: string;

  @ApiProperty({
    description: 'สถานะการใช้งาน',
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  PC_IS_ACTIVE!: boolean;

  @ApiProperty({
    description: 'วันที่เริ่มใช้ config นี้',
  })
  @IsDateString()
  @IsNotEmpty()
  PC_EFFECTIVE_FROM!: Date;

  @ApiPropertyOptional({
    description: 'วันที่หมดอายุ (NULL = ยังใช้งานอยู่ไม่มีกำหนด)',
  })
  @IsDateString()
  @IsOptional()
  PC_EFFECTIVE_TO?: Date;
}

export class UpdatePaymentConfigDto extends PartialType(
  CreatePaymentConfigDto,
) {}
