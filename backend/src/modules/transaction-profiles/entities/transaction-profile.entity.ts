import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('FIN_T_TRANSACTION_PROFILE')
export class TransactionProfile {
  @ApiProperty({ description: 'รหัสโปรไฟล์ธุรกรรม' })
  @PrimaryGeneratedColumn({ name: 'TP_ID', comment: 'รหัสโปรไฟล์ธุรกรรม' })
  TP_ID: number;

  @ApiProperty({ description: 'รหัสธุรกรรม (Foreign Key)' })
  @Column({ name: 'TRANX_ID', comment: 'รหัสธุรกรรม (Foreign Key)' })
  TRANX_ID: number;

  @ApiProperty({ description: 'ชื่อผู้เสียภาษี/ชื่อในใบเสร็จ' })
  @Column({
    name: 'TP_NAME',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อผู้เสียภาษี/ชื่อในใบเสร็จ',
  })
  TP_NAME: string;

  @ApiProperty({ description: 'ที่อยู่ออกใบเสร็จ' })
  @Column({
    name: 'TP_ADDRESS',
    type: 'text',
    comment: 'ที่อยู่ออกใบเสร็จ',
  })
  TP_ADDRESS: string;

  @ApiProperty({ description: 'เลขประจำตัวผู้เสียภาษี' })
  @Column({
    name: 'TP_TAX_ID',
    type: 'bigint', // Using bigint since Tax ID can be large, or varchar as per user's preference for INT in ERD
    comment: 'เลขประจำตัวผู้เสียภาษี',
  })
  TP_TAX_ID: number;

  @ApiProperty({ description: 'เบอร์โทรศัพท์' })
  @Column({
    name: 'TP_PHONE',
    type: 'varchar',
    length: 15,
    comment: 'เบอร์โทรศัพท์',
  })
  TP_PHONE: string;

  @ApiProperty({ description: 'วันที่สร้าง' })
  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @ApiProperty({ description: 'วันที่แก้ไขล่าสุด' })
  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขล่าสุด' })
  UPDATED_AT: Date;

  @ApiProperty({ description: 'วันที่ลบ (Soft Delete)' })
  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบ (Soft Delete)',
  })
  DELETED_AT: Date | null;

  @OneToOne(() => Transaction, (transaction) => transaction.PROFILE)
  @JoinColumn({ name: 'TRANX_ID' })
  TRANSACTION: Transaction;
}
