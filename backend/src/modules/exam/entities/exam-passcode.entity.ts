import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exam } from './exam.entity';

@Entity('EXAM_T_PASSCODES')
export class ExamPasscode {
  @PrimaryGeneratedColumn({
    name: 'PASSCODE_ID',
    comment: 'รหัสตาราง passcode',
  })
  PASSCODE_ID: number;

  @Column({ name: 'EXAM_ID', comment: 'รหัสข้อสอบ' })
  EXAM_ID: number;

  @Column({
    name: 'NATIONAL_ID',
    type: 'varchar',
    length: 50,
    comment: 'รหัสประชาชน',
  })
  NATIONAL_ID: string;

  @Column({
    name: 'FULL_NAME',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อ-นามสกุล',
  })
  FULL_NAME: string;

  @Column({
    name: 'PASSCODE',
    type: 'varchar',
    length: 50,
    comment: 'รหัสเข้าสอบ',
  })
  PASSCODE: string;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @ManyToOne(() => Exam, (exam) => exam.PASSCODES, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'EXAM_ID' })
  EXAM: Exam;
}
