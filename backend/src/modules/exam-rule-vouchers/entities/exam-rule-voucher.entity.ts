import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('BUU_GET_T_EXAM_RULE_VOUCHERS')
export class ExamRuleVoucher {
  @PrimaryGeneratedColumn({
    name: 'EXRV_ID',
    comment: 'รหัสข้อปฏิบัติ',
  })
  EXRV_ID: number;

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
