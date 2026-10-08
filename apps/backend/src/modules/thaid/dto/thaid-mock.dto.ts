import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ThaidMockStartDto {
  @ApiProperty({ enum: ['login', 'register'] })
  @IsIn(['login', 'register'])
  intent: 'login' | 'register';
}

export class ThaidMockCompleteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;
}
