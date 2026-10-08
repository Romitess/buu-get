import { ApiProperty } from '@nestjs/swagger';

export class CandidateAccountResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty({ nullable: true })
  userCode: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  nationalId: string | null;

  @ApiProperty({ nullable: true })
  passportNo: string | null;

  @ApiProperty({ nullable: true })
  titleTh: string | null;

  @ApiProperty({ nullable: true })
  fullNameTh: string | null;

  @ApiProperty({ nullable: true })
  titleEn: string | null;

  @ApiProperty({ nullable: true })
  fullNameEn: string | null;

  @ApiProperty({ nullable: true, example: '2004-04-11' })
  dateOfBirth: string | null;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  education: string | null;

  @ApiProperty({ nullable: true })
  faculty: string | null;

  @ApiProperty({ nullable: true })
  institution: string | null;

  @ApiProperty({ nullable: true })
  country: string | null;

  @ApiProperty({ nullable: true })
  address: string | null;

  @ApiProperty({ nullable: true })
  remark: string | null;

  @ApiProperty()
  registeredViaThaid: boolean;

  @ApiProperty({ nullable: true })
  moodleId: number | null;
}
