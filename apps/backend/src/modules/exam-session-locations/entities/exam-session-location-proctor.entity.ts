import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ExamSessionLocation } from './exam-session-location.entity';

@Entity('EXAM_T_SESSION_LOCATION_PROCTORS')
@Unique('UQ_SLP_SL_USER', ['SL_ID', 'USER_ID'])
export class ExamSessionLocationProctor {
  @PrimaryGeneratedColumn({
    name: 'SLP_ID',
    comment: 'รหัสการมอบหมายผู้คุมสอบประจำห้อง',
  })
  SLP_ID: number;

  @Column({ name: 'SL_ID', comment: 'รหัส Session-Location (FK)' })
  SL_ID: number;

  @Column({ name: 'USER_ID', comment: 'รหัสผู้ใช้ผู้คุมสอบ (FK)' })
  USER_ID: number;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @ManyToOne(
    () => ExamSessionLocation,
    (sessionLocation) => sessionLocation.PROCTORS,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'SL_ID' })
  SESSION_LOCATION: ExamSessionLocation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  USER: User;
}
