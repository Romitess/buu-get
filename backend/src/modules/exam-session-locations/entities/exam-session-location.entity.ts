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
import { ApiProperty } from '@nestjs/swagger';
import { ExamLocation } from '../../exam-locations/entities/exam-location.entity';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';

@Entity('EXAM_T_SESSION_LOCATIONS')
export class ExamSessionLocation {
  @ApiProperty({ example: 1, description: 'รหัส Session-Location' })
  @PrimaryGeneratedColumn({
    name: 'SL_ID',
    comment: 'รหัส Session-Location',
  })
  SL_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสสถานที่จัดสอบ (FK)' })
  @Column({
    name: 'LOCATION_ID',
    type: 'int',
    comment: 'รหัสสถานที่จัดสอบ (FK)',
  })
  LOCATION_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสรอบสอบ (FK)' })
  @Column({
    name: 'SS_ID',
    type: 'int',
    comment: 'รหัสรอบสอบ (FK)',
  })
  SS_ID: number;

  @ApiProperty({ example: 'อ.สมชาย', description: 'ชื่อกรรมการคุมสอบ' })
  @Column({
    name: 'SS_NAME',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'ชื่อกรรมการคุมสอบประจำห้องสอบ',
  })
  SS_NAME: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบ',
  })
  DELETED_AT: Date | null;

  @ManyToOne(
    () => ExamLocation,
    (location: ExamLocation) => location.SESSION_LOCATIONS,
  )
  @JoinColumn({ name: 'LOCATION_ID' })
  LOCATION: ExamLocation;

  @ManyToOne(
    () => ExamSession,
    (session: ExamSession) => session.SESSION_LOCATIONS,
  )
  @JoinColumn({ name: 'SS_ID' })
  SESSION: ExamSession;
}
