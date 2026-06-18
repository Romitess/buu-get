import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsNumber,
  IsDate,
} from 'class-validator';

export class UploadFileDto {
  @ApiProperty({
    description: 'File path where the file is stored',
    example: '/uploads/documents/report.pdf',
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({
    description: 'Original file name',
    example: 'Annual_Report_2024.pdf',
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[\w-]+\/[\w-]+$/, {
    message:
      'File type must be a valid MIME type (e.g., application/pdf, image/jpeg)',
  })
  fileType?: string;

  @ApiPropertyOptional({
    description: 'QR code verification string (optional)',
    example: 'QR123456789',
  })
  @IsString()
  @IsOptional()
  qrVerify?: string;

  @ApiPropertyOptional({
    description: 'Storage bucket name',
    example: 'hrd.dev.storage',
  })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiPropertyOptional({
    description: 'Force using the provided fileName (useful for overwriting)',
    example: true,
  })
  @IsOptional()
  forceFileName?: boolean;
}

/**
 * Response DTO for file upload operation
 */
export class UploadFileResponseDto {
  @ApiProperty({
    description: 'Unique file identifier',
    example: 'file_123456789',
  })
  @IsString()
  fileId: string;

  @ApiProperty({
    description: 'File access URL',
    example: 'https://example.com/uploads/documents/report.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  })
  @IsDate()
  uploadedAt: Date;
}

export class UploadCertificateFileDto extends UploadFileDto {
  @ApiProperty({
    description: 'รหัสส่วนงาน (Faculty ID) ที่เชื่อมโยงกับใบรับรอง',
    example: 'FAC123456',
  })
  @IsString()
  @IsNotEmpty()
  facId: string;
}
