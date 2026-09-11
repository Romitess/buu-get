import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/modules/roles/entities/role.entity';
import { MsgPerson } from '../entities/msg-person.entity';

export class MsgPersonResponseDto {
  @ApiProperty({ example: '0000123456' })
  PSN_ID: string;

  @ApiProperty({ nullable: true })
  PRF_NAMETH: string | null;

  @ApiProperty({ nullable: true })
  PRF_NAMEEN: string | null;

  @ApiProperty({ nullable: true })
  PSN_FNAMETH: string | null;

  @ApiProperty({ nullable: true })
  PSN_FNAMEEN: string | null;

  @ApiProperty({ nullable: true })
  PSN_LNAMETH: string | null;

  @ApiProperty({ nullable: true })
  PSN_LNAMEEN: string | null;

  @ApiProperty({ nullable: true })
  PSN_EMAIL_BUU: string | null;

  @ApiProperty({ nullable: true, enum: ['N', 'Y'] })
  PSN_RETIRE: 'N' | 'Y' | null;

  @ApiProperty({ nullable: true })
  PSN_TECHNIQUE: string | null;

  @ApiProperty({ nullable: true })
  PSN_USERNAME: string | null;

  @ApiProperty({ required: false, type: () => [Role] })
  ROLES?: Role[];

  static fromEntity(person: MsgPerson): MsgPersonResponseDto {
    const dto = new MsgPersonResponseDto();
    dto.PSN_ID = person.PSN_ID;
    dto.PRF_NAMETH = person.PRF_NAMETH;
    dto.PRF_NAMEEN = person.PRF_NAMEEN;
    dto.PSN_FNAMETH = person.PSN_FNAMETH;
    dto.PSN_FNAMEEN = person.PSN_FNAMEEN;
    dto.PSN_LNAMETH = person.PSN_LNAMETH;
    dto.PSN_LNAMEEN = person.PSN_LNAMEEN;
    dto.PSN_EMAIL_BUU = person.PSN_EMAIL_BUU;
    dto.PSN_RETIRE = person.PSN_RETIRE;
    dto.PSN_TECHNIQUE = person.PSN_TECHNIQUE;
    dto.PSN_USERNAME = person.PSN_USERNAME;

    if (person.ROLES) {
      dto.ROLES = person.ROLES;
    }

    return dto;
  }
}
