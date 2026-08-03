import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ScoreRubricItem } from './score-rubric-item.entity';

@Entity('BUU_GET_T_SCORE_RUBRICS')
export class ScoreRubric {
  @PrimaryGeneratedColumn({ name: 'SRB_ID', comment: 'รหัสชุดเกณฑ์คะแนน' })
  SRB_ID: number;

  @Column({
    name: 'SRB_NAME_TH',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อชุดเกณฑ์คะแนน (ภาษาไทย)',
  })
  SRB_NAME_TH: string;

  @Column({
    name: 'SRB_NAME_EN',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อชุดเกณฑ์คะแนน (ภาษาอังกฤษ)',
  })
  SRB_NAME_EN: string;

  @Column({
    name: 'SRB_IS_DEFAULT',
    type: 'boolean',
    default: false,
    comment: 'ชุดเกณฑ์เริ่มต้นของระบบ',
  })
  SRB_IS_DEFAULT: boolean;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขล่าสุด' })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบ (Soft Delete)',
  })
  DELETED_AT: Date | null;

  @OneToMany(() => ScoreRubricItem, (item) => item.RUBRIC, { cascade: true })
  ITEMS: ScoreRubricItem[];
}
