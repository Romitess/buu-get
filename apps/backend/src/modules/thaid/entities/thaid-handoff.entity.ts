import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ThaidHandoffKind = 'session' | 'register_proof';

@Entity({ name: 'BUU_GET_T_THAID_HANDOFF' })
export class ThaidHandoff {
  @PrimaryGeneratedColumn({
    name: 'THAID_HANDOFF_ID',
    comment: 'รหัสตั๋วส่งต่อผล ThaID',
  })
  thaidHandoffId: number;

  @Index('UQ_THAID_HANDOFF_HASH', { unique: true })
  @Column({
    name: 'TICKET_HASH',
    type: 'varchar',
    length: 64,
    comment: 'SHA-256 ของตั๋วที่ส่งให้เบราว์เซอร์',
  })
  ticketHash: string;

  @Column({
    name: 'KIND',
    type: 'varchar',
    length: 32,
    comment: 'session สำหรับแลกผล หรือ register_proof สำหรับตอนสมัคร',
  })
  kind: ThaidHandoffKind;

  @Column({
    name: 'PAYLOAD_JSON',
    type: 'text',
    comment: 'ผลลัพธ์ที่ต้องส่งต่อ ไม่เก็บ token ของ ThaID',
  })
  payloadJson: string;

  @Column({
    name: 'EXPIRES_AT',
    type: 'datetime',
    comment: 'เวลาหมดอายุของตั๋ว',
  })
  expiresAt: Date;

  @Column({
    name: 'CONSUMED_AT',
    type: 'datetime',
    nullable: true,
    comment: 'เวลาที่ใช้ตั๋วแล้ว ใช้ได้ครั้งเดียว',
  })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  createdAt: Date;
}
