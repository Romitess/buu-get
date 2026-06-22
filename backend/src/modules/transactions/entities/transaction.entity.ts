import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
  Relation,
} from 'typeorm';
import { ExamEnrollment } from '../../exam-enrollments/entities/exam-enrollment.entity';
import { BankReconcile } from '../../bank-reconciles/entities/bank-reconcile.entity';
import { Receipt } from '../../receipts/entities/receipt.entity';
import { TransactionRef } from '../../transaction-refs/entities/transaction-ref.entity';
import { TransactionProfile } from '../../transaction-profiles/entities/transaction-profile.entity';
import { PaymentConfig } from '../../payment-configs/entities/payment-config.entity';
import { TransactionStatusHistory } from '../../transaction-status-history/entities/transaction-status-history.entity';

export enum TransactionPaymentMethod {
  QR = 0,
}

export enum TransactionPaymentStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  PAID = 3,
  PAYMENT_FAILED = 4,
  EXPIRED = 5,
  REVERSED = 6,
  REFUND = 7,
}

export enum TransactionChannel {
  ATM = 0,
  COUNTER = 1,
  MOBILE_BANKING = 2,
  QR = 3,
}

export enum TransactionMatchStatus {
  UNMATCH = 0,
  MATCH = 1,
  MISSING = 2,
}

@Entity('FIN_T_TRANSACTIONS')
export class Transaction {
  @PrimaryGeneratedColumn({ name: 'TRANX_ID', comment: 'รหัสธุรกรรม' })
  TRANX_ID: number;

  @Column({ name: 'ERM_ID', comment: 'รหัสผู้สมัคร (Foreign Key)' })
  ERM_ID: number;

  @Column({
    name: 'PC_ID',
    comment: 'รหัสการตั้งค่าการชำระเงิน (Foreign Key)',
  })
  PC_ID: number;

  @Column({
    name: 'TRANX_AMOUNT',
    type: 'decimal',
    precision: 18,
    scale: 2,
    comment: 'จำนวนเงิน',
  })
  TRANX_AMOUNT: number;

  @Column({
    name: 'TRANX_QR_CODE',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Generated QR payment reference',
  })
  TRANX_QR_CODE: string | null;

  @Column({
    name: 'TRANX_PAYMENT_METHOD',
    type: 'int',
    default: TransactionPaymentMethod.QR,
    comment: 'สถานะ/ช่องทางการชำระเงิน',
  })
  TRANX_PAYMENT_METHOD: TransactionPaymentMethod;

  @Column({
    name: 'TRANX_MATCH_STATUS',
    type: 'int',
    default: TransactionMatchStatus.UNMATCH,
    comment: 'สถานะการจับคู่ตรวจสอบยอดเงิน (0:UNMATCH, 1:MATCH, 2:MISSING)',
  })
  TRANX_MATCH_STATUS: TransactionMatchStatus;

  @Column({
    name: 'TRANX_BANK_CODE',
    type: 'varchar',
    length: 3,
    comment: 'รหัสธนาคาร',
  })
  TRANX_BANK_CODE: string;

  @Column({
    name: 'TRANX_CHANNEL',
    type: 'int',
    comment: 'ช่องทาง',
  })
  TRANX_CHANNEL: TransactionChannel;

  @Column({
    name: 'TRANX_PAYMENT_STATUS',
    type: 'int',
    default: TransactionPaymentStatus.PENDING,
    comment: 'สถานะการชำระเงิน',
  })
  TRANX_PAYMENT_STATUS: TransactionPaymentStatus;

  @Column({
    name: 'TRANX_BANK_DATETIME',
    type: 'timestamp',
    nullable: true,
    comment: 'วันเวลาธนาคาร',
  })
  TRANX_BANK_DATETIME: Date | null;

  @Column({
    name: 'TRANX_EFFECTIVE_DATE',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่มีผล',
  })
  TRANX_EFFECTIVE_DATE: Date | null;

  @Column({
    name: 'TRANX_EXPIRES_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันหมดอายุ',
  })
  TRANX_EXPIRES_AT: Date | null;

  @Column({
    name: 'TRANX_PAID_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ชำระเงิน',
  })
  TRANX_PAID_AT: Date | null;

  @Column({
    name: 'TRANX_REJECTED_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ปฏิเสธ',
  })
  TRANX_REJECTED_AT: Date | null;

  @CreateDateColumn({
    name: 'TRANX_CREATED_AT',
    type: 'timestamp',
    comment: 'วันที่สร้าง',
  })
  TRANX_CREATED_AT: Date;

  @UpdateDateColumn({
    name: 'TRANX_UPDATED_AT',
    type: 'timestamp',
    comment: 'วันที่แก้ไขล่าสุด',
  })
  TRANX_UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'TRANX_DELETED_AT',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่ลบ (Soft Delete)',
  })
  TRANX_DELETED_AT: Date | null;

  @OneToOne(() => ExamEnrollment, (enrollment) => enrollment.TRANSACTION)
  @JoinColumn({ name: 'ERM_ID' })
  ENROLLMENT: ExamEnrollment;

  // Since we haven't created BankReconcile and Receipt yet, we just declare the type and relations.
  // We'll export them later, but TS will need the imports. I've imported them above.
  @OneToMany(() => BankReconcile, (reconcile) => reconcile.TRANSACTION)
  BANK_RECONCILES: BankReconcile[];

  @OneToMany(() => Receipt, (receipt) => receipt.TRANSACTION)
  RECEIPTS: Receipt[];

  @OneToOne(() => TransactionProfile, (profile) => profile.TRANSACTION)
  PROFILE: TransactionProfile;
  @OneToOne(() => TransactionRef, (ref) => ref.TRANSACTION)
  TRANSACTION_REF: TransactionRef;

  @ManyToOne(
    () => PaymentConfig,
    (config: PaymentConfig) => config.TRANSACTIONS,
  )
  @JoinColumn({ name: 'PC_ID' })
  PAYMENT_CONFIG: Relation<PaymentConfig>;

  @OneToMany(
    () => TransactionStatusHistory,
    (history: TransactionStatusHistory) => history.TRANSACTION,
  )
  STATUS_HISTORIES: Relation<TransactionStatusHistory>[];
}
