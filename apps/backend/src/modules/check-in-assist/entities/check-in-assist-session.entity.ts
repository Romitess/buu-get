import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CheckInAssistEvent } from './check-in-assist-event.entity';

export enum CheckInAssistSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum CheckInAssistSessionMode {
  HOST_ASSIST = 'HOST_ASSIST',
  ROOM_STATION = 'ROOM_STATION',
}

@Entity('CHECK_IN_ASSIST_SESSIONS')
export class CheckInAssistSession {
  @PrimaryGeneratedColumn({ name: 'CAS_ID', comment: 'รหัส session ช่วยแสกน' })
  CAS_ID: number;

  @Column({ name: 'EXAM_ID', comment: 'รหัสการสอบ' })
  EXAM_ID: number;

  @Column({
    name: 'HOST_PSN_ID',
    type: 'varchar',
    length: 10,
    comment: 'รหัสบุคลากรผู้เปิด session (host)',
  })
  HOST_PSN_ID: string;

  @Column({
    name: 'JOIN_TOKEN',
    type: 'varchar',
    length: 64,
    unique: true,
    comment: 'โทเค็นสำหรับเข้าร่วมช่วยแสกน',
  })
  JOIN_TOKEN: string;

  @Column({
    name: 'SESSION_IDS_JSON',
    type: 'text',
    comment: 'รายการ SS_ID ที่อยู่ในขอบเขต session (JSON array)',
  })
  SESSION_IDS_JSON: string;

  @Column({
    name: 'MODE',
    type: 'varchar',
    length: 16,
    default: CheckInAssistSessionMode.HOST_ASSIST,
    comment: 'โหมด session (HOST_ASSIST/ROOM_STATION)',
  })
  MODE: CheckInAssistSessionMode;

  @Column({
    name: 'SL_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัส Session-Location เมื่อเป็นสถานีประจำห้อง',
  })
  SL_ID: number | null;

  @Column({
    name: 'STATUS',
    type: 'varchar',
    length: 16,
    default: CheckInAssistSessionStatus.ACTIVE,
    comment: 'สถานะ session (ACTIVE/CLOSED)',
  })
  STATUS: CheckInAssistSessionStatus;

  @Column({
    name: 'EXPIRES_AT',
    type: 'timestamp',
    comment: 'วันหมดอายุ session',
  })
  EXPIRES_AT: Date;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @OneToMany(() => CheckInAssistEvent, (event) => event.SESSION)
  EVENTS: CheckInAssistEvent[];

  getSessionIds(): number[] {
    try {
      const parsed = JSON.parse(this.SESSION_IDS_JSON) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is number => typeof id === 'number');
    } catch {
      return [];
    }
  }

  setSessionIds(sessionIds: number[]): void {
    this.SESSION_IDS_JSON = JSON.stringify(sessionIds);
  }
}
