import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum TransactionApiType {
  APPROVE = 1,
  PAYMENT = 2,
  INQUIRY = 3,
  REVERSAL = 4,
}

@Entity('FIN_T_TRANSACTION_STATUS_HISTORY')
export class TransactionStatusHistory {
  @PrimaryGeneratedColumn({ name: 'TSH_ID', comment: 'รหัส log นี้' })
  TSH_ID: number;

  @Column({ name: 'TRANX_ID', comment: 'รหัสธุรกรรม (Foreign Key)' })
  TRANX_ID: number;

  @Column({
    name: 'TSH_FROM',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'สถานะก่อนเปลี่ยน (NULL = เพิ่งสร้างใหม่)',
  })
  TSH_FROM: string | null;

  @Column({
    name: 'TSH_TO',
    type: 'varchar',
    length: 20,
    comment: 'สถานะหลังเปลี่ยน',
  })
  TSH_TO: string;

  @Column({
    name: 'TSH_API_TYPE',
    type: 'int',
    comment: 'ประเภท API (1=APPROVE, 2=PAYMENT, 3=INQUIRY, 4=REVERSAL)',
  })
  TSH_API_TYPE: TransactionApiType;

  @Column({
    name: 'TSH_RESP_CODE',
    type: 'varchar',
    length: 10,
    comment: 'รหัสผลลัพธ์ที่ได้จากธนาคาร',
  })
  TSH_RESP_CODE: string;

  @Column({
    name: 'TSH_RESP_MESSAGE',
    type: 'varchar',
    length: 255,
    comment: 'ข้อความอธิบายผลลัพธ์',
  })
  TSH_RESP_MESSAGE: string;

  @CreateDateColumn({
    name: 'CREATED_AT',
    comment: 'เวลาที่เกิดการเปลี่ยนสถานะ',
  })
  CREATED_AT: Date;

  @ManyToOne(
    () => Transaction,
    (transaction: Transaction) => transaction.STATUS_HISTORIES,
  )
  @JoinColumn({ name: 'TRANX_ID' })
  TRANSACTION: Relation<Transaction>;
}
