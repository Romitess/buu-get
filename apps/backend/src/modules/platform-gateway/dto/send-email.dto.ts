import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** body ของ POST /api/sendEmail */
export class SendEmailDto {
  @ApiProperty()
  @IsString()
  system: string;

  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  message: string;
}
