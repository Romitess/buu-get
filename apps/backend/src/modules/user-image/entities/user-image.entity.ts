import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'BUU_GET_T_USER_IMAGE' })
export class UserImage {
  @PrimaryGeneratedColumn({
    name: 'USER_IMAGE_ID',
    comment: 'รหัสรูปภาพผู้ใช้งาน',
  })
  USER_IMAGE_ID: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  USER: User;

  @Column({
    name: 'USER_ID',
    type: 'int',
    comment: 'รหัสผู้ใช้งาน',
  })
  USER_ID: number;

  @Column({
    name: 'USER_IMAGE_URL',
    type: 'text',
    nullable: true,
    comment: 'URL หรือ path ของรูปภาพผู้ใช้งาน (จาก platform-gateway)',
  })
  USER_IMAGE_URL: string | null;

  @CreateDateColumn({
    name: 'CREATED_AT',
    comment: 'วันที่สร้าง',
  })
  CREATED_AT: Date;

  @UpdateDateColumn({
    name: 'UPDATED_AT',
    comment: 'วันที่แก้ไข',
  })
  UPDATED_AT: Date;
}
