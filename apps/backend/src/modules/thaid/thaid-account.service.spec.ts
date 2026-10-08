import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { User } from '../users/entities/user.entity';
import { ThaidAccountService } from './thaid-account.service';
import { ThaidHandoffService } from './thaid-handoff.service';
import { ThaidIdTokenClaims } from './thaid-jwt';

describe('ThaidAccountService', () => {
  const users = {
    findOne: jest.fn(),
  };
  const profiles = {
    save: jest.fn(async (profile: UserProfile) => profile),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('app-jwt'),
  };
  const handoff = {
    createRegisterProof: jest.fn().mockResolvedValue('proof-token'),
  };

  const service = new ThaidAccountService(
    users as unknown as Repository<User>,
    profiles as unknown as Repository<UserProfile>,
    jwtService as unknown as JwtService,
    handoff as unknown as ThaidHandoffService,
  );

  const claims: ThaidIdTokenClaims = {
    pid: '1234567890123',
    name: 'ชื่อใหม่',
    nameEn: 'New Name',
    title: 'นาย',
    titleEn: 'Mr.',
    birthdate: '2001-02-03',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.sign.mockReturnValue('app-jwt');
    handoff.createRegisterProof.mockResolvedValue('proof-token');
  });

  it('logs in an existing national id and fills only empty profile fields', async () => {
    const existingBirth = new Date('1990-05-05T00:00:00.000Z');
    const profile = {
      userTitleTh: 'นาง',
      userTitleEn: null,
      userFullnameTh: null,
      userFullnameEn: 'Kept Name',
      userDateOfBirth: existingBirth,
      userThaidSynced: false,
    } as UserProfile;
    users.findOne.mockResolvedValue({
      USER_ID: 9,
      USER_EMAIL: 'student@example.com',
      ROLES_ID: [{ ROLE_NAME: 'candidate' }],
      PROFILE: profile,
    });

    const result = await service.resolve('login', claims);

    expect(result).toEqual({
      outcome: 'login',
      notice: 'signed_in',
      userId: 9,
      received: {
        nationalId: '1234567890123',
        titleTH: 'นาย',
        titleEN: 'Mr.',
        fullName: 'ชื่อใหม่',
        englishName: 'New Name',
        birthdate: '2001-02-03',
        address: '',
      },
    });
    expect(profile.userTitleTh).toBe('นาง');
    expect(profile.userFullnameEn).toBe('Kept Name');
    expect(profile.userDateOfBirth).toBe(existingBirth);
    expect(profile.userTitleEn).toBe('Mr.');
    expect(profile.userFullnameTh).toBe('ชื่อใหม่');
    expect(profile.userThaidSynced).toBe(true);
    expect(profiles.save).toHaveBeenCalledWith(profile);
    expect(handoff.createRegisterProof).not.toHaveBeenCalled();
  });

  it('returns prefill and does not create a user when the national id is new', async () => {
    users.findOne.mockResolvedValue(null);

    const result = await service.resolve('login', claims);

    expect(result).toEqual({
      outcome: 'prefill',
      notice: 'no_account',
      registrationToken: 'proof-token',
      prefill: {
        nationalId: '1234567890123',
        titleTH: 'นาย',
        titleEN: 'Mr.',
        fullName: 'ชื่อใหม่',
        englishName: 'New Name',
        birthdate: '2001-02-03',
        address: '',
      },
    });
    expect(profiles.save).not.toHaveBeenCalled();
  });

  it('strips the title and prefills the house address as text', async () => {
    users.findOne.mockResolvedValue(null);

    const result = await service.resolve('register', {
      ...claims,
      name: 'นาย ภัทรพล สุดประเสริฐ',
      nameEn: 'Mr. Pattarapon Sudprasert',
      address: '99/12 หมู่ที่ 5 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    });

    expect(result).toMatchObject({
      outcome: 'prefill',
      prefill: {
        titleTH: 'นาย',
        titleEN: 'Mr.',
        fullName: 'ภัทรพล สุดประเสริฐ',
        englishName: 'Pattarapon Sudprasert',
        address: '99/12 หมู่ที่ 5 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
      },
    });
  });

  it('fills a blank address and does not overwrite an existing one', async () => {
    const profile = {
      userTitleTh: 'นาย',
      userTitleEn: 'Mr.',
      userFullnameTh: 'ชื่อเดิม',
      userFullnameEn: 'Kept Name',
      userDateOfBirth: new Date('1990-05-05T00:00:00.000Z'),
      userAddress: null,
      userThaidSynced: false,
    } as UserProfile;
    users.findOne.mockResolvedValue({
      USER_ID: 9,
      USER_EMAIL: 'student@example.com',
      ROLES_ID: [{ ROLE_NAME: 'candidate' }],
      PROFILE: profile,
    });

    await service.resolve('login', {
      ...claims,
      address:
        '10 หมู่ที่ 2 ถนนมิตรภาพ ตำบลแสนสุข อำเภอเมืองชลบุรี จังหวัดชลบุรี',
    });

    expect(profile.userFullnameTh).toBe('ชื่อเดิม');
    expect(profile.userAddress).toBe(
      '10 หมู่ที่ 2 ถนนมิตรภาพ ตำบลแสนสุข อำเภอเมืองชลบุรี จังหวัดชลบุรี',
    );
  });

  it('overwrites identity fields when the scanned pid matches the registered account', async () => {
    const profile = {
      userRegisteredViaThaid: true,
      userTitleTh: 'นาง',
      userTitleEn: 'Mrs.',
      userFullnameTh: 'ชื่อเดิม',
      userFullnameEn: 'Old Name',
      userDateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
      userAddress: 'ที่อยู่เดิม',
      userPhone: '0811111111',
      userEducation: 'ปริญญาตรี',
      userThaidSynced: false,
    } as UserProfile;
    users.findOne.mockResolvedValue({
      USER_ID: 9,
      USER_NATIONAL_ID: '1234567890123',
      USER_EMAIL: 'student@example.com',
      PROFILE: profile,
    });

    await expect(
      service.applyRegisteredProfileUpdate(9, {
        ...claims,
        address: '99/12 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
      }),
    ).resolves.toBe('updated');

    expect(profile.userTitleTh).toBe('นาย');
    expect(profile.userFullnameTh).toBe('ชื่อใหม่');
    expect(profile.userFullnameEn).toBe('New Name');
    expect(profile.userAddress).toBe(
      '99/12 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    );
    expect(profile.userPhone).toBe('0811111111');
    expect(profile.userEducation).toBe('ปริญญาตรี');
    expect(profiles.save).toHaveBeenCalledWith(profile);
  });

  it('keeps the profile when the scanned pid belongs to another card', async () => {
    const profile = {
      userRegisteredViaThaid: true,
      userFullnameTh: 'ชื่อเดิม',
    } as UserProfile;
    users.findOne.mockResolvedValue({
      USER_ID: 9,
      USER_NATIONAL_ID: '9999999999999',
      PROFILE: profile,
    });

    await expect(
      service.applyRegisteredProfileUpdate(9, claims),
    ).resolves.toBe('mismatch');
    expect(profile.userFullnameTh).toBe('ชื่อเดิม');
    expect(profiles.save).not.toHaveBeenCalled();
  });

  it('issues the same login shape as email login', async () => {
    users.findOne.mockResolvedValue({
      USER_ID: 9,
      USER_EMAIL: 'student@example.com',
      ROLES_ID: [{ ROLE_NAME: 'candidate' }],
      PROFILE: { userRemark: null },
    });

    await expect(service.issueLoginForUser(9)).resolves.toEqual({
      accessToken: 'app-jwt',
      user: {
        id: 9,
        actorType: 'user',
        email: 'student@example.com',
        role: 'candidate',
        roles: ['candidate'],
        remark: null,
      },
    });
  });
});
