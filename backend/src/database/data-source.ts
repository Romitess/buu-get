import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Exam } from '../modules/exam/entities/exam.entity';
import { ExamSession } from '../modules/exam-sessions/entities/exam-session.entity';
import { ExamLocation } from '../modules/exam-locations/entities/exam-location.entity';
import { ExamEnrollment } from '../modules/exam-enrollments/entities/exam-enrollment.entity';
import { UserProfile } from '../modules/user-profile/entities/user-profile.entity';
import { ExamVoucher } from '../modules/exam-vouchers/entities/exam-voucher.entity';
import { ExamAttendance } from '../modules/exam-attendances/entities/exam-attendance.entity';
import { FundSource } from '../modules/fund-sources/entities/fund-source.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { Receipt } from '../modules/receipts/entities/receipt.entity';
import { BankReconcile } from '../modules/bank-reconciles/entities/bank-reconcile.entity';
import { ExamScore } from '../modules/exam-scores/entities/exam-score.entity';
import { ExamCertificate } from '../modules/exam-certificates/entities/exam-certificate.entity';
import { TransactionRef } from '../modules/transaction-refs/entities/transaction-ref.entity';
import { TransactionProfile } from '../modules/transaction-profiles/entities/transaction-profile.entity';
import { PaymentConfig } from '../modules/payment-configs/entities/payment-config.entity';
import { TransactionStatusHistory } from '../modules/transaction-status-history/entities/transaction-status-history.entity';
import { VoidedReceipt } from '../modules/voided-receipts/entities/voided-receipt.entity';
import { UserImage } from '../modules/user-image/entities/user-image.entity';
import { ExamSessionLocation } from '../modules/exam-session-locations/entities/exam-session-location.entity';
import { ExamLocationSeat } from '../modules/exam-location-seats/entities/exam-location-seat.entity';
import { ExamPasscode } from '../modules/exam/entities/exam-passcode.entity';
import { ExamPasscodeLog } from 'src/modules/exam/entities/exam-passcode-log.entity';
import { PageConfig } from '../modules/page-builder/entities/page-config.entity';
<<<<<<< HEAD:backend/src/database/data-source.ts
=======
import { PageSection } from '../modules/page-builder/entities/page-section.entity';
import { BoxBanner } from '../modules/page-builder/entities/box-banner.entity';
import { BoxCard } from '../modules/page-builder/entities/box-card.entity';
import { BoxStep } from '../modules/page-builder/entities/box-step.entity';
import { BoxExamRule } from '../modules/page-builder/entities/box-exam-rule.entity';
import { ExamRule } from '../modules/voucher-configs/entities/voucher-config.entity';
import { ScoreCriteria } from '../modules/score-criteria/entities/score-criteria.entity';
>>>>>>> 875612d (feat(database): implement voucher config with BUU_GET_T_EXAM_RULE and score criteria modules):src/database/data-source.ts

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
    Exam,
    ExamSession,
    ExamLocation,
    ExamSessionLocation,
    ExamLocationSeat,
    ExamEnrollment,
    ExamAttendance,
    ExamVoucher,
    FundSource,
    Transaction,
    Receipt,
    BankReconcile,
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
<<<<<<< HEAD:backend/src/database/data-source.ts
=======
    PageSection,
    BoxBanner,
    BoxCard,
    BoxStep,
    BoxExamRule,
    ExamRule,
    ScoreCriteria,
>>>>>>> 875612d (feat(database): implement voucher config with BUU_GET_T_EXAM_RULE and score criteria modules):src/database/data-source.ts
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
