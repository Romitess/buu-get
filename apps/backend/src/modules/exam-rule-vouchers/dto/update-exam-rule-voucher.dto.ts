import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateVoucherConfigDto {
  @ApiProperty({
    description: 'ค่าข้อความ (Text)',
    example: 'Updated regulations content...',
  })
  @IsString()
  VCF_VALUE: string;
}
