import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BankCallbackResponseDto {
  @ApiPropertyOptional({ nullable: true })
  tranxId: number | string | null;

  @ApiProperty()
  bankRef: string;

  @ApiProperty()
  respCode: string;

  @ApiProperty()
  respMsg: string;

  @ApiProperty()
  balance: string;

  @ApiProperty()
  cusName: string;

  @ApiProperty()
  info: string;

  @ApiPropertyOptional()
  print1?: string;

  @ApiPropertyOptional()
  print2?: string;

  @ApiPropertyOptional()
  print3?: string;

  @ApiPropertyOptional()
  print4?: string;

  @ApiPropertyOptional()
  print5?: string;

  @ApiPropertyOptional()
  print6?: string;

  @ApiPropertyOptional()
  print7?: string;
}
