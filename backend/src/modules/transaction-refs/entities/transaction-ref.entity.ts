import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { BankReconcile } from '../../bank-reconciles/entities/bank-reconcile.entity';

@Entity('FIN_T_TRANSACTIONS_REFS')
export class TransactionRef {
  @PrimaryGeneratedColumn({ name: 'TSR_ID', comment: 'รหัสอ้างอิงธุรกรรม' })
  TSR_ID: number;

  @Column({ name: 'TRANX_ID', comment: 'รหัสธุรกรรม (Foreign Key)' })
  TRANX_ID: number;

  @Column({
    name: 'BR_ID',
    nullable: true,
    comment: 'รหัส Bank Reconcile (Foreign Key)',
  })
  BR_ID: number | null;

  @Column({
    name: 'TSC_REF1',
    type: 'varchar',
    length: 20,
    comment: 'เลขอ้างอิง 1',
  })
  TSC_REF1: string;

  @Column({
    name: 'TSC_REF2',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'เลขอ้างอิง 2',
  })
  TSC_REF2: string | null;

  @Column({
    name: 'TSC_REF3',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'เลขอ้างอิง 3',
  })
  TSC_REF3: string | null;

  @Column({
    name: 'TSC_REF4',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'เลขอ้างอิง 4',
  })
  TSC_REF4: string | null;

  @Column({
    name: 'TSC_BANK_REF',
    type: 'varchar',
    length: 20,
    comment: 'เลขอ้างอิงธนาคาร',
  })
  TSC_BANK_REF: string;

  @Column({
    name: 'TSC_PARTNER_REF',
    type: 'varchar',
    length: 20,
    comment: 'เลขอ้างอิงพาร์ทเนอร์',
  })
  TSC_PARTNER_REF: string;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขล่าสุด' })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบ (Soft Delete)',
  })
  DELETED_AT: Date | null;

  @OneToOne(
    () => Transaction,
    (transaction: Transaction) => transaction.TRANSACTION_REF,
  )
  @JoinColumn({ name: 'TRANX_ID' })
  TRANSACTION: Relation<Transaction>;

  @ManyToOne(
    () => BankReconcile,
    (bankReconcile: BankReconcile) => bankReconcile.TRANSACTION_REFS,
  )
  @JoinColumn({ name: 'BR_ID' })
  BANK_RECONCILE: Relation<BankReconcile>;
}
