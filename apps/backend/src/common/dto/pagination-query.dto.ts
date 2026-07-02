import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * PaginationQueryDto — base DTO สำหรับ query แบบแบ่งหน้า (offset-based)
 * นำไปใช้ด้วยการ extends แล้วเพิ่ม field เฉพาะโมดูล เช่น search/sortBy
 *
 * page/limit เป็น optional; ปล่อยให้ service ใส่ค่า default (ผ่าน getter ด้านล่างหรือ ?? ในโค้ด)
 * `@Max` กัน client ขอ limit มหาศาล (DoS / deep-offset)
 */
export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const PAGINATION_MAX_LIMIT = 100;

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: PAGINATION_DEFAULT_PAGE, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    default: PAGINATION_DEFAULT_LIMIT,
    minimum: 1,
    maximum: PAGINATION_MAX_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_MAX_LIMIT)
  @IsOptional()
  limit?: number;
}
