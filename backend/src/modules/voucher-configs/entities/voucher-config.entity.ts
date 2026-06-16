import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('BUU_GET_T_EXAM_RULE')
export class ExamRule {
  @PrimaryGeneratedColumn({
    name: 'ID',
    comment: 'รหัสข้อปฏิบัติ',
  })
  ID: number;

  @Column({
    name: 'CONTENT_TH',
    type: 'text',
    nullable: true,
    comment: 'ข้อความข้อปฏิบัติ (ภาษาไทย)',
  })
  CONTENT_TH: string | null;

  @Column({
    name: 'CONTENT_EN',
    type: 'text',
    nullable: true,
    comment: 'ข้อความข้อปฏิบัติ (ภาษาอังกฤษ)',
  })
  CONTENT_EN: string | null;

  @Column({
    name: 'PCF_ACTIVE',
    type: 'boolean',
    default: true,
    comment: 'สถานะการใช้งาน (Active)',
  })
  PCF_ACTIVE: boolean;

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
