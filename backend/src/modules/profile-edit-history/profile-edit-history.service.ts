import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEditHistory } from './entities/profile-edit-history.entity';
import { CreateProfileEditHistoryDto } from './dto/create-profile-edit-history.dto';

@Injectable()
export class ProfileEditHistoryService {
  constructor(
    @InjectRepository(ProfileEditHistory)
    private readonly historyRepository: Repository<ProfileEditHistory>,
  ) {}

  async create(dto: CreateProfileEditHistoryDto): Promise<ProfileEditHistory> {
    const history = this.historyRepository.create(dto);
    return await this.historyRepository.save(history);
  }

  async findByUserProfileId(
    userProfileId: number,
  ): Promise<ProfileEditHistory[]> {
    return await this.historyRepository.find({
      where: { userProfileId },
      order: { createdAt: 'DESC' },
    });
  }
}
