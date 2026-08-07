import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';
import { User } from '../../users/entities/user.entity';
import { ExamVoucher } from '../../exam-vouchers/entities/exam-voucher.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ExamScore } from '../../exam-scores/entities/exam-score.entity';
import { ExamSessionLocation } from '../../exam-session-locations/entities/exam-session-location.entity';
import { UserPhysicalStatus } from '../../user-profile/entities/user-profile.entity';
import {
  physicalStatusFromCode,
  physicalStatusToCode,
} from '../../../common/utils/physical-status.util';

export enum ExamEnrollmentStatus {
  UNPAID = 0,
  PAID = 1,
  SEAT_ASSIGNED = 2,
  SEAT_PUBLISHED = 3,
  ATTENDED = 4,
  CANCELLED = 5,
  MISSING = 6,
}

export enum ExamVerifyStatus {
  UNCHECKED = 0,
  PASS = 1,
  WAIT_FIXED = 2,
  CANCELLED = 3,
}

@Entity('EXAM_T_ENROLLMENTS')
@Unique('UQ_ENROLLMENT_SEAT_LABEL', ['SL_ID', 'ERM_SEAT_LABEL'])
@Index('IDX_ERM_STATUS_CREATED_AT', ['ERM_STATUS', 'CREATED_AT'])
@Index('IDX_ERM_USER_CREATED', ['USER_ID', 'CREATED_AT'])
@Index('IDX_ERM_SESSION_STATUS_SL', ['SESSION_ID', 'ERM_STATUS', 'SL_ID'])
export class ExamEnrollment {
  @PrimaryGeneratedColumn({ name: 'ERM_ID', comment: 'รหัสผู้สมัคร' })
  ERM_ID: number;

  @Column({ name: 'USER_ID', comment: 'รหัสผู้ใช้' })
  USER_ID: number;

  @Column({ name: 'SESSION_ID', comment: 'รหัสรอบสอบ' })
  SESSION_ID: number;

  @Column({
    name: 'SL_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัส Session-Location (FK)',
  })
  SL_ID: number | null;

  @Column({
    name: 'ERM_SEAT_LABEL',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'เลขที่นั่งสอบ/รหัสที่นั่งสอบ',
  })
  ERM_SEAT_LABEL: string | null;

  @Column({
    name: 'ERM_SORT_ORDER',
    type: 'int',
    nullable: true,
    comment: 'ลำดับการเรียงที่นั่ง',
  })
  ERM_SORT_ORDER: number | null;

  @Column({
    name: 'ERM_TEST_TAKER',
    type: 'varchar',
    length: 9,
    nullable: true,
    comment: 'Exam test taker code',
  })
  ERM_TEST_TAKER: string | null;

  @Column({
    name: 'ERM_STATUS',
    type: 'tinyint',
    default: ExamEnrollmentStatus.UNPAID,
    comment:
      'สถานะการสมัคร/เข้าสอบ (0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:SEAT_PUBLISHED, 4:ATTENDED, 5:CANCELLED, 6:MISSING)',
  })
  ERM_STATUS: ExamEnrollmentStatus;

  @Column({
    name: 'ERM_VERIFY_STATUS',
    type: 'tinyint',
    default: ExamVerifyStatus.UNCHECKED,
    comment: 'สถานะการตรวจสอบ (0:UNCHECKED, 1:PASS, 2:WAIT_FIXED, 3:CANCELLED)',
  })
  ERM_VERIFY_STATUS: ExamVerifyStatus;

  @Column({
    name: 'ERM_PHYSICAL_STATUS',
    type: 'tinyint',
    default: 5,
    transformer: {
      to: (value: string | UserPhysicalStatus): number =>
        physicalStatusToCode(value),
      from: (value: number): UserPhysicalStatus =>
        physicalStatusFromCode(value),
    },
    comment:
      'สถานะทางกายภาพ/ข้อมูลผู้สมัคร (1: พระภิกษุ / นักบวช, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ชาวต่างชาติ, 5: ชาวไทย)',
  })
  ERM_PHYSICAL_STATUS: UserPhysicalStatus;

  @Column({
    name: 'ERM_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ตรวจสอบ',
  })
  ERM_AT: Date;

  @Column({
    name: 'ERM_MOODLE_ENROLL_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัส enrol ฝั่ง Moodle (เติมโดย worker)',
  })
  ERM_MOODLE_ENROLL_ID: number | null;

  @Column({
    name: 'ERM_ATTEND_CHECK_IN_TIME',
    type: 'timestamp',
    nullable: true,
    comment: 'เวลาที่เข้าสอบ/เช็กอิน',
  })
  ERM_ATTEND_CHECK_IN_TIME: Date | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @ManyToOne(() => ExamSession, (session: ExamSession) => session.ENROLLMENTS)
  @JoinColumn({ name: 'SESSION_ID' })
  SESSION: ExamSession;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  USER: User;

  @OneToMany(() => ExamVoucher, (voucher: ExamVoucher) => voucher.ENROLLMENT)
  VOUCHERS: ExamVoucher[];

  @OneToOne(
    () => Transaction,
    (transaction: Transaction) => transaction.ENROLLMENT,
  )
  TRANSACTION: Transaction;

  @OneToOne(() => ExamScore, (score: ExamScore) => score.ENROLLMENT)
  SCORE: ExamScore;

  @ManyToOne(
    () => ExamSessionLocation,
    (sessionLocation: ExamSessionLocation) => sessionLocation.ENROLLMENTS,
  )
  @JoinColumn({ name: 'SL_ID' })
  SESSION_LOCATION: ExamSessionLocation;
}
