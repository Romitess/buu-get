import { Role } from 'src/modules/roles/entities/role.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity('MSG_T_PERSON', { comment: 'ข้อมูลบุคลากร (เจ้าหน้าที่)' })
export class MsgPerson {
  @PrimaryColumn({
    name: 'PSN_ID',
    type: 'varchar',
    length: 10,
    comment: 'รหัสบุคลากร',
  })
  PSN_ID: string;

  @Column({
    name: 'PRF_NAMETH',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ชื่อคำนำหน้า (ไทย)',
  })
  PRF_NAMETH: string | null;

  @Column({
    name: 'PRF_NAMEEN',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ชื่อคำนำหน้า (อังกฤษ)',
  })
  PRF_NAMEEN: string | null;

  @Column({
    name: 'PSN_FNAMETH',
    type: 'varchar',
    length: 60,
    nullable: true,
    comment: 'ชื่อ (ไทย)',
  })
  PSN_FNAMETH: string | null;

  @Column({
    name: 'PSN_FNAMEEN',
    type: 'varchar',
    length: 60,
    nullable: true,
    comment: 'ชื่อ (อังกฤษ)',
  })
  PSN_FNAMEEN: string | null;

  @Column({
    name: 'PSN_LNAMETH',
    type: 'varchar',
    length: 60,
    nullable: true,
    comment: 'นามสกุล (ไทย)',
  })
  PSN_LNAMETH: string | null;

  @Column({
    name: 'PSN_LNAMEEN',
    type: 'varchar',
    length: 60,
    nullable: true,
    comment: 'นามสกุล (อังกฤษ)',
  })
  PSN_LNAMEEN: string | null;

  @Column({
    name: 'PSN_EMAIL_BUU',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'อีเมลของมหาวิทยาลัย',
  })
  PSN_EMAIL_BUU: string | null;

  @Column({
    name: 'PSN_RETIRE',
    type: 'varchar',
    length: 1,
    nullable: true,
    comment: 'สถานะการทำงาน; N=ทำงาน , Y=ลาออก',
  })
  PSN_RETIRE: 'N' | 'Y' | null;

  @Column({
    name: 'PSN_TECHNIQUE',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'ตำแหน่งทางวิชาการ/สายงาน',
  })
  PSN_TECHNIQUE: string | null;

  @Column({
    name: 'PSN_USERNAME',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'ชื่อผู้ใช้',
  })
  PSN_USERNAME: string | null;

  /** บทบาทเจ้าหน้าที่ (แหล่งสิทธิ์ตามโมเดลใหม่ — ยังไม่ใช้ login ในเฟสนี้) */
  @ManyToMany(() => Role, (role) => role.PERSONS)
  @JoinTable({
    name: 'PERSON_ROLES',
    joinColumn: {
      name: 'PSN_ID',
      referencedColumnName: 'PSN_ID',
    },
    inverseJoinColumn: {
      name: 'ROLE_ID',
      referencedColumnName: 'ROLE_ID',
    },
  })
  ROLES: Role[];
}
