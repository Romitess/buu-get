import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ExamLocation } from '../../exam-locations/entities/exam-location.entity';

export enum LocationSeatStatus {
  AVAILABLE = 0,
  BROKEN = 1,
  BLOCKED = 2,
}

@Entity('EXAM_T_LOCATION_SEATS')
@Unique('UQ_LOCATION_ROW_COL', ['LOCATION_ID', 'LS_ROW_NO', 'LS_COL_NO'])
@Unique('UQ_LOCATION_SEAT_LABEL', ['LOCATION_ID', 'LS_SEAT_LABEL'])
export class ExamLocationSeat {
  @ApiProperty({ example: 1, description: 'รหัสที่นั่งในห้องสอบ' })
  @PrimaryGeneratedColumn({
    name: 'LS_ID',
    comment: 'รหัสที่นั่งในห้องสอบ',
  })
  LS_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสสถานที่จัดสอบ (FK)' })
  @Column({ name: 'LOCATION_ID', comment: 'รหัสสถานที่จัดสอบ (FK)' })
  LOCATION_ID: number;

  @ApiProperty({ example: 1, description: 'แถวที่' })
  @Column({ name: 'LS_ROW_NO', type: 'int', comment: 'แถวที่' })
  LS_ROW_NO: number;

  @ApiProperty({ example: 1, description: 'คอลัมน์ที่' })
  @Column({ name: 'LS_COL_NO', type: 'int', comment: 'คอลัมน์ที่' })
  LS_COL_NO: number;

  @ApiProperty({
    example: 'A1',
    description: 'Label ที่นั่ง',
    required: false,
  })
  @Column({
    name: 'LS_SEAT_LABEL',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Label ที่นั่ง',
  })
  LS_SEAT_LABEL: string | null;

  @ApiProperty({
    example: LocationSeatStatus.AVAILABLE,
    enum: LocationSeatStatus,
    description: 'สถานะที่นั่ง (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)',
  })
  @Column({
    name: 'LS_SEAT_STATUS',
    type: 'tinyint',
    default: LocationSeatStatus.AVAILABLE,
    comment: 'สถานะที่นั่ง (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)',
  })
  LS_SEAT_STATUS: LocationSeatStatus;

  @ApiProperty({
    example: 1,
    description: 'ลำดับการเรียง',
    required: false,
  })
  @Column({
    name: 'LS_SORT_ORDER',
    type: 'int',
    nullable: true,
    comment: 'ลำดับการเรียง',
  })
  LS_SORT_ORDER: number | null;

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

  @ManyToOne(() => ExamLocation, (location: ExamLocation) => location.SEATS)
  @JoinColumn({ name: 'LOCATION_ID' })
  LOCATION: ExamLocation;
}
