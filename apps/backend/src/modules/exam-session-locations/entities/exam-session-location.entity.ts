import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  ExamLocation,
  SeatDirection,
} from '../../exam-locations/entities/exam-location.entity';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';
import { ExamEnrollment } from '../../exam-enrollments/entities/exam-enrollment.entity';
import { ExamSessionLocationProctor } from './exam-session-location-proctor.entity';

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

  @ApiProperty({ example: 10, description: 'จำนวนแถวทั้งหมด', required: false })
  @Column({
    name: 'TOTAL_ROWS',
    type: 'int',
    nullable: true,
    comment: 'จำนวนแถวทั้งหมด',
  })
  TOTAL_ROWS: number | null;

  @ApiProperty({
    example: 5,
    description: 'จำนวนคอลัมน์ทั้งหมด',
    required: false,
  })
  @Column({
    name: 'TOTAL_COLS',
    type: 'int',
    nullable: true,
    comment: 'จำนวนคอลัมน์ทั้งหมด',
  })
  TOTAL_COLS: number | null;

  @ApiProperty({
    example: { after_cols: [4], after_rows: [3] },
    description: 'ข้อมูลทางเดินหลังจากคอลัมน์/แถว',
    required: false,
  })
  @Column({
    name: 'AISLE_AFTER',
    type: 'json',
    nullable: true,
    comment: 'ข้อมูลทางเดินหลังจากคอลัมน์/แถว',
  })
  AISLE_AFTER: { after_cols: number[]; after_rows: number[] } | null;

  @ApiProperty({
    example: SeatDirection.HORIZONTAL,
    description: 'ทิศทางการจัดเรียงที่นั่ง',
    enum: SeatDirection,
  })
  @Column({
    name: 'LOCATION_SEAT_DIRECTION',
    type: 'enum',
    enum: SeatDirection,
    default: SeatDirection.HORIZONTAL,
    comment: 'ทิศทางการจัดเรียงที่นั่ง (HORIZONTAL, VERTICAL)',
  })
  LOCATION_SEAT_DIRECTION: SeatDirection;

  @ApiProperty({
    example: 50,
    description: 'ความจุที่นั่งทั้งหมด',
    required: false,
  })
  @Column({
    name: 'LOCATION_SEAT_CAPACITY',
    type: 'int',
    nullable: true,
    comment: 'ความจุที่นั่งทั้งหมด',
  })
  LOCATION_SEAT_CAPACITY: number | null;

  @ApiProperty({
    example: [{ label: 'A1', status: 'AVAILABLE', sortorder: 1 }],
    description: 'ผังที่นั่ง snapshot',
    required: false,
  })
  @Column({
    name: 'SEATS_SNAPSHOT',
    type: 'json',
    nullable: true,
    comment: 'ผังที่นั่ง snapshot',
  })
  SEATS_SNAPSHOT: Record<string, unknown> | Record<string, unknown>[] | null;

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

  @OneToMany(
    () => ExamEnrollment,
    (enrollment: ExamEnrollment) => enrollment.SESSION_LOCATION,
  )
  ENROLLMENTS: ExamEnrollment[];

  @OneToMany(
    () => ExamSessionLocationProctor,
    (proctor) => proctor.SESSION_LOCATION,
  )
  PROCTORS: ExamSessionLocationProctor[];
}
