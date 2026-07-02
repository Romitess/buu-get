import { Module } from '@nestjs/common';
import { ExamReportService } from './exam-report.service';
import { ExamReportController } from './exam-report.controller';

/**
 * Exam Report Module — รายงานการสอบ (สรุปสถิติ/กราฟ/ตารางรอบสอบ)
 * service ใช้ DataSource (global) ในการ query ข้ามตาราง จึงไม่ต้อง forFeature
 */
@Module({
  controllers: [ExamReportController],
  providers: [ExamReportService],
})
export class ExamReportModule {}
