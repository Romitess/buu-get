import { BadRequestException, ConflictException } from '@nestjs/common';
import { CandidateAccountService } from './candidate-account.service';
import type { UpdateCandidateAccountDto } from './dto/update-candidate-account.dto';
import type { User } from './entities/user.entity';
import type { MoodleSyncService } from '../moodle/moodle-sync.service';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    USER_ID: 7,
    USER_CODE: '69000001',
    USER_EMAIL: 'student@buu.ac.th',
    USER_NATIONAL_ID: '1103700123451',
    USER_PASSPORT_NO: null,
    USER_MOODLE_ID: 55,
    USER_STATUS: 'ACTIVE',
    PROFILE: {
      userProfileId: 3,
      userId: 7,
      userTitleTh: 'นาย',
      userFullnameTh: 'ภัทรพล สุดประเสริฐ',
      userTitleEn: 'Mr.',
      userFullnameEn: 'Pattarapon Sudprasert',
      userDateOfBirth: null,
      userPhone: null,
      userEducation: null,
      userFaculty: null,
      userInstitution: null,
      userCountry: null,
      userAddress: null,
      userRemark: null,
      userRegisteredViaThaid: false,
      userThaidSynced: false,
    },
    ...overrides,
  } as User;
}

describe('CandidateAccountService', () => {
  let service: CandidateAccountService;
  let usersRepository: { findOne: jest.Mock; createQueryBuilder: jest.Mock };
  let transaction: jest.Mock;
  let moodleSyncService: {
    updateUser: jest.Mock;
    deleteUsers: jest.Mock;
  };

  beforeEach(() => {
    usersRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    transaction = jest.fn().mockResolvedValue(undefined);
    moodleSyncService = {
      updateUser: jest.fn().mockResolvedValue(undefined),
      deleteUsers: jest.fn().mockResolvedValue(undefined),
    };
    service = new CandidateAccountService(
      usersRepository as never,
      { transaction } as never,
      moodleSyncService as unknown as MoodleSyncService,
    );
  });

  it('rejects edits for an account registered via ThaiD', async () => {
    usersRepository.findOne.mockResolvedValue(
      buildUser({
        PROFILE: {
          ...buildUser().PROFILE,
          userRegisteredViaThaid: true,
        } as User['PROFILE'],
      }),
    );

    await expect(
      service.updateCandidate(7, { userPhone: '0812345678' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(moodleSyncService.updateUser).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('does not save locally when Moodle update fails', async () => {
    usersRepository.findOne.mockResolvedValue(buildUser());
    moodleSyncService.updateUser.mockRejectedValue(
      new Error('invalidparameter: Invalid parameter value detected'),
    );

    await expect(
      service.updateCandidate(7, { email: 'new@buu.ac.th' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email before calling Moodle', async () => {
    usersRepository.findOne
      .mockResolvedValueOnce(buildUser())
      .mockResolvedValueOnce(buildUser({ USER_ID: 9 }));

    await expect(
      service.updateCandidate(7, { email: 'taken@buu.ac.th' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(moodleSyncService.updateUser).not.toHaveBeenCalled();
  });

  it('sends email and username to Moodle then saves locally', async () => {
    const user = buildUser();
    usersRepository.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    const dto: UpdateCandidateAccountDto = { email: 'New@buu.ac.th' };

    await service.updateCandidate(7, dto);

    expect(moodleSyncService.updateUser).toHaveBeenCalledWith(
      55,
      { email: 'new@buu.ac.th', username: 'new@buu.ac.th' },
      expect.objectContaining({ userId: 7, moodleRefId: 55 }),
    );
    expect(transaction).toHaveBeenCalled();
  });

  it('skips Moodle when the account has no Moodle id', async () => {
    const user = buildUser({ USER_MOODLE_ID: null });
    usersRepository.findOne.mockResolvedValue(user);

    await service.updateCandidate(7, { userPhone: '0899999999' });

    expect(moodleSyncService.updateUser).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalled();
  });

  it('does not purge locally when Moodle delete fails', async () => {
    usersRepository.findOne.mockResolvedValue(buildUser());
    moodleSyncService.deleteUsers.mockRejectedValue(new Error('moodle down'));

    await expect(service.purgeCandidate(7)).rejects.toThrow('moodle down');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('purges locally without Moodle when the account has no Moodle id', async () => {
    usersRepository.findOne.mockResolvedValue(buildUser({ USER_MOODLE_ID: null }));

    await service.purgeCandidate(7);

    expect(moodleSyncService.deleteUsers).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalled();
  });
});
