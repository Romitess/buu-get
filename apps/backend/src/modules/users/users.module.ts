import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../roles/entities/role.entity';
import { UserProfileModule } from '../user-profile/user-profile.module';
import { MoodleModule } from '../moodle/moodle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    UserProfileModule,
    MoodleModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
