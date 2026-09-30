import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ThaidSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  ticket: string;
}
