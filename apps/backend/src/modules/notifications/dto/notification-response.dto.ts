import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DailyPaymentSummaryPayload } from '../interfaces/notification-payload.interface';

export class NotificationResponseDto {
  @ApiProperty({ description: 'รหัสการแจ้งเตือน' })
  NTF_ID: number;

  @ApiProperty({ description: 'ประเภทการแจ้งเตือน' })
  NTF_TYPE: string;

  @ApiProperty({ description: 'หัวข้อการแจ้งเตือน' })
  NTF_TITLE: string;

  @ApiProperty({ description: 'ข้อความสรุปการแจ้งเตือน' })
  NTF_BODY: string;

  @ApiProperty({ description: 'ข้อมูลสรุปการชำระเงิน' })
  NTF_PAYLOAD: DailyPaymentSummaryPayload;

  @ApiPropertyOptional({ description: 'ลิงก์ไปหน้ารายงาน', nullable: true })
  NTF_LINK: string | null;

  @ApiPropertyOptional({
    description: 'วันเวลาที่อ่าน',
    nullable: true,
  })
  NTF_READ_AT: Date | null;

  @ApiProperty({ description: 'วันที่สร้าง' })
  CREATED_AT: Date;
}

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'จำนวนการแจ้งเตือนที่ยังไม่อ่าน' })
  count: number;
}

export class MarkAllReadResponseDto {
  @ApiProperty({ description: 'จำนวนรายการที่อัปเดต' })
  updated: number;
}
