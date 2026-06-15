import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ExamEnrollment } from '../../exam-enrollments/entities/exam-enrollment.entity';
import { ExamCertificate } from '../../exam-certificates/entities/exam-certificate.entity';

@Entity('EXAM_T_SCORES')
export class ExamScore {
  @PrimaryGeneratedColumn({ name: 'SCORES_ID', comment: 'รหัสคะแนนสอบ' })
  SCORES_ID: number;

  @Column({ name: 'ERM_ID', comment: 'รหัสผู้สมัคร' })
  ERM_ID: number;

  @Column({
    name: 'SC_LANG_USE_SCORE',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'คะแนน Language Use',
  })
  SC_LANG_USE_SCORE: number;

  @Column({
    name: 'SC_READING_SCORE',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'คะแนน Reading',
  })
  SC_READING_SCORE: number;

  @Column({
    name: 'SC_TOTAL_SCORE',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'คะแนนรวม',
  })
  SC_TOTAL_SCORE: number;

  @Column({
    name: 'SC_BAND_LEVEL',
    type: 'int',
    nullable: true,
    comment: 'ระดับ Band',
  })
  SC_BAND_LEVEL: number;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @OneToOne(() => ExamEnrollment, (enrollment) => enrollment.SCORE)
  @JoinColumn({ name: 'ERM_ID' })
  ENROLLMENT: ExamEnrollment;

  @OneToMany(() => ExamCertificate, (certificate) => certificate.SCORE)
  CERTIFICATES: ExamCertificate[];
}
