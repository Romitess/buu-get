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
import { ScoreRubric } from './score-rubric.entity';

@Entity('BUU_GET_T_SCORE_RUBRIC_ITEMS')
export class ScoreRubricItem {
  @PrimaryGeneratedColumn({
    name: 'SRBI_ID',
    comment: 'รหัสรายการในชุดเกณฑ์คะแนน',
  })
  SRBI_ID: number;

  @Column({ name: 'SRB_ID', comment: 'รหัสชุดเกณฑ์คะแนน' })
  SRB_ID: number;

  @Column({
    name: 'SRBI_NAME_TH',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อหมวดคะแนน (ภาษาไทย)',
  })
  SRBI_NAME_TH: string;

  @Column({
    name: 'SRBI_NAME_EN',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อหมวดคะแนน (ภาษาอังกฤษ)',
  })
  SRBI_NAME_EN: string;

  @Column({
    name: 'SRBI_CODE',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'รหัสภายใน (เช่น LANG_USE, READING)',
  })
  SRBI_CODE: string | null;

  @Column({
    name: 'SRBI_MAX_SCORE',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 50,
    comment: 'คะแนนเต็มต่อหมวด',
  })
  SRBI_MAX_SCORE: number;

  @Column({
    name: 'SRBI_SORT_ORDER',
    type: 'int',
    default: 0,
    comment: 'ลำดับการแสดงผล',
  })
  SRBI_SORT_ORDER: number;

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

  @ManyToOne(() => ScoreRubric, (rubric) => rubric.ITEMS)
  @JoinColumn({ name: 'SRB_ID' })
  RUBRIC: ScoreRubric;
}
