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
import { ExamScore } from './exam-score.entity';
import { ScoreRubricItem } from '../../score-rubrics/entities/score-rubric-item.entity';

@Entity('EXAM_T_SCORE_LINES')
export class ExamScoreLine {
  @PrimaryGeneratedColumn({ name: 'SCL_ID', comment: 'รหัสคะแนนรายหมวด' })
  SCL_ID: number;

  @Column({ name: 'SCORES_ID', comment: 'รหัสคะแนนสอบ' })
  SCORES_ID: number;

  @Column({
    name: 'SRBI_ID',
    nullable: true,
    comment: 'รหัสรายการในชุดเกณฑ์ (อ้างอิง)',
  })
  SRBI_ID: number | null;

  @Column({
    name: 'SCL_NAME_TH',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อหมวดคะแนน snapshot (ภาษาไทย)',
  })
  SCL_NAME_TH: string;

  @Column({
    name: 'SCL_NAME_EN',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อหมวดคะแนน snapshot (ภาษาอังกฤษ)',
  })
  SCL_NAME_EN: string;

  @Column({
    name: 'SCL_MAX_SCORE',
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'คะแนนเต็ม snapshot',
  })
  SCL_MAX_SCORE: number;

  @Column({
    name: 'SCL_SORT_ORDER',
    type: 'int',
    default: 0,
    comment: 'ลำดับการแสดงผล snapshot',
  })
  SCL_SORT_ORDER: number;

  @Column({
    name: 'SCL_SCORE',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'คะแนนที่ได้',
  })
  SCL_SCORE: number | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @ManyToOne(() => ExamScore, (score) => score.LINES)
  @JoinColumn({ name: 'SCORES_ID' })
  SCORE: ExamScore;

  @ManyToOne(() => ScoreRubricItem, { nullable: true })
  @JoinColumn({ name: 'SRBI_ID' })
  RUBRIC_ITEM: ScoreRubricItem | null;
}
