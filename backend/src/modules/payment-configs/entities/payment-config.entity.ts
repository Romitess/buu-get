import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('FIN_T_PAYMENT_CONFIG')
export class PaymentConfig {
  @PrimaryGeneratedColumn({ name: 'PC_ID', comment: 'รหัส config นี้' })
  PC_ID: number;

  @Column({
    name: 'PROVIDER_NAME',
    type: 'varchar',
    length: 100,
    comment: 'ชื่อผู้ให้บริการ',
  })
  PROVIDER_NAME: string;

  @Column({
    name: 'PC_COMP_CODE',
    type: 'varchar',
    length: 20,
    comment: 'รหัสบริษัทที่ตกลงกับธนาคารไว้',
  })
  PC_COMP_CODE: string;

  @Column({
    name: 'PC_PROD_CODE',
    type: 'varchar',
    length: 20,
    comment: 'รหัสสินค้า/บริการที่ตกลงกับธนาคารไว้ ',
  })
  PC_PROD_CODE: string;

  @Column({
    name: 'PC_IS_ACTIVE',
    type: 'boolean',
    default: true,
    comment: 'เปิด/ปิด config',
  })
  PC_IS_ACTIVE: boolean;

  @Column({
    name: 'PC_EFFECTIVE_FROM',
    type: 'timestamp',
    comment: 'วันที่เริ่มใช้ config นี้',
  })
  PC_EFFECTIVE_FROM: Date;

  @Column({
    name: 'PC_EFFECTIVE_TO',
    type: 'timestamp',
    nullable: true,
    comment: 'วันที่หมดอายุ ',
  })
  PC_EFFECTIVE_TO: Date | null;

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

  @OneToMany(
    () => Transaction,
    (transaction: Transaction) => transaction.PAYMENT_CONFIG,
  )
  TRANSACTIONS: Relation<Transaction>[];
}
