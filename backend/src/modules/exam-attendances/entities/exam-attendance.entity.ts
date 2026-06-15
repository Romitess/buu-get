import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExamEnrollment } from '../../exam-enrollments/entities/exam-enrollment.entity';

export enum ExamAttendStatus {
  MISSING = 0,
  INTIME = 1,
}

@Entity('EXAM_T_ATTENDANCES')
export class ExamAttendance {
  @PrimaryGeneratedColumn({ name: 'ATTEND_ID', comment: 'รหัสผู้เข้าสอบ' })
  ATTEND_ID: number;

  @Column({ name: 'ERM_ID', comment: 'รหัสผู้สมัคร' })
  ERM_ID: number;

  @Column({
    name: 'ATTEND_CHECK_IN_TIME',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่เข้าสอบ',
  })
  ATTEND_CHECK_IN_TIME: Date;

  @Column({
    name: 'ATTEND_STATUS',
    type: 'tinyint',
    default: ExamAttendStatus.MISSING,
    comment: 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)',
  })
  ATTEND_STATUS: ExamAttendStatus;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @ManyToOne(() => ExamEnrollment, (enrollment) => enrollment.ATTENDANCES)
  @JoinColumn({ name: 'ERM_ID' })
  ENROLLMENT: ExamEnrollment;
}
