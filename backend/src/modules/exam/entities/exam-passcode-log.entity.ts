import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exam } from './exam.entity';
import { ExamPasscode } from './exam-passcode.entity';

@Entity('EXAM_T_PASSCODE_LOGS')
export class ExamPasscodeLog {
  @PrimaryGeneratedColumn({
    name: 'LOG_ID',
    comment: 'รหัสตาราง log การใช้งาน passcode',
  })
  LOG_ID: number;

  @Column({ name: 'EXAM_ID', comment: 'รหัสข้อสอบ' })
  EXAM_ID: number;

  @Column({ name: 'PASSCODE_ID', comment: 'รหัส passcode ที่ถูกใช้' })
  PASSCODE_ID: number;

  @Column({
    name: 'FULL_NAME',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อ-นามสกุลของผู้ใช้งาน',
  })
  FULL_NAME: string;

  @Column({
    name: 'PASSCODE',
    type: 'varchar',
    length: 50,
    comment: 'passcode ที่ถูกใช้',
  })
  PASSCODE: string;

  @CreateDateColumn({ name: 'USED_AT', comment: 'วันที่-เวลาที่ใช้งาน' })
  USED_AT: Date;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'EXAM_ID' })
  EXAM: Exam;

  @ManyToOne(() => ExamPasscode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'PASSCODE_ID' })
  PASSCODE_REF: ExamPasscode;
}
