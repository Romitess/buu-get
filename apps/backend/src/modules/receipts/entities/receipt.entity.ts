import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { VoidedReceipt } from '../../voided-receipts/entities/voided-receipt.entity';

export enum ReceiptStatus {
  UNISSUED = 0,
  ISSUED = 1,
  VOIDED = 2,
}

@Entity('FIN_T_RECEIPTS')
export class Receipt {
  @PrimaryGeneratedColumn({ name: 'RC_ID', comment: 'รหัสใบเสร็จ' })
  RC_ID: number;

  @Column({ name: 'TRANX_ID', comment: 'รหัสธุรกรรม (Foreign Key)' })
  TRANX_ID: number;

  @Column({ name: 'RC_TAX_ID', type: 'bigint', nullable: true })
  RC_TAX_ID: string | null;

  @Column({ name: 'RC_NAME', type: 'varchar', length: 255, nullable: true })
  RC_NAME: string | null;

  @Column({ name: 'RC_PHONE', type: 'varchar', length: 15, nullable: true })
  RC_PHONE: string | null;

  @Column({ name: 'RC_ADDRESS', type: 'text', nullable: true })
  RC_ADDRESS: string | null;

  @Column({
    name: 'RC_SIGNATURE_ID',
    type: 'varchar',
    length: 255,
    comment: 'รหัสลายเซ็น',
  })
  RC_SIGNATURE_ID: string;

  @Column({
    name: 'RC_VERIFY_CODE',
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'รหัสตรวจสอบใบเสร็จ',
  })
  RC_VERIFY_CODE: string;

  @Column({
    name: 'RC_STATUS',
    type: 'int',
    default: ReceiptStatus.UNISSUED,
    comment: 'สถานะใบเสร็จ (0=UNISSUED, 1=ISSUED, 2=VOIDED)',
  })
  RC_STATUS: ReceiptStatus;

  @Column({
    name: 'RC_ISSUED_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ออกใบเสร็จ',
  })
  RC_ISSUED_AT: Date | null;

  @CreateDateColumn({
    name: 'CREATED_AT',
    type: 'timestamp',
    comment: 'วันที่สร้าง',
  })
  CREATED_AT: Date;

  @UpdateDateColumn({
    name: 'UPDATED_AT',
    type: 'timestamp',
    comment: 'วันที่แก้ไขล่าสุด',
  })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ลบ (Soft Delete)',
  })
  DELETED_AT: Date | null;

  @ManyToOne(() => Transaction, (transaction) => transaction.RECEIPTS)
  @JoinColumn({ name: 'TRANX_ID' })
  TRANSACTION: Transaction;

  @OneToOne(() => VoidedReceipt, (voidedReceipt) => voidedReceipt.RECEIPT)
  VOIDED_RECEIPT: VoidedReceipt;
}
