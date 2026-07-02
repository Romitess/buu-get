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
import { ExamLocationSeat } from '../../exam-location-seats/entities/exam-location-seat.entity';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';

export enum BlockedSeatStatus {
  AVAILABLE = 0,
  BROKEN = 1,
  BLOCKED = 2,
}

@Entity('EXAM_T_BLOCKED_SEATS')
export class ExamBlockedSeat {
  @ApiProperty({ example: 1, description: 'รหัส block' })
  @PrimaryGeneratedColumn({
    name: 'BLOCK_ID',
    comment: 'รหัส bloc  k',
  })
  BLOCK_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสที่นั่งในห้องสอบ (FK)' })
  @Column({ name: 'LS_ID', comment: 'รหัสที่นั่งในห้องสอบ (FK)' })
  LS_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสรอบสอบ (FK)' })
  @Column({ name: 'SS_ID', comment: 'รหัสรอบสอบ (FK)' })
  SS_ID: number;

  @ApiProperty({
    example: BlockedSeatStatus.BLOCKED,
    enum: BlockedSeatStatus,
    description: 'สถานะการ block (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)',
  })
  @Column({
    name: 'BLOCK_STATUS',
    type: 'tinyint',
    default: BlockedSeatStatus.BLOCKED,
    comment: 'สถานะการ block (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)',
  })
  BLOCK_STATUS: BlockedSeatStatus;

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
    () => ExamLocationSeat,
    (seat: ExamLocationSeat) => seat.BLOCKED_SEATS,
  )
  @JoinColumn({ name: 'LS_ID' })
  LOCATION_SEAT: ExamLocationSeat;

  @ManyToOne(() => ExamSession, (session: ExamSession) => session.BLOCKED_SEATS)
  @JoinColumn({ name: 'SS_ID' })
  SESSION: ExamSession;
}
