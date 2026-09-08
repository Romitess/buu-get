import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('SYS_T_SYSTEM_SETTING_AUDIT_LOGS')
export class SystemSettingAuditLog {
  @PrimaryGeneratedColumn({ name: 'SSA_ID', comment: 'รหัส audit log' })
  SSA_ID: number;

  @Index()
  @Column({
    name: 'SETTING_KEY',
    type: 'varchar',
    length: 100,
    comment: 'คีย์ที่ถูกแก้ไข',
  })
  SETTING_KEY: string;

  @Column({
    name: 'OLD_VALUE',
    type: 'text',
    nullable: true,
    comment: 'ค่าเดิม',
  })
  OLD_VALUE: string | null;

  @Column({
    name: 'NEW_VALUE',
    type: 'text',
    comment: 'ค่าใหม่',
  })
  NEW_VALUE: string;

  @Column({
    name: 'ACTOR_USER_ID',
    type: 'int',
    comment: 'USER_ID ผู้แก้ไข',
  })
  ACTOR_USER_ID: number;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'เวลาที่แก้ไข' })
  CREATED_AT: Date;
}
