import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Log ธนาคาร payment — คอลัมน์/ลำดับตรง dump Lifelong `LLTREQUESTPAYMENT`
 * (lifelong_dev.sql)
 */
@Entity('FIN_T_REQUEST_PAYMENT')
export class RequestPayment {
  @PrimaryGeneratedColumn({ name: 'ID', comment: 'Auto ID' })
  ID: number;

  @Column({
    name: 'TRANXID',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Transaction number from Partner',
  })
  TRANXID: string | null;

  @Column({
    name: 'REF1',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Reference1',
  })
  REF1: string | null;

  @Column({
    name: 'REF2',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Reference2',
  })
  REF2: string | null;

  @Column({
    name: 'USER',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'User for webservice',
  })
  USER: string | null;

  @Column({
    name: 'PASSWORD',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Password for webservice',
  })
  PASSWORD: string | null;

  @Column({
    name: 'COMCODE',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment:
      'Company Code ( KTB ตกลงร่วมกับ Direct Link Partner (1010))',
  })
  COMCODE: string | null;

  @Column({
    name: 'PRODCODE',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment:
      'Product Code (KTB ตกลงร่วมกับ Direct Link Partner (1010))',
  })
  PRODCODE: string | null;

  @Column({
    name: 'COMMAND',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Process Function (Fix=Approval)',
  })
  COMMAND: string | null;

  @Column({
    name: 'BANKCODE',
    type: 'int',
    nullable: true,
    comment: 'Bank Code(6)',
  })
  BANKCODE: number | null;

  @Column({
    name: 'BANKREF',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Reference transaction from bank  (K00002 00004392)',
  })
  BANKREF: string | null;

  @Column({
    name: 'DATETIME',
    type: 'varchar',
    length: 14,
    nullable: true,
    comment:
      'Transaction DateTime  (yyyyMMddHHmmss(ปี ค.ศ. ) 20180601180029)',
  })
  DATETIME: string | null;

  @Column({
    name: 'EFFDATE',
    type: 'varchar',
    length: 8,
    nullable: true,
    comment:
      'Settlement Date for Reconciliation ( yyyyMMdd (ปี ค.ศ.)  20180601)',
  })
  EFFDATE: string | null;

  @Column({
    name: 'AMOUNT',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
    comment: 'Amount (500.00)',
  })
  AMOUNT: string | null;

  @Column({
    name: 'CHANNEL',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Channel of transaction (2)',
  })
  CHANNEL: string | null;

  @Column({
    name: 'CUSNAME',
    type: 'varchar',
    length: 60,
    nullable: true,
    comment: 'Customer Name',
  })
  CUSNAME: string | null;

  @Column({
    name: 'INFO',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'information',
  })
  INFO: string | null;

  @Column({
    name: 'REF3',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Reference3',
  })
  REF3: string | null;

  @Column({
    name: 'REF4',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Reference4',
  })
  REF4: string | null;

  @Column({
    name: 'RESPCODE',
    type: 'int',
    nullable: true,
    comment: 'Response code',
  })
  RESPCODE: number | null;

  @Column({
    name: 'RESPMSG',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Response message',
  })
  RESPMSG: string | null;

  @Column({
    name: 'BALANCE',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
    comment: 'Cash balance from Partner',
  })
  BALANCE: string | null;

  @Column({
    name: 'PRINT1',
    type: 'varchar',
    length: 40,
    nullable: true,
    comment: 'Print 1',
  })
  PRINT1: string | null;

  @Column({
    name: 'REQUEST_DATA',
    type: 'varchar',
    length: 4000,
    nullable: true,
    comment: 'ข้อมูลที่รับหรือตอบกลับ',
  })
  REQUEST_DATA: string | null;

  @CreateDateColumn({
    name: 'CREATEDATE',
    type: 'datetime',
    nullable: true,
    comment: 'วันที่สร้างข้อมูล',
  })
  CREATEDATE: Date | null;

  @Column({
    name: 'SHOW_MSG',
    type: 'varchar',
    length: 1,
    nullable: true,
    comment: 'สถานะการแสดงผล',
  })
  SHOW_MSG: string | null;
}
