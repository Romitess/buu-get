import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BankReconcile } from './bank-reconcile.entity';

export interface BankReconcileEditSnapshot {
  BR_REF1: string;
  BR_REF2: string | null;
  TRANX_ID: number | null;
  TRANX_MATCH_STATUS: number | null;
}

export type BankReconcileChangedField = keyof BankReconcileEditSnapshot;

@Entity('FIN_T_BANK_RECONCILE_EDIT_LOGS')
export class BankReconcileEditLog {
  @PrimaryGeneratedColumn({
    name: 'BREL_ID',
    comment: 'รหัสประวัติการแก้ไขรายการกระทบยอดธนาคาร',
  })
  BREL_ID: number;

  @Column({ name: 'BR_ID', comment: 'รหัส Bank Reconcile (Foreign Key)' })
  BR_ID: number;

  @Column({ name: 'CHANGED_BY', comment: 'รหัสผู้แก้ไข (Foreign Key)' })
  CHANGED_BY: number;

  @Column({
    name: 'OLD_SNAPSHOT',
    type: 'json',
    comment: 'ข้อมูลก่อนแก้ไข',
  })
  OLD_SNAPSHOT: BankReconcileEditSnapshot;

  @Column({
    name: 'NEW_SNAPSHOT',
    type: 'json',
    comment: 'ข้อมูลหลังแก้ไข',
  })
  NEW_SNAPSHOT: BankReconcileEditSnapshot;

  @Column({
    name: 'CHANGED_FIELDS',
    type: 'json',
    comment: 'รายชื่อ field ที่เปลี่ยนแปลง',
  })
  CHANGED_FIELDS: BankReconcileChangedField[];

  @Column({
    name: 'CHANGE_REASON',
    type: 'text',
    nullable: true,
    comment: 'เหตุผลการแก้ไข',
  })
  CHANGE_REASON: string | null;

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

  @ManyToOne(() => BankReconcile)
  @JoinColumn({ name: 'BR_ID' })
  BANK_RECONCILE: Relation<BankReconcile>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'CHANGED_BY' })
  USER: Relation<User>;
}
