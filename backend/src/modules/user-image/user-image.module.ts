import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserImage } from './entities/user-image.entity';
import { UserImageService } from './user-image.service';
import { UserImageController } from './user-image.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserImage])],
  controllers: [UserImageController],
  providers: [UserImageService],
  exports: [TypeOrmModule, UserImageService],
})
export class UserImageModule {}
