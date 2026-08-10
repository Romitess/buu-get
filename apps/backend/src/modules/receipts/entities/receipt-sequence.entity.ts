import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('FIN_T_RECEIPT_SEQUENCES')
export class ReceiptSequence {
  @PrimaryGeneratedColumn({ name: 'RSEQ_ID' })
  RSEQ_ID: number;

  @Column({
    name: 'RSEQ_FISCAL_YEAR_BE',
    type: 'varchar',
    length: 4,
    unique: true,
    comment: 'ปีงบประมาณ พ.ศ. (4 หลัก)',
  })
  RSEQ_FISCAL_YEAR_BE: string;

  @Column({
    name: 'RSEQ_LAST_NO',
    type: 'int',
    default: 0,
    comment: 'เลขลำดับล่าสุดที่ออกในปีนั้น',
  })
  RSEQ_LAST_NO: number;

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
}
