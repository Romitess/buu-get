import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationRecipient } from './notification-recipient.entity';

@Entity('NTF_T_NOTIFICATIONS')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'NTF_ID', comment: 'รหัสการแจ้งเตือน' })
  NTF_ID: number;

  @Column({
    name: 'NTF_TYPE',
    type: 'varchar',
    length: 64,
    comment: 'ประเภทการแจ้งเตือน',
  })
  NTF_TYPE: string;

  @Column({
    name: 'NTF_TITLE',
    type: 'varchar',
    length: 255,
    comment: 'หัวข้อการแจ้งเตือน',
  })
  NTF_TITLE: string;

  @Column({
    name: 'NTF_BODY',
    type: 'text',
    comment: 'ข้อความสรุปการแจ้งเตือน',
  })
  NTF_BODY: string;

  @Column({
    name: 'NTF_PAYLOAD',
    type: 'text',
    comment: 'ข้อมูลสรุปแบบ JSON',
  })
  NTF_PAYLOAD: string;

  @Column({
    name: 'NTF_LINK',
    type: 'varchar',
    length: 512,
    nullable: true,
    comment: 'ลิงก์ไปหน้ารายงานที่เกี่ยวข้อง',
  })
  NTF_LINK: string | null;

  @Column({
    name: 'NTF_DEDUPE_KEY',
    type: 'varchar',
    length: 128,
    unique: true,
    comment: 'คีย์กันสร้างซ้ำ (เช่น daily_payment_summary:YYYY-MM-DD)',
  })
  NTF_DEDUPE_KEY: string;

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

  @OneToMany(() => NotificationRecipient, (recipient) => recipient.NOTIFICATION)
  RECIPIENTS: NotificationRecipient[];
}
