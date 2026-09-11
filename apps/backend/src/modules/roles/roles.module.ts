import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { User } from '../users/entities/user.entity';
import { MsgPerson } from '../msg-persons/entities/msg-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, MsgPerson])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
