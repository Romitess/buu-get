import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';
import { TransactionRef } from '../../transaction-refs/entities/transaction-ref.entity';

@Entity('FIN_T_BANK_RECONCILES')
export class BankReconcile {
  @PrimaryGeneratedColumn({ name: 'BR_ID', comment: 'รหัส Bank Reconcile' })
  BR_ID: number;

  @Column({
    name: 'TRANX_ID',
    nullable: true,
    comment: 'รหัสธุรกรรม (Foreign Key)',
  })
  TRANX_ID: number | null;

  @Column({ name: 'CREATED_BY', comment: 'รหัสผู้สร้าง (Foreign Key)' })
  CREATED_BY: number;

  @Column({ name: 'BR_REF1', type: 'varchar', length: 20, comment: 'Ref 1' })
  BR_REF1: string;

  @Column({
    name: 'BR_REF2',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Ref 2',
  })
  BR_REF2: string | null;

  @Column({
    name: 'BR_REF3',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Ref 3',
  })
  BR_REF3: string | null;

  @Column({
    name: 'BR_REF4',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Ref 4',
  })
  BR_REF4: string | null;

  @Column({
    name: 'BR_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'จำนวนเงิน',
  })
  BR_AMOUNT: number;

  @Column({
    name: 'BR_PAID_BY',
    type: 'varchar',
    length: 20,
    comment: 'จ่ายโดย',
  })
  BR_PAID_BY: string;

  @Column({
    name: 'BR_IMPORT_KEY_HASH',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'Hash สำหรับตรวจสอบรายการนำเข้าซ้ำจากไฟล์ธนาคาร',
  })
  BR_IMPORT_KEY_HASH: string | null;

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

  @ManyToOne(() => Transaction, (transaction) => transaction.BANK_RECONCILES)
  @JoinColumn({ name: 'TRANX_ID' })
  TRANSACTION: Transaction;

  @ManyToOne(() => User, (user) => user.BANK_RECONCILES)
  @JoinColumn({ name: 'CREATED_BY' })
  USER: User;

  @OneToMany(() => TransactionRef, (ref: TransactionRef) => ref.BANK_RECONCILE)
  TRANSACTION_REFS: Relation<TransactionRef>[];
}
