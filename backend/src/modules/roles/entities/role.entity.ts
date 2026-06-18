import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'BUU_GET_T_ROLE' })
export class Role {
  @PrimaryGeneratedColumn({ name: 'ROLE_ID' })
  ROLE_ID: number;

  @Column({ name: 'ROLE_NAME', comment: 'ชื่อบทบาท' })
  ROLE_NAME: string;

  @Column({ name: 'ROLE_DESCRIPTION', comment: 'คำอธิบายบทบาท' })
  ROLE_DESCRIPTION: string;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  UPDATED_AT: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  DELETED_AT: Date | null;

  @ManyToMany(() => User, (user) => user.ROLES_ID)
  USER_ID: User[];
}
