import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ThaidIntent = 'login' | 'register' | 'update';

@Entity({ name: 'BUU_GET_T_THAID_AUTH_STATE' })
export class ThaidAuthState {
  @PrimaryGeneratedColumn({
    name: 'THAID_STATE_ID',
    comment: 'รหัส state ของ ThaID',
  })
  thaidStateId: number;

  @Index('UQ_THAID_STATE_HASH', { unique: true })
  @Column({
    name: 'STATE_HASH',
    type: 'varchar',
    length: 64,
    comment: 'SHA-256 ของ state ที่ส่งให้กรมการปกครอง',
  })
  stateHash: string;

  @Column({
    name: 'INTENT',
    type: 'varchar',
    length: 16,
    comment: 'เจตนา login, register หรือ update',
  })
  intent: ThaidIntent;

  @Column({
    name: 'USER_ID',
    type: 'int',
    nullable: true,
    comment: 'ผู้ใช้ที่กดอัปเดตข้อมูล ใช้เฉพาะ intent update',
  })
  userId: number | null;

  @Column({
    name: 'EXPIRES_AT',
    type: 'datetime',
    comment: 'เวลาหมดอายุของ state',
  })
  expiresAt: Date;

  @Column({
    name: 'CONSUMED_AT',
    type: 'datetime',
    nullable: true,
    comment: 'เวลาที่ใช้ state แล้ว ใช้ได้ครั้งเดียว',
  })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  createdAt: Date;
}
