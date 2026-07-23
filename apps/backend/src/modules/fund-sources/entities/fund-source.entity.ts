import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('FIN_T_FUND_SOURCES')
export class FundSource {
  @PrimaryGeneratedColumn({ name: 'FS_ID', comment: 'รหัสแหล่งทุน' })
  FS_ID: number;

  @Column({
    name: 'FS_ACCOUNT_CODE',
    type: 'varchar',
    length: 50,
    comment: 'รหัสบัญชี',
  })
  FS_ACCOUNT_CODE: string;

  @Column({
    name: 'FS_NAME',
    type: 'varchar',
    length: 255,
    comment: 'ชื่อแหล่งทุน',
  })
  FS_NAME: string;

  @Column({
    name: 'FS_OPEN_STATUS',
    type: 'boolean',
    default: true,
    comment: 'สถานะการเปิดใช้ 1= เปิดใช้งาน, 0 = ปิดใช้งาน',
  })
  FS_OPEN_STATUS: boolean;

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
}
