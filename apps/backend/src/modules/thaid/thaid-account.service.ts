import { Injectable, NotFoundException } from '@nestjs/common';
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
  ThaidSessionTicketPayload,
} from './thaid-handoff.service';
import { parseThaidBirthdate, ThaidIdTokenClaims } from './thaid-jwt';

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
    });

    if (user) {
      if (user.PROFILE) {
        this.fillEmptyProfile(user.PROFILE, claims);
        await this.profiles.save(user.PROFILE);
      }
      return {
        outcome: 'login',
        notice: intent === 'register' ? 'existing_account' : 'signed_in',
        userId: user.USER_ID,
      };
    }

    const registrationToken = await this.handoff.createRegisterProof(
      claims.pid,
    );
    return {
      outcome: 'prefill',
      notice: intent === 'login' ? 'no_account' : 'continue_register',
      registrationToken,
      prefill: {
        nationalId: claims.pid,
        titleTH: claims.title ?? '',
        titleEN: claims.titleEn ?? '',
        fullName: claims.name ?? '',
        englishName: claims.nameEn ?? '',
        birthdate: claims.birthdate ?? '',
      },
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
    if (isBlank(profile.userTitleTh) && claims.title) {
      profile.userTitleTh = claims.title;
    }
    if (isBlank(profile.userTitleEn) && claims.titleEn) {
      profile.userTitleEn = claims.titleEn;
    }
    if (isBlank(profile.userFullnameTh) && claims.name) {
      profile.userFullnameTh = claims.name;
    }
    if (isBlank(profile.userFullnameEn) && claims.nameEn) {
      profile.userFullnameEn = claims.nameEn;
    }
    if (profile.userDateOfBirth == null) {
      const birthdate = parseThaidBirthdate(claims.birthdate);
      if (birthdate) {
        profile.userDateOfBirth = birthdate;
      }
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
