import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** body ของ endpoint ที่รับชื่อไฟล์เดี่ยว (getPublicFile / deleteFile) */
export class FileNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

/** body ของ POST /api/getFileList */
export class GetFileListDto {
  @ApiPropertyOptional({ default: '/uploaded_files' })
  @IsString()
  @IsOptional()
  path?: string;
}

/** body ของ POST /api/sendNoti */
export class SendNotiDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
