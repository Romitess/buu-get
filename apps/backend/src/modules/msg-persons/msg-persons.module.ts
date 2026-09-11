import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/entities/role.entity';
import { MsgPerson } from './entities/msg-person.entity';
import { MsgPersonsController } from './msg-persons.controller';
import { MsgPersonsService } from './msg-persons.service';

@Module({
  imports: [TypeOrmModule.forFeature([MsgPerson, Role])],
  controllers: [MsgPersonsController],
  providers: [MsgPersonsService],
  exports: [MsgPersonsService],
})
export class MsgPersonsModule {}
