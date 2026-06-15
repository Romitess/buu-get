import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ExamLocationSeat } from '../../exam-location-seats/entities/exam-location-seat.entity';
import { ExamSessionLocation } from '../../exam-session-locations/entities/exam-session-location.entity';

export enum SeatLabelFormat {
  ROW_COL = 'ROW_COL',
  RUNNING_NUMBER = 'RUNNING_NUMBER',
  CUSTOM = 'CUSTOM',
}

@Entity('EXAM_T_LOCATIONS')
export class ExamLocation {
  @ApiProperty({ example: 1, description: 'รหัสสถานที่จัดสอบ' })
  @PrimaryGeneratedColumn({ name: 'LOCATION_ID', comment: 'รหัสสถานที่จัดสอบ' })
  LOCATION_ID: number;

  @ApiProperty({ example: 'อาคารเรียนรวม', description: 'ชื่อสถานที่จัดสอบ' })
  @Column({
    name: 'LOCATION_NAME',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อสถานที่จัดสอบ',
  })
  LOCATION_NAME: string;

  @ApiProperty({
    example: 'QS2-101',
    description: 'เลขที่ห้องสอบ',
    required: false,
  })
  @Column({
    name: 'LOCATION_ROOM_NO',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'เลขที่ห้องสอบ',
  })
  LOCATION_ROOM_NO: string | null;

  @ApiProperty({ example: 1, description: 'ชั้น', required: false })
  @Column({
    name: 'LOCATION_FLOOR_NO',
    type: 'int',
    nullable: true,
    comment: 'ชั้น',
  })
  LOCATION_FLOOR_NO: number | null;

  @ApiProperty({ example: 10, description: 'จำนวนแถวทั้งหมด', required: false })
  @Column({
    name: 'LOCATION_TOTAL_ROWS',
    type: 'int',
    nullable: true,
    comment: 'จำนวนแถวทั้งหมด',
  })
  LOCATION_TOTAL_ROWS: number | null;

  @ApiProperty({
    example: 5,
    description: 'จำนวนคอลัมน์ทั้งหมด',
    required: false,
  })
  @Column({
    name: 'LOCATION_TOTAL_COLS',
    type: 'int',
    nullable: true,
    comment: 'จำนวนคอลัมน์ทั้งหมด',
  })
  LOCATION_TOTAL_COLS: number | null;

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
    example: SeatLabelFormat.ROW_COL,
    enum: SeatLabelFormat,
    description: 'รูปแบบ Label ที่นั่ง (ROW_COL, RUNNING_NUMBER, CUSTOM)',
    required: false,
  })
  @Column({
    name: 'SEAT_LABEL_FORMAT',
    type: 'enum',
    enum: SeatLabelFormat,
    nullable: true,
    comment: 'รูปแบบ Label ที่นั่ง (ROW_COL, RUNNING_NUMBER, CUSTOM)',
  })
  SEAT_LABEL_FORMAT: SeatLabelFormat | null;

  @ApiProperty({
    example: 0,
    description: 'สถานะการแบ่งที่นั่ง (0: NORMAL, 1: SPLIT)',
    required: false,
  })
  @Column({
    name: 'LOCATION_IS_SPLIT',
    type: 'tinyint',
    default: 0,
    comment: 'สถานะการแบ่งที่นั่ง (0: NORMAL, 1: SPLIT)',
  })
  LOCATION_IS_SPLIT: number;

  @ApiProperty({ description: 'วันที่สร้าง' })
  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้างสถานที่จัดสอบ' })
  CREATED_AT: Date;

  @ApiProperty({ description: 'วันที่แก้ไข' })
  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขสถานที่จัดสอบ' })
  UPDATED_AT: Date;

  @ApiProperty({ description: 'วันที่ลบ', required: false })
  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบสถานที่จัดสอบ',
  })
  DELETED_AT: Date | null;

  @OneToMany(() => ExamLocationSeat, (seat: ExamLocationSeat) => seat.LOCATION)
  SEATS: ExamLocationSeat[];

  @OneToMany(
    () => ExamSessionLocation,
    (sl: ExamSessionLocation) => sl.LOCATION,
  )
  SESSION_LOCATIONS: ExamSessionLocation[];
}
