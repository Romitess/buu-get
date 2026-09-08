import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateRoomStationDto {
  @ApiProperty({ example: 12, description: 'รหัส Session-Location (ห้องสอบ)' })
  @IsInt()
  @Min(1)
  slId: number;
}
