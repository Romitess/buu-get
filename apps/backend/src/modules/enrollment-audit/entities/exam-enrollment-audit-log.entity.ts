import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EnrollmentAuditEventType {
  ENROLLMENT_CREATED = 'ENROLLMENT_CREATED',
  PAYMENT_PENDING_CREATED = 'PAYMENT_PENDING_CREATED',
  ENROLLMENT_STATUS_CHANGED = 'ENROLLMENT_STATUS_CHANGED',
  ENROLLMENT_CANCELLED = 'ENROLLMENT_CANCELLED',
}

export enum EnrollmentAuditCategory {
  ENROLLMENT = 'enrollment',
  PAYMENT = 'payment',
  SYSTEM = 'system',
}

export enum EnrollmentAuditActorType {
  CANDIDATE = 'candidate',
  SYSTEM = 'system',
  CRON = 'cron',
}

@Entity('EXAM_T_ENROLLMENT_AUDIT_LOGS')
@Index('IDX_EAL_ERM_CREATED', ['ERM_ID', 'CREATED_AT'])
@Index('IDX_EAL_USER_CREATED', ['USER_ID', 'CREATED_AT'])
@Index('IDX_EAL_EXAM_CREATED', ['EXAM_ID', 'CREATED_AT'])
export class ExamEnrollmentAuditLog {
  @PrimaryGeneratedColumn({ name: 'EAL_ID', comment: 'รหัส audit log' })
  EAL_ID: number;

  @Column({ name: 'ERM_ID', type: 'int', comment: 'รหัสผู้สมัคร (FK)' })
  ERM_ID: number;

  @Column({
    name: 'USER_ID',
    type: 'int',
    comment: 'รหัสผู้ใช้ (denormalized)',
  })
  USER_ID: number;

  @Column({
    name: 'EXAM_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสการสอบ (denormalized)',
  })
  EXAM_ID: number | null;

  @Column({
    name: 'SESSION_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสรอบสอบ (denormalized)',
  })
  SESSION_ID: number | null;

  @Column({
    name: 'EAL_EVENT_TYPE',
    type: 'varchar',
    length: 64,
    comment: 'ประเภทเหตุการณ์',
  })
  EAL_EVENT_TYPE: string;

  @Column({
    name: 'EAL_CATEGORY',
    type: 'varchar',
    length: 32,
    comment: 'หมวดเหตุการณ์ (enrollment/payment/system)',
  })
  EAL_CATEGORY: string;

  @Column({
    name: 'EAL_FROM_STATUS',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: 'สถานะก่อนเปลี่ยน',
  })
  EAL_FROM_STATUS: string | null;

  @Column({
    name: 'EAL_TO_STATUS',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: 'สถานะหลังเปลี่ยน',
  })
  EAL_TO_STATUS: string | null;

  @Column({
    name: 'EAL_ACTOR_TYPE',
    type: 'varchar',
    length: 32,
    comment: 'ประเภทผู้กระทำ (candidate/system/cron)',
  })
  EAL_ACTOR_TYPE: string;

  @Column({
    name: 'EAL_ACTOR_USER_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสผู้ใช้ที่กระทำ',
  })
  EAL_ACTOR_USER_ID: number | null;

  @Column({
    name: 'EAL_ACTOR_NAME',
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'ชื่อผู้กระทำ (snapshot)',
  })
  EAL_ACTOR_NAME: string | null;

  @Column({
    name: 'EAL_MESSAGE',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'ข้อความสรุปเหตุการณ์',
  })
  EAL_MESSAGE: string | null;

  @Column({
    name: 'EAL_PAYLOAD',
    type: 'text',
    nullable: true,
    comment: 'รายละเอียดเพิ่มเติม (JSON)',
  })
  EAL_PAYLOAD: string | null;

  @Column({
    name: 'EAL_REF_TYPE',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: 'ประเภทอ้างอิง (เช่น TRANX)',
  })
  EAL_REF_TYPE: string | null;

  @Column({
    name: 'EAL_REF_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสอ้างอิง',
  })
  EAL_REF_ID: number | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'เวลาที่เกิดเหตุการณ์' })
  CREATED_AT: Date;
}
