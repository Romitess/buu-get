import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class UpdateMsgPersonRolesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description: 'รายการ ROLE_ID ที่จะแทนที่บทบาทของบุคลากร',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  roleIds!: number[];
}
