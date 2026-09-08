import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamEnrollmentAuditLog } from './entities/exam-enrollment-audit-log.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatusHistory } from '../transaction-status-history/entities/transaction-status-history.entity';
import { ProfileEditHistory } from '../profile-edit-history/entities/profile-edit-history.entity';
import { ExamPasscodeLog } from '../exam/entities/exam-passcode-log.entity';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { EnrollmentAuditService } from './enrollment-audit.service';
import { EnrollmentAuditController } from './enrollment-audit.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamEnrollmentAuditLog,
      ExamEnrollment,
      Transaction,
      TransactionStatusHistory,
      ProfileEditHistory,
      ExamPasscodeLog,
      UserProfile,
      Receipt,
    ]),
  ],
  controllers: [EnrollmentAuditController],
  providers: [EnrollmentAuditService],
  exports: [EnrollmentAuditService],
})
export class EnrollmentAuditModule {}
