import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsgPerson } from './entities/msg-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MsgPerson])],
})
export class MsgPersonsModule {}
