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
import { ExamScore } from '../../exam-scores/entities/exam-score.entity';
import { User } from '../../users/entities/user.entity';

@Entity('EXAM_T_CERTIFICATES')
export class ExamCertificate {
  @PrimaryGeneratedColumn({ name: 'CERT_ID', comment: 'รหัสใบรับรอง' })
  CERT_ID: number;

  @Column({ name: 'SCORES_ID', comment: 'รหัสคะแนนสอบ' })
  SCORES_ID: number;

  @Column({ name: 'USER_ID', comment: 'รหัสผู้ใช้' })
  USER_ID: number;

  @Column({
    name: 'CERT_ISSUED_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ออกใบรับรอง',
  })
  CERT_ISSUED_AT: Date;

  @Column({
    name: 'CERT_EXPIRES_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ใบรับรองหมดอายุ',
  })
  CERT_EXPIRES_AT: Date;

  @Column({
    name: 'CERT_CODE',
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'รหัสใบรับรอง (uuid สำหรับตรวจสอบย้อนกลับ)',
  })
  CERT_CODE: string;

  @Column({
    name: 'CERT_FILE_PATH',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'path ไฟล์ใบประกาศ PDF ที่ลงนามแล้วใน MinIO',
  })
  CERT_FILE_PATH: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @ManyToOne(() => ExamScore, (score) => score.CERTIFICATES)
  @JoinColumn({ name: 'SCORES_ID' })
  SCORE: ExamScore;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  USER: User;
}
