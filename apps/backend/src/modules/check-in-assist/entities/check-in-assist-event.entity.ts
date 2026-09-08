import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CheckInAssistSession } from './check-in-assist-session.entity';

export enum CheckInAssistEventType {
  CHECKED_IN = 'CHECKED_IN',
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_CODE = 'INVALID_CODE',
  WRONG_ROOM = 'WRONG_ROOM',
}

@Entity('CHECK_IN_ASSIST_EVENTS')
@Index('IDX_CAE_CAS_SEQ', ['CAS_ID', 'SEQ'])
export class CheckInAssistEvent {
  @PrimaryGeneratedColumn({ name: 'CAE_ID', comment: 'รหัส event' })
  CAE_ID: number;

  @Column({ name: 'CAS_ID', comment: 'รหัส session ช่วยแสกน' })
  CAS_ID: number;

  @Column({ name: 'SEQ', type: 'int', comment: 'ลำดับ event ต่อ session' })
  SEQ: number;

  @Column({
    name: 'EVENT_TYPE',
    type: 'varchar',
    length: 32,
    comment: 'ประเภท event',
  })
  EVENT_TYPE: CheckInAssistEventType;

  @Column({
    name: 'SCANNED_CODE',
    type: 'varchar',
    length: 64,
    comment: 'รหัสที่แสกน',
  })
  SCANNED_CODE: string;

  @Column({
    name: 'ERM_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสผู้สมัคร (ถ้ามี)',
  })
  ERM_ID: number | null;

  @Column({ name: 'SCANNER_USER_ID', comment: 'ผู้แสกน' })
  SCANNER_USER_ID: number;

  @Column({
    name: 'PAYLOAD_JSON',
    type: 'text',
    nullable: true,
    comment: 'ข้อมูล candidate summary สำหรับ sync ไป host',
  })
  PAYLOAD_JSON: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @ManyToOne(() => CheckInAssistSession, (session) => session.EVENTS)
  @JoinColumn({ name: 'CAS_ID' })
  SESSION: CheckInAssistSession;
}
