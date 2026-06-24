import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  /**
   * คืน "รูปโปรไฟล์ล่าสุดจากประวัติการแก้ไข" ของหลาย profileId ใน query เดียว
   * (แทนการยิงทีละ profileId แบบ N+1 จากหน้า จัดการที่นั่งสอบ)
   *
   * @returns map: userProfileId -> imagePath ล่าสุด (null ถ้าไม่มีในประวัติ)
   */
  async findLatestImagesByProfileIds(
    profileIds: number[],
  ): Promise<Record<number, string | null>> {
    const result: Record<number, string | null> = {};
    if (!profileIds.length) return result;

    const uniqueIds = [...new Set(profileIds)];
    const rows = await this.historyRepository.find({
      where: { userProfileId: In(uniqueIds) },
      order: { createdAt: 'DESC' },
      select: {
        profileEditHistoryId: true,
        userProfileId: true,
        newValues: true,
        createdAt: true,
      },
    });

    // rows เรียงใหม่ -> เก่า; เก็บค่าแรก (ล่าสุด) ที่มี userImagePath ของแต่ละ profile
    for (const row of rows) {
      if (result[row.userProfileId] !== undefined) continue;
      const imagePath = this.extractImagePath(row.newValues);
      if (imagePath) {
        result[row.userProfileId] = imagePath;
      }
    }

    // เติม null ให้ profile ที่ไม่พบรูปในประวัติ เพื่อให้ผู้เรียกแยก "ไม่มี" ได้ชัด
    for (const id of uniqueIds) {
      if (result[id] === undefined) result[id] = null;
    }

    return result;
  }

  private extractImagePath(newValues: string | null): string | null {
    if (!newValues) return null;
    try {
      const parsed = JSON.parse(newValues) as Record<string, unknown>;
      const imagePath = parsed.userImagePath;
      return typeof imagePath === 'string' && imagePath.trim()
        ? imagePath
        : null;
    } catch {
      return null;
    }
  }
}
