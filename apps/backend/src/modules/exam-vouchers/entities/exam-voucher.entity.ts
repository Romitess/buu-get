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

@Entity('EXAM_T_VOUCHERS')
export class ExamVoucher {
  @PrimaryGeneratedColumn({ name: 'VC_ID', comment: 'เลขที่บัตรสอบ' })
  VC_ID: number;

  @Column({ name: 'ERM_ID', comment: 'รหัสผู้สมัคร' })
  ERM_ID: number;

  @Column({
    name: 'VC_CODE',
    type: 'varchar',
    length: 255,
    comment: 'รหัสบัตรสอบ',
  })
  VC_CODE: string;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้างบัตรสอบ' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขบัตรสอบ' })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบบัตรสอบ',
  })
  DELETED_AT: Date | null;

  @ManyToOne(() => ExamEnrollment, (enrollment) => enrollment.VOUCHERS)
  @JoinColumn({ name: 'ERM_ID' })
  ENROLLMENT: ExamEnrollment;
}
