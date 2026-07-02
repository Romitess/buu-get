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
} from 'typeorm';
import { Receipt } from '../../receipts/entities/receipt.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('FIN_T_VOIDED_RECEIPTS')
export class VoidedReceipt {
  @ApiProperty({ description: 'รหัสการยกเลิกใบเสร็จ' })
  @PrimaryGeneratedColumn({ name: 'VR_ID', comment: 'รหัสการยกเลิกใบเสร็จ' })
  VR_ID: number;

  @ApiProperty({ description: 'รหัสใบเสร็จ (Foreign Key)' })
  @Column({ name: 'RC_ID', unique: true, comment: 'รหัสใบเสร็จ (Foreign Key)' })
  RC_ID: number;

  @ApiProperty({ description: 'รหัสผู้ยกเลิก (Foreign Key)' })
  @Column({ name: 'VR_BY', comment: 'รหัสผู้ยกเลิก (Foreign Key)' })
  VR_BY: number;

  @ApiProperty({ description: 'เหตุผลการยกเลิก' })
  @Column({
    name: 'VR_REASON',
    type: 'text',
    comment: 'เหตุผลการยกเลิก',
  })
  VR_REASON: string;

  @ApiProperty({ description: 'วันที่ยกเลิก' })
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

  @OneToOne(() => Receipt, (receipt) => receipt.VOIDED_RECEIPT)
  @JoinColumn({ name: 'RC_ID' })
  RECEIPT: Receipt;

  @ManyToOne(() => User, (user) => user.VOIDED_RECEIPTS)
  @JoinColumn({ name: 'VR_BY' })
  USER: User;
}
