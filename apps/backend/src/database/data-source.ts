import '../config/load-env';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Exam } from '../modules/exam/entities/exam.entity';
import { ExamSession } from '../modules/exam-sessions/entities/exam-session.entity';
import { ExamLocation } from '../modules/exam-locations/entities/exam-location.entity';
import { ExamEnrollment } from '../modules/exam-enrollments/entities/exam-enrollment.entity';
import { UserProfile } from '../modules/user-profile/entities/user-profile.entity';
import { ExamVoucher } from '../modules/exam-vouchers/entities/exam-voucher.entity';
import { FundSource } from '../modules/fund-sources/entities/fund-source.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { Receipt } from '../modules/receipts/entities/receipt.entity';
import { ReceiptSequence } from '../modules/receipts/entities/receipt-sequence.entity';
import { BankReconcile } from '../modules/bank-reconciles/entities/bank-reconcile.entity';
import { BankReconcileEditLog } from '../modules/bank-reconciles/entities/bank-reconcile-edit-log.entity';
import { ExamScore } from '../modules/exam-scores/entities/exam-score.entity';
import { ExamCertificate } from '../modules/exam-certificates/entities/exam-certificate.entity';
import { TransactionRef } from '../modules/transaction-refs/entities/transaction-ref.entity';
import { TransactionProfile } from '../modules/transaction-profiles/entities/transaction-profile.entity';
import { PaymentConfig } from '../modules/payment-configs/entities/payment-config.entity';
import { TransactionStatusHistory } from '../modules/transaction-status-history/entities/transaction-status-history.entity';
import { VoidedReceipt } from '../modules/voided-receipts/entities/voided-receipt.entity';
import { UserImage } from '../modules/user-image/entities/user-image.entity';
import { ProfileEditHistory } from '../modules/profile-edit-history/entities/profile-edit-history.entity';
import { ExamSessionLocation } from '../modules/exam-session-locations/entities/exam-session-location.entity';
import { ExamLocationSeat } from '../modules/exam-location-seats/entities/exam-location-seat.entity';
import { ExamPasscode } from '../modules/exam/entities/exam-passcode.entity';
import { ExamPasscodeLog } from 'src/modules/exam/entities/exam-passcode-log.entity';
import { PageConfig } from '../modules/page-builder/entities/page-config.entity';
import { ExamRuleVoucher } from '../modules/exam-rule-vouchers/entities/exam-rule-voucher.entity';
import { ScoreCriteria } from '../modules/score-criteria/entities/score-criteria.entity';
import { ScoreRubric } from '../modules/score-rubrics/entities/score-rubric.entity';
import { ScoreRubricItem } from '../modules/score-rubrics/entities/score-rubric-item.entity';
import { ExamScoreLine } from '../modules/exam-scores/entities/exam-score-line.entity';
import { MoodleSyncLog } from '../modules/moodle-sync-logs/entities/moodle-sync-log.entity';
import { ExamBlockedSeat } from '../modules/exam-blocked-seats/entities/exam-blocked-seat.entity';
import { CheckInAssistSession } from '../modules/check-in-assist/entities/check-in-assist-session.entity';
import { CheckInAssistEvent } from '../modules/check-in-assist/entities/check-in-assist-event.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Role,
    UserProfile,
    UserImage,
    ProfileEditHistory,
    Exam,
    ExamSession,
    ExamLocation,
    ExamSessionLocation,
    ExamLocationSeat,
    ExamEnrollment,
    ExamVoucher,
    FundSource,
    Transaction,
    Receipt,
    ReceiptSequence,
    BankReconcile,
    BankReconcileEditLog,
    ExamScore,
    ExamCertificate,
    TransactionRef,
    TransactionProfile,
    PaymentConfig,
    TransactionStatusHistory,
    VoidedReceipt,
    ExamPasscode,
    ExamPasscodeLog,
    PageConfig,
    ExamRuleVoucher,
    ScoreCriteria,
    ScoreRubric,
    ScoreRubricItem,
    ExamScoreLine,
    MoodleSyncLog,
    ExamBlockedSeat,
    CheckInAssistSession,
    CheckInAssistEvent,
  ],
  migrations: [
    __filename.endsWith('.js')
      ? 'dist/database/migrations/*.js'
      : 'src/database/migrations/*.ts',
  ],
  synchronize: false,
});
