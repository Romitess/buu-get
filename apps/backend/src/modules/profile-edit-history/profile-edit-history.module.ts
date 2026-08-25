import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEditHistory } from './entities/profile-edit-history.entity';
import { ProfileEditHistoryService } from './profile-edit-history.service';
import { ProfileEditHistoryController } from './profile-edit-history.controller';
import { UserProfile } from '../user-profile/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEditHistory, UserProfile])],
  controllers: [ProfileEditHistoryController],
  providers: [ProfileEditHistoryService],
  exports: [ProfileEditHistoryService],
})
export class ProfileEditHistoryModule {}
