import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVoucherConfigDto {
  @ApiProperty({
    description: 'ชื่อ key เช่น REGULATIONS_EN, REGULATIONS_TH',
    example: 'REGULATIONS_EN',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  VCF_KEY: string;

  @ApiProperty({
    description: 'ค่าข้อความ (Text)',
    example: 'Test regulations content...',
  })
  @IsString()
  VCF_VALUE: string;
}
