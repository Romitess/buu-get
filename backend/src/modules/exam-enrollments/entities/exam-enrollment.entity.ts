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
} from 'typeorm';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';
import { User } from '../../users/entities/user.entity';
import { ExamVoucher } from '../../exam-vouchers/entities/exam-voucher.entity';
import { ExamAttendance } from '../../exam-attendances/entities/exam-attendance.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ExamScore } from '../../exam-scores/entities/exam-score.entity';
import { ExamSessionLocation } from '../../exam-session-locations/entities/exam-session-location.entity';
import { ExamLocationSeat } from '../../exam-location-seats/entities/exam-location-seat.entity';
import { UserPhysicalStatus } from '../../user-profile/entities/user-profile.entity';

export enum ExamEnrollmentStatus {
  UNPAID = 0,
  PAID = 1,
  SEAT_ASSIGNED = 2,
  SEAT_PUBLISHED = 3,
  ATTENDED = 4,
  CANCELLED = 5,
}

export enum ExamVerifyStatus {
  UNCHECKED = 0,
  PASS = 1,
  WAIT_FIXED = 2,
  CANCELLED = 3,
}

@Entity('EXAM_T_ENROLLMENTS')
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
    name: 'LS_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสที่นั่งในห้องสอบ (FK)',
  })
  LS_ID: number | null;

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
      'สถานะการชำระเงิน (0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:SEAT_PUBLISHED, 4:ATTENDED, 5:CANCELLED)',
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
      to: (value: string | UserPhysicalStatus): number => {
        const mapping: Record<string, number> = {
          [UserPhysicalStatus.MONK]: 0,
          [UserPhysicalStatus.RELIGIOUS]: 1,
          [UserPhysicalStatus.DISABLED]: 2,
          [UserPhysicalStatus.PREGNANT]: 3,
          [UserPhysicalStatus.DISABLED_TYPO]: 4,
          [UserPhysicalStatus.GENERAL]: 5,
          พระสงฆ์: 0,
          ตั้งครรภ์: 3,
          ไม่มีข้อมูลข้างต้น: 5,
        };
        return mapping[value] ?? 5;
      },
      from: (value: number): UserPhysicalStatus => {
        const mapping: Record<number, UserPhysicalStatus> = {
          0: UserPhysicalStatus.MONK,
          1: UserPhysicalStatus.RELIGIOUS,
          2: UserPhysicalStatus.DISABLED,
          3: UserPhysicalStatus.PREGNANT,
          4: UserPhysicalStatus.DISABLED_TYPO,
          5: UserPhysicalStatus.GENERAL,
        };
        return mapping[value] ?? UserPhysicalStatus.GENERAL;
      },
    },
    comment:
      'สถานะทางกายภาพ/ข้อมูลผู้สมัคร (0: พระภิกษุ / สามเณร, 1: นักบวช / ศาสนบุคคล, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ผู้พิการรณ์, 5: ทั่วไป)',
  })
  ERM_PHYSICAL_STATUS: UserPhysicalStatus;

  @Column({
    name: 'ERM_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ตรวจสอบ',
  })
  ERM_AT: Date;

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

  @OneToMany(
    () => ExamAttendance,
    (attendance: ExamAttendance) => attendance.ENROLLMENT,
  )
  ATTENDANCES: ExamAttendance[];

  @OneToOne(
    () => Transaction,
    (transaction: Transaction) => transaction.ENROLLMENT,
  )
  TRANSACTION: Transaction;

  @OneToOne(() => ExamScore, (score: ExamScore) => score.ENROLLMENT)
  SCORE: ExamScore;

  @ManyToOne(() => ExamSessionLocation)
  @JoinColumn({ name: 'SL_ID' })
  SESSION_LOCATION: ExamSessionLocation;

  @ManyToOne(() => ExamLocationSeat)
  @JoinColumn({ name: 'LS_ID' })
  LOCATION_SEAT: ExamLocationSeat;
}
