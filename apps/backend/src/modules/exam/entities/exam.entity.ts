import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';
import { FundSource } from '../../fund-sources/entities/fund-source.entity';
import { ExamPasscode } from './exam-passcode.entity';

@Entity('EXAM_T_EXAM')
export class Exam {
  @PrimaryGeneratedColumn({ name: 'EXAM_ID', comment: 'รหัสข้อสอบ' })
  EXAM_ID: number;

  @Column({
    name: 'EXAM_NAME',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อข้อสอบ',
  })
  EXAM_NAME: string;

  @Column({
    name: 'EXAM_ROUND',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'รอบการสอบ',
  })
  EXAM_ROUND: string;

  @Column({
    name: 'EXAM_TYPE',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'ประเภทข้อสอบ',
  })
  EXAM_TYPE: string;

  @Column({
    name: 'EXAM_FORMAT',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'รูปแบบข้อสอบ',
  })
  EXAM_FORMAT: string;

  @Column({
    name: 'EXAM_FEE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'ค่าสมัครสอบ',
  })
  EXAM_FEE: number;

  @Column({
    name: 'EXAM_DATE',
    type: 'date',
    nullable: true,
    comment: 'วันที่สอบ',
  })
  EXAM_DATE: string;

  @Column({
    name: 'EXAM_REG_START_DATE',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่เปิดรับสมัคร',
  })
  EXAM_REG_START_DATE: Date;

  @Column({
    name: 'EXAM_REG_END_DATE',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ปิดรับสมัคร',
  })
  EXAM_REG_END_DATE: Date;

  @Column({
    name: 'EXAM_PAY_START_DATE',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่เปิดให้ชำระเงิน',
  })
  EXAM_PAY_START_DATE: Date;

  @Column({
    name: 'EXAM_PAY_END_DATE',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ปิดให้ชำระเงิน',
  })
  EXAM_PAY_END_DATE: Date;

  @Column({
    name: 'EXAM_PUBLISHED',
    type: 'boolean',
    default: false,
    comment: 'สถานะการเผยแพร่',
  })
  EXAM_PUBLISHED: boolean;

  @Column({
    name: 'EXAM_MOODLE_COURSE_ID',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'รหัสวิชาใน moodle',
  })
  EXAM_MOODLE_COURSE_ID: string;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @OneToMany(() => ExamSession, (session) => session.EXAM, { cascade: true })
  SESSIONS: ExamSession[];

  @Column({ name: 'FUND_SOURCE_ID', nullable: true, comment: 'รหัสแหล่งทุน' })
  FUND_SOURCE_ID: number;

  @ManyToOne(() => FundSource)
  @JoinColumn({ name: 'FUND_SOURCE_ID' })
  FUND_SOURCE: FundSource;

  @OneToMany(() => ExamPasscode, (passcode) => passcode.EXAM)
  PASSCODES: ExamPasscode[];
}
