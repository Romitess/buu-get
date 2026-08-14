import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notification } from './notification.entity';

@Entity('NTF_T_NOTIFICATION_RECIPIENTS')
@Unique('UQ_NTR_NTF_USER', ['NTF_ID', 'USER_ID'])
@Index('IDX_NTR_USER_READ_CREATED', ['USER_ID', 'NTR_READ_AT', 'CREATED_AT'])
export class NotificationRecipient {
  @PrimaryGeneratedColumn({
    name: 'NTR_ID',
    comment: 'รหัสผู้รับการแจ้งเตือน',
  })
  NTR_ID: number;

  @Column({ name: 'NTF_ID', comment: 'รหัสการแจ้งเตือน' })
  NTF_ID: number;

  @Column({ name: 'USER_ID', comment: 'รหัสผู้ใช้ผู้รับ' })
  USER_ID: number;

  @Column({
    name: 'NTR_READ_AT',
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'วันเวลาที่อ่าน',
  })
  NTR_READ_AT: Date | null;

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

  @ManyToOne(() => Notification, (notification) => notification.RECIPIENTS, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'NTF_ID' })
  NOTIFICATION: Notification;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  USER: User;
}
