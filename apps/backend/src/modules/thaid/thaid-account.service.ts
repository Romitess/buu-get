import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LoginResponse } from '../auth/auth.service';
import { RoleEnum } from '../roles/enums/role.enum';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { User } from '../users/entities/user.entity';
import { ThaidIntent } from './entities/thaid-auth-state.entity';
import {
  ThaidHandoffService,
  ThaidPrefillPayload,
  ThaidSessionTicketPayload,
} from './thaid-handoff.service';
import { parseThaidBirthdate, ThaidIdTokenClaims } from './thaid-jwt';
import { mapThaidProfile } from './thaid-profile-map';

@Injectable()
export class ThaidAccountService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    private readonly jwtService: JwtService,
    private readonly handoff: ThaidHandoffService,
  ) {}

  async resolve(
    intent: ThaidIntent,
    claims: ThaidIdTokenClaims,
  ): Promise<ThaidSessionTicketPayload> {
    const user = await this.users.findOne({
      where: { USER_NATIONAL_ID: claims.pid },
      relations: { ROLES_ID: true, PROFILE: true },
      withDeleted: true,
    });

    const received = toReceivedProfile(claims);
    if (user) {
      if (user.DELETED_AT) {
        await this.users.recover(user);
      }
      if (user.PROFILE?.deletedAt) {
        await this.profiles.recover(user.PROFILE);
      }
      if (user.PROFILE) {
        this.fillEmptyProfile(user.PROFILE, claims);
        await this.profiles.save(user.PROFILE);
      }
      return {
        outcome: 'login',
        notice: intent === 'register' ? 'existing_account' : 'signed_in',
        userId: user.USER_ID,
        received,
      };
    }

    const registrationToken = await this.handoff.createRegisterProof({
      pid: claims.pid,
      titleTH: received.titleTH,
      titleEN: received.titleEN,
      fullName: received.fullName,
      englishName: received.englishName,
      birthdate: received.birthdate,
      address: received.address,
    });
    return {
      outcome: 'prefill',
      notice: intent === 'login' ? 'no_account' : 'continue_register',
      registrationToken,
      prefill: received,
    };
  }

  async issueLoginForUser(userId: number): Promise<LoginResponse> {
    const user = await this.users.findOne({
      where: { USER_ID: userId },
      relations: { ROLES_ID: true, PROFILE: true },
    });
    if (!user) {
      throw new NotFoundException('ไม่พบบัญชีจากผลการยืนยัน ThaID');
    }
    return this.toLoginResponse(user);
  }

  async assertRegisteredViaThaid(userId: number): Promise<void> {
    const user = await this.users.findOne({
      where: { USER_ID: userId },
      relations: { PROFILE: true },
    });
    if (!user?.PROFILE?.userRegisteredViaThaid) {
      throw new BadRequestException('บัญชีนี้ไม่ได้สมัครผ่าน ThaiD');
    }
  }

  /**
   * เขียนทับช่องตัวตนและที่อยู่ของบัญชีที่สมัครจาก ThaiD
   * เมื่อเลขบัตรตรงกับบัญชีนั้น ไม่แตะโทร การศึกษา รูป หรืออีเมล
   */
  async applyRegisteredProfileUpdate(
    userId: number,
    claims: ThaidIdTokenClaims,
  ): Promise<'updated' | 'mismatch'> {
    const user = await this.users.findOne({
      where: { USER_ID: userId },
      relations: { PROFILE: true },
    });
    const profile = user?.PROFILE;
    if (
      !user ||
      !profile?.userRegisteredViaThaid ||
      !user.USER_NATIONAL_ID ||
      user.USER_NATIONAL_ID !== claims.pid
    ) {
      return 'mismatch';
    }

    const mapped = mapThaidProfile(claims);
    assignIfPresent(mapped.titleTH, (value) => {
      profile.userTitleTh = value;
    });
    assignIfPresent(mapped.titleEN, (value) => {
      profile.userTitleEn = value;
    });
    assignIfPresent(mapped.fullName, (value) => {
      profile.userFullnameTh = value;
    });
    assignIfPresent(mapped.englishName, (value) => {
      profile.userFullnameEn = value;
    });
    const birthdate = parseThaidBirthdate(mapped.birthdate);
    if (birthdate) {
      profile.userDateOfBirth = birthdate;
    }
    assignIfPresent(mapped.address, (value) => {
      profile.userAddress = value;
    });
    profile.userThaidSynced = true;
    await this.profiles.save(profile);
    return 'updated';
  }

  receivedProfile(claims: ThaidIdTokenClaims): ThaidPrefillPayload {
    return toReceivedProfile(claims);
  }

  async linkToUser(userId: number, pid: string): Promise<void> {
    const user = await this.users.findOne({
      where: { USER_ID: userId },
      relations: { PROFILE: true },
    });
    if (!user || user.USER_NATIONAL_ID !== pid || !user.PROFILE) {
      throw new NotFoundException('ไม่พบบัญชีที่ตรงกับเลขบัตรจาก ThaID');
    }
    user.PROFILE.userThaidSynced = true;
    await this.profiles.save(user.PROFILE);
  }

  /** เติมเฉพาะช่องว่าง และตั้ง userThaidSynced โดยไม่เขียนทับค่าที่มีอยู่ */
  fillEmptyProfile(profile: UserProfile, claims: ThaidIdTokenClaims): void {
    const mapped = mapThaidProfile(claims);
    if (isBlank(profile.userTitleTh) && mapped.titleTH) {
      profile.userTitleTh = mapped.titleTH;
    }
    if (isBlank(profile.userTitleEn) && mapped.titleEN) {
      profile.userTitleEn = mapped.titleEN;
    }
    if (isBlank(profile.userFullnameTh) && mapped.fullName) {
      profile.userFullnameTh = mapped.fullName;
    }
    if (isBlank(profile.userFullnameEn) && mapped.englishName) {
      profile.userFullnameEn = mapped.englishName;
    }
    if (profile.userDateOfBirth == null) {
      const birthdate = parseThaidBirthdate(mapped.birthdate);
      if (birthdate) {
        profile.userDateOfBirth = birthdate;
      }
    }
    if (isBlank(profile.userAddress) && mapped.address) {
      profile.userAddress = mapped.address;
    }
    profile.userThaidSynced = true;
  }

  private toLoginResponse(user: User): LoginResponse {
    const roles =
      user.ROLES_ID?.map((role) => role.ROLE_NAME).filter(Boolean) ?? [];
    if (roles.length === 0) {
      roles.push(RoleEnum.CANDIDATE);
    }
    const role = roles[0];
    return {
      accessToken: this.jwtService.sign({
        sub: user.USER_ID,
        email: user.USER_EMAIL,
        role,
        roles,
      }),
      user: {
        id: user.USER_ID,
        actorType: 'user',
        email: user.USER_EMAIL,
        role,
        roles,
        remark: user.PROFILE?.userRemark ?? null,
      },
    };
  }
}

function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

function assignIfPresent(value: string, assign: (value: string) => void): void {
  if (!isBlank(value)) {
    assign(value);
  }
}

function toReceivedProfile(claims: ThaidIdTokenClaims) {
  const mapped = mapThaidProfile(claims);
  return {
    nationalId: claims.pid,
    titleTH: mapped.titleTH,
    titleEN: mapped.titleEN,
    fullName: mapped.fullName,
    englishName: mapped.englishName,
    birthdate: mapped.birthdate,
    address: mapped.address,
  };
}
