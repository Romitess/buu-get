import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  AfterLoad,
} from 'typeorm';
import { Exam } from '../../exam/entities/exam.entity';
import { ExamEnrollment } from '../../exam-enrollments/entities/exam-enrollment.entity';
import { ExamLocation } from '../../exam-locations/entities/exam-location.entity';
import { ExamSessionLocation } from '../../exam-session-locations/entities/exam-session-location.entity';

export enum ExamSessionStatus {
  DRAFT = 0,
  OPEN = 1,
  SEAT_ALLOCATED = 2,
  VOUCHER_SENT = 3,
  COMPLETED = 4,
  CANCELLED = 5,
}

@Entity('EXAM_T_SESSIONS')
export class ExamSession {
  @PrimaryGeneratedColumn({ name: 'SS_ID', comment: 'รหัสรอบสอบ' })
  SS_ID: number;

  @Column({ name: 'EXAM_ID', comment: 'รหัสการสอบ' })
  EXAM_ID: number;

  @Column({
    name: 'SS_START_TIME',
    type: 'time',
    nullable: true,
    comment: 'เวลาเริ่มสอบ',
  })
  SS_START_TIME: string;

  @Column({
    name: 'SS_END_TIME',
    type: 'time',
    nullable: true,
    comment: 'เวลาสิ้นสุดการสอบ',
  })
  SS_END_TIME: string;

  @Column({
    name: 'SS_CAPACITY',
    type: 'int',
    nullable: true,
    comment: 'จำนวนที่นั่ง',
  })
  SS_CAPACITY: number;

  @Column({
    name: 'SS_SESSION_STATUS',
    type: 'tinyint',
    default: ExamSessionStatus.DRAFT,
    comment:
      'สถานะรอบสอบ (0:DRAFT, 1:OPEN, 2:SEAT_ALLOCATED, 3:VOUCHER_SENT, 4:COMPLETED, 5:CANCELLED)',
  })
  SS_SESSION_STATUS: ExamSessionStatus;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้างรอบสอบ' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขรอบสอบ' })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบรอบสอบ',
  })
  DELETED_AT: Date | null;

  @ManyToOne(() => Exam, (exam: Exam) => exam.SESSIONS)
  @JoinColumn({ name: 'EXAM_ID' })
  EXAM: Exam;

  LOCATION: ExamLocation;

  @AfterLoad()
  populateLocation(): void {
    if (this.SESSION_LOCATIONS && this.SESSION_LOCATIONS.length > 0) {
      this.LOCATION = this.SESSION_LOCATIONS[0].LOCATION;
    }
  }

  @OneToMany(
    () => ExamEnrollment,
    (enrollment: ExamEnrollment) => enrollment.SESSION,
  )
  ENROLLMENTS: ExamEnrollment[];

  @OneToMany(() => ExamSessionLocation, (sl: ExamSessionLocation) => sl.SESSION)
  SESSION_LOCATIONS: ExamSessionLocation[];
}
