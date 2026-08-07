import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/** จำกัดขนาดช่วงเพื่อกันลบจำนวนมากโดยไม่ตั้งใจ */
export const MAX_USER_DELETE_RANGE_SIZE = 500;

@ValidatorConstraint({ name: 'endUserIdGteStartUserId', async: false })
class EndUserIdGteStartUserIdConstraint implements ValidatorConstraintInterface {
  validate(endUserId: number, args: ValidationArguments): boolean {
    const { startUserId } = args.object as DeleteUsersByRangeDto;
    if (
      typeof startUserId !== 'number' ||
      typeof endUserId !== 'number' ||
      !Number.isInteger(startUserId) ||
      !Number.isInteger(endUserId)
    ) {
      return true;
    }
    return endUserId >= startUserId;
  }

  defaultMessage(): string {
    return 'endUserId must be greater than or equal to startUserId';
  }
}

@ValidatorConstraint({ name: 'userDeleteRangeSize', async: false })
class UserDeleteRangeSizeConstraint implements ValidatorConstraintInterface {
  validate(endUserId: number, args: ValidationArguments): boolean {
    const { startUserId } = args.object as DeleteUsersByRangeDto;
    if (
      typeof startUserId !== 'number' ||
      typeof endUserId !== 'number' ||
      !Number.isInteger(startUserId) ||
      !Number.isInteger(endUserId) ||
      endUserId < startUserId
    ) {
      return true;
    }
    return endUserId - startUserId + 1 <= MAX_USER_DELETE_RANGE_SIZE;
  }

  defaultMessage(): string {
    return `id range size must not exceed ${MAX_USER_DELETE_RANGE_SIZE}`;
  }
}

export class DeleteUsersByRangeDto {
  @ApiProperty({
    description: 'USER_ID เริ่มต้น (inclusive)',
    example: 12,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  startUserId!: number;

  @ApiProperty({
    description: 'USER_ID สิ้นสุด (inclusive)',
    example: 15,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Validate(EndUserIdGteStartUserIdConstraint)
  @Validate(UserDeleteRangeSizeConstraint)
  endUserId!: number;
}

export class DeleteUsersByRangeResponseDto {
  @ApiProperty({ example: 12 })
  startUserId!: number;

  @ApiProperty({ example: 15 })
  endUserId!: number;

  @ApiProperty({
    description: 'USER_ID ที่พบและลบสำเร็จ',
    type: [Number],
    example: [12, 13, 14, 15],
  })
  deletedUserIds!: number[];

  @ApiProperty({ example: 4 })
  deletedCount!: number;

  @ApiProperty({
    description: 'จำนวน user ที่ลบใน Moodle ด้วย',
    example: 2,
  })
  deletedMoodleCount!: number;
}
