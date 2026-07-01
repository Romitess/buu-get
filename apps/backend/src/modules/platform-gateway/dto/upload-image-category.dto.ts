import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IMAGE_CATEGORIES } from '../constants/image-category.config';

const IMAGE_CATEGORY_KEYS = Object.keys(IMAGE_CATEGORIES);

/**
 * body ของ POST /api/images/upload (multipart; ไฟล์อยู่ใน field `file`)
 * client ส่งแค่ `category` (semantic) — backend map เป็น folder ปลายทางเอง
 */
export class UploadImageCategoryDto {
  @ApiProperty({ enum: IMAGE_CATEGORY_KEYS })
  @IsIn(IMAGE_CATEGORY_KEYS)
  category: string;
}
