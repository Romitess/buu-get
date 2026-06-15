import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserImage } from './entities/user-image.entity';

@Injectable()
export class UserImageService {
  constructor(
    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,
  ) {}

  /**
   * ดึงข้อมูล UserImage จาก userId
   */
  async findByUserId(userId: number): Promise<UserImage | null> {
    return this.userImageRepository.findOne({ where: { USER_ID: userId } });
  }

  /**
   * Upsert: สร้างหรืออัปเดต UserImage สำหรับ userId ที่ระบุ
   */
  async upsertByUserId(userId: number, imageUrl: string): Promise<UserImage> {
    let userImage = await this.userImageRepository.findOne({
      where: { USER_ID: userId },
    });

    if (userImage) {
      userImage.USER_IMAGE_URL = imageUrl;
    } else {
      userImage = this.userImageRepository.create({
        USER_ID: userId,
        USER_IMAGE_URL: imageUrl,
      });
    }

    return this.userImageRepository.save(userImage);
  }
}
