import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditLogStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL = 'PARTIAL',
}

@Entity('SYS_T_AUDIT_LOGS')
@Index('IDX_AL_ACTOR_CREATED', ['AL_ACTOR_USER_ID', 'CREATED_AT'])
@Index('IDX_AL_ACTION_CREATED', ['AL_ACTION', 'CREATED_AT'])
@Index('IDX_AL_RESOURCE', ['AL_RESOURCE_TYPE', 'AL_RESOURCE_ID'])
@Index('IDX_AL_CREATED', ['CREATED_AT'])
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'AL_ID', comment: 'รหัส audit log' })
  AL_ID: number;

  @Column({
    name: 'AL_ACTOR_USER_ID',
    type: 'int',
    nullable: true,
    comment: 'USER_ID ผู้กระทำ (null = ระบบ / ยังไม่ล็อกอิน)',
  })
  AL_ACTOR_USER_ID: number | null;

  @Column({
    name: 'AL_ACTOR_SNAPSHOT',
    type: 'text',
    nullable: true,
    comment: 'snapshot ผู้กระทำตอนบันทึก (userId/email/roles)',
  })
  AL_ACTOR_SNAPSHOT: string | null;

  @Column({
    name: 'AL_ACTION',
    type: 'varchar',
    length: 64,
    comment: 'รหัสเหตุการณ์ตาม taxonomy เช่น AUTH.LOGIN',
  })
  AL_ACTION: string;

  @Column({
    name: 'AL_MODULE',
    type: 'varchar',
    length: 32,
    comment: 'โมดูลที่ emit (เช่น buu-get)',
  })
  AL_MODULE: string;

  @Column({
    name: 'AL_RESOURCE_TYPE',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'ชนิดทรัพยากรที่ถูกกระทำ',
  })
  AL_RESOURCE_TYPE: string | null;

  @Column({
    name: 'AL_RESOURCE_ID',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'รหัสทรัพยากร (polymorphic)',
  })
  AL_RESOURCE_ID: string | null;

  @Column({
    name: 'AL_STATUS',
    type: 'varchar',
    length: 16,
    comment: 'SUCCESS / FAILURE / PARTIAL',
  })
  AL_STATUS: AuditLogStatus;

  @Column({
    name: 'AL_STATUS_DETAIL',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'ข้อความสถานะ/เหตุผล failure (ไม่เก็บ stack trace)',
  })
  AL_STATUS_DETAIL: string | null;

  @Column({
    name: 'AL_BEFORE_STATE',
    type: 'text',
    nullable: true,
    comment: 'JSON snapshot ก่อนเปลี่ยน (allowlist)',
  })
  AL_BEFORE_STATE: string | null;

  @Column({
    name: 'AL_AFTER_STATE',
    type: 'text',
    nullable: true,
    comment: 'JSON snapshot หลังเปลี่ยน (allowlist)',
  })
  AL_AFTER_STATE: string | null;

  @Column({
    name: 'AL_IP_ADDRESS',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP ผู้เรียก',
  })
  AL_IP_ADDRESS: string | null;

  @Column({
    name: 'AL_USER_AGENT',
    type: 'varchar',
    length: 512,
    nullable: true,
    comment: 'User-Agent',
  })
  AL_USER_AGENT: string | null;

  @Column({
    name: 'AL_CORRELATION_ID',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: 'ผูกหนึ่ง logical action ข้าม request',
  })
  AL_CORRELATION_ID: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'เวลาที่เกิดเหตุการณ์' })
  CREATED_AT: Date;
}
