import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { UserProfile } from './entities/user-profile.entity';
import { ProfileEditHistoryModule } from '../profile-edit-history/profile-edit-history.module';
import { MsgPersonsModule } from '../msg-persons/msg-persons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile]),
    ProfileEditHistoryModule,
    MsgPersonsModule,
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
