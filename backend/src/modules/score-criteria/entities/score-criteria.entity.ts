import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('BUU_GET_T_SCORE_CRITERIA')
export class ScoreCriteria {
  @PrimaryGeneratedColumn({
    name: 'SCR_ID',
    comment: 'รหัสเกณฑ์คะแนน',
  })
  SCR_ID: number;

  @Column({
    name: 'SCR_CONTENT',
    type: 'text',
    nullable: true,
    comment: 'ข้อมูล Band Rules เก็บเป็น JSON',
  })
  SCR_CONTENT: string | null;

  @Column({
    name: 'SCR_ACTIVE',
    type: 'boolean',
    default: false,
    comment: 'ชุดที่เปิดใช้งาน (เปิดได้ครั้งละ 1 ชุด)',
  })
  SCR_ACTIVE: boolean;

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
}
