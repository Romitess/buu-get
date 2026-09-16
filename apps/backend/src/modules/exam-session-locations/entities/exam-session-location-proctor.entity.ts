import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MsgPerson } from '../../msg-persons/entities/msg-person.entity';
import { ExamSessionLocation } from './exam-session-location.entity';

@Entity('EXAM_T_SESSION_LOCATION_PROCTORS')
@Unique('UQ_SLP_SL_PSN', ['SL_ID', 'PSN_ID'])
export class ExamSessionLocationProctor {
  @PrimaryGeneratedColumn({
    name: 'SLP_ID',
    comment: 'รหัสการมอบหมายผู้คุมสอบประจำห้อง',
  })
  SLP_ID: number;

  @Column({ name: 'SL_ID', comment: 'รหัส Session-Location (FK)' })
  SL_ID: number;

  @Column({
    name: 'PSN_ID',
    type: 'varchar',
    length: 10,
    comment: 'รหัสบุคลากรผู้คุมสอบ (FK)',
  })
  PSN_ID: string;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @ManyToOne(
    () => ExamSessionLocation,
    (sessionLocation) => sessionLocation.PROCTORS,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'SL_ID' })
  SESSION_LOCATION: ExamSessionLocation;

  @ManyToOne(() => MsgPerson, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'PSN_ID' })
  PERSON: MsgPerson;
}
