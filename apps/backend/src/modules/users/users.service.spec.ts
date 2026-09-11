import type { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import type { CreateUserDto } from './dto/create-user.dto';
import type { User } from './entities/user.entity';
import type { Role } from '../roles/entities/role.entity';
import type { UserProfileService } from '../user-profile/user-profile.service';
import type { MoodleSyncService } from '../moodle/moodle-sync.service';

jest.mock('bcrypt');

jest.mock('./dto/user-response.dto', () => ({
  UserResponseDto: {
    fromEntity: jest.fn(),
  },
}));

jest.mock('./entities/user.entity', () => ({
  User: class User {},
}));

jest.mock('../roles/entities/role.entity', () => ({
  Role: class Role {},
}));

jest.mock('../user-profile/user-profile.service', () => ({
  UserProfileService: class UserProfileService {},
}));

jest.mock('../moodle/moodle-sync.service', () => ({
  MoodleSyncService: class MoodleSyncService {},
}));

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  innerJoin: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
  select: jest.Mock;
  where: jest.Mock;
  orWhere: jest.Mock;
  getMany: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let rolesRepository: {
    findByIds: jest.Mock;
    find: jest.Mock;
  };
  let userProfileService: {
    create: jest.Mock;
  };
  let transactionManager: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  let moodleSyncService: {
    deleteUsers: jest.Mock;
  };
  let queryBuilder: QueryBuilderMock;

  const mockFromEntity = jest.mocked(UserResponseDto.fromEntity);

  const baseCreateDto = (
    overrides: Partial<CreateUserDto> = {},
  ): CreateUserDto => ({
    USER_EMAIL: 'student@buu.ac.th',
    USER_PASSWORD: 'password123',
    USER_STATUS: 'ACTIVE',
    USER_ROLES: [],
    ...overrides,
  });

  const createQueryBuilderMock = (): QueryBuilderMock => {
    const qb: QueryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    return qb;
  };

  const createService = (): UsersService =>
    new UsersService(
      usersRepository as unknown as Repository<User>,
      rolesRepository as unknown as Repository<Role>,
      userProfileService as unknown as UserProfileService,
      dataSource as unknown as DataSource,
      moodleSyncService as unknown as MoodleSyncService,
      {
        allocateUserCode: jest.fn().mockResolvedValue('2569100042'),
      } as never,
    );

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();

    usersRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(
        () => queryBuilder as unknown as SelectQueryBuilder<User>,
      ),
    };

    rolesRepository = {
      findByIds: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
    };

    userProfileService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    transactionManager = {
      create: jest.fn((_entity: unknown, data: Record<string, unknown>) => ({
        ...data,
      })),
      save: jest.fn((_entity: unknown, user: Record<string, unknown>) => ({
        ...user,
        USER_ID: 42,
      })),
      update: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(
        (callback: (manager: typeof transactionManager) => unknown) =>
          callback(transactionManager),
      ),
    };

    moodleSyncService = {
      deleteUsers: jest.fn().mockResolvedValue(undefined),
    };

    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    mockFromEntity.mockReset();
    mockFromEntity.mockImplementation(
      (user: User) =>
        ({
          USER_ID: user.USER_ID,
          USER_CODE: user.USER_CODE,
          USER_EMAIL: user.USER_EMAIL,
        }) as UserResponseDto,
    );

    service = createService();
  });

  describe('create', () => {
    it('should throw ConflictException when email already exists including soft-deleted', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue({
        USER_ID: 1,
        USER_EMAIL: 'student@buu.ac.th',
        deletedAt: new Date(),
      });

      // Act / Assert
      await expect(service.create(baseCreateDto())).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [{ USER_EMAIL: 'student@buu.ac.th' }],
        withDeleted: true,
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when national ID already exists', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue({
        USER_ID: 2,
        USER_NATIONAL_ID: '1234567890123',
      });

      // Act / Assert
      await expect(
        service.create(baseCreateDto({ USER_NATIONAL_ID: '1234567890123' })),
      ).rejects.toThrow(ConflictException);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [
          { USER_EMAIL: 'student@buu.ac.th' },
          { USER_NATIONAL_ID: '1234567890123' },
        ],
        withDeleted: true,
      });
    });

    it('should throw ConflictException when passport already exists', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue({
        USER_ID: 3,
        USER_PASSPORT_NO: 'AB1234567',
      });

      // Act / Assert
      await expect(
        service.create(baseCreateDto({ USER_PASSPORT_NO: 'AB1234567' })),
      ).rejects.toThrow(ConflictException);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [
          { USER_EMAIL: 'student@buu.ac.th' },
          { USER_PASSPORT_NO: 'AB1234567' },
        ],
        withDeleted: true,
      });
    });

    it('should hash password before persisting user', async () => {
      // Arrange
      const dto = baseCreateDto({ USER_PASSWORD: 'plain-password' });

      // Act
      await service.create(dto);

      // Assert
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 'salt');
      expect(transactionManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ USER_PASSWORD: 'hashed-password' }),
      );
    });

    it('should assign roles when USER_ROLES is non-empty', async () => {
      // Arrange
      const roles = [
        { ROLE_ID: 1, ROLE_NAME: 'CANDIDATE' },
        { ROLE_ID: 2, ROLE_NAME: 'ADMIN' },
      ];
      rolesRepository.findByIds.mockResolvedValue(roles);
      let savedUserPayload: Record<string, unknown> | undefined;
      transactionManager.save.mockImplementation(
        (_entity: unknown, user: Record<string, unknown>) => {
          savedUserPayload = user;
          return { ...user, USER_ID: 42 };
        },
      );

      // Act
      await service.create(baseCreateDto({ USER_ROLES: [1, 2] }));

      // Assert
      expect(rolesRepository.findByIds).toHaveBeenCalledWith([1, 2]);
      expect(savedUserPayload?.ROLES_ID).toEqual(roles);
    });

    it('should skip role lookup when USER_ROLES is empty', async () => {
      // Arrange / Act
      await service.create(baseCreateDto({ USER_ROLES: [] }));

      // Assert
      expect(rolesRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should set USER_CODE after insert via member code allocator', async () => {
      // Arrange / Act
      await service.create(baseCreateDto());

      // Assert
      expect(transactionManager.update).toHaveBeenCalledWith(
        expect.anything(),
        { USER_ID: 42 },
        { USER_CODE: '2569100042' },
      );
      expect(mockFromEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          USER_ID: 42,
          USER_CODE: '2569100042',
        }),
      );
    });

    it('should call UserProfileService.create inside transaction when profile provided', async () => {
      // Arrange
      const profile = {
        userFullnameTh: 'สมชาย ใจดี',
        userFullnameEn: 'Somchai Jaidee',
      };

      // Act
      await service.create(baseCreateDto({ profile }));

      // Assert
      expect(userProfileService.create).toHaveBeenCalledWith(
        {
          userId: 42,
          ...profile,
        },
        transactionManager,
      );
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should skip profile create when profile is not provided', async () => {
      // Arrange / Act
      await service.create(baseCreateDto());

      // Assert
      expect(userProfileService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should default to page=1 and limit=10 when query is empty', async () => {
      // Arrange
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(PAGINATION_DEFAULT_LIMIT);
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.limit).toBe(PAGINATION_DEFAULT_LIMIT);
    });

    it('should filter by role using innerJoin on ROLE_NAME', async () => {
      // Arrange
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll({ role: 'ADMIN' });

      // Assert
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'user.ROLES_ID',
        'role',
        'role.ROLE_NAME = :role',
        { role: 'ADMIN' },
      );
    });

    it('should apply search LIKE clauses across national ID, passport, email, and names', async () => {
      // Arrange
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll({ search: 'Somchai' });

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.anything());
    });

    it('should ignore blank search and not add search clause', async () => {
      // Arrange
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll({ search: '   ' });

      // Assert
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return DTO with PROFILE, ROLES_ID, and IMAGE relations', async () => {
      // Arrange
      const user = {
        USER_ID: 7,
        USER_EMAIL: 'a@buu.ac.th',
        PROFILE: { userFullnameTh: 'ทดสอบ' },
        ROLES_ID: [{ ROLE_ID: 1 }],
        IMAGE: { USER_IMAGE_URL: 'https://img/x.png' },
      };
      usersRepository.findOne.mockResolvedValue(user);
      mockFromEntity.mockReturnValue({ USER_ID: 7 } as UserResponseDto);

      // Act
      const result = await service.findOne(7);

      // Assert
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { USER_ID: 7 },
        relations: ['PROFILE', 'ROLES_ID', 'IMAGE'],
      });
      expect(mockFromEntity).toHaveBeenCalledWith(user);
      expect(result).toEqual({ USER_ID: 7 });
    });

    it('should throw NotFoundException when user is missing', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('User not found');
    });
  });

  describe('updateRole', () => {
    it('should replace ROLES_ID with found roles', async () => {
      // Arrange
      const user = {
        USER_ID: 5,
        ROLES_ID: [{ ROLE_ID: 9, ROLE_NAME: 'OLD' }],
        PROFILE: null,
      };
      const newRoles = [
        { ROLE_ID: 1, ROLE_NAME: 'ADMIN' },
        { ROLE_ID: 2, ROLE_NAME: 'STAFF' },
      ];
      usersRepository.findOne.mockResolvedValue(user);
      rolesRepository.find.mockResolvedValue(newRoles);
      usersRepository.save.mockImplementation((u: typeof user) => u);
      mockFromEntity.mockReturnValue({
        USER_ID: 5,
        ROLES_ID: newRoles as Role[],
      } as UserResponseDto);

      // Act
      const result = await service.updateRole(5, [1, 2]);

      // Assert
      expect(user.ROLES_ID).toEqual(newRoles);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual({ USER_ID: 5, ROLES_ID: newRoles });
    });

    it('should throw NotFoundException when user is missing', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.updateRole(404, [1])).rejects.toThrow(
        NotFoundException,
      );
      expect(rolesRepository.find).not.toHaveBeenCalled();
    });

    it('should assign only roles that were found for unknown roleIds', async () => {
      // Arrange
      const user = {
        USER_ID: 5,
        ROLES_ID: [],
        PROFILE: null,
      };
      const foundRoles = [{ ROLE_ID: 1, ROLE_NAME: 'ADMIN' }];
      usersRepository.findOne.mockResolvedValue(user);
      rolesRepository.find.mockResolvedValue(foundRoles);
      usersRepository.save.mockImplementation((u: typeof user) => u);
      mockFromEntity.mockReturnValue({
        USER_ID: 5,
        ROLES_ID: foundRoles as Role[],
      } as UserResponseDto);

      // Act
      await service.updateRole(5, [1, 999]);

      // Assert
      expect(user.ROLES_ID).toEqual(foundRoles);
      expect(user.ROLES_ID).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should soft-delete an existing user', async () => {
      // Arrange
      const user = { USER_ID: 10, USER_EMAIL: 'x@buu.ac.th' };
      usersRepository.findOne.mockResolvedValue(user);

      // Act
      await service.remove(10);

      // Assert
      expect(usersRepository.softRemove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when user is missing', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.remove(404)).rejects.toThrow(NotFoundException);
      expect(usersRepository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('checkIdentifiers', () => {
    it('should normalize identifiers by trim and dedupe', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.checkIdentifiers([
        ' 1234567890123 ',
        '1234567890123',
        ' AB1234567 ',
      ]);

      // Assert
      expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.USER_NATIONAL_ID IN (:...ids)',
        { ids: ['1234567890123', 'AB1234567'] },
      );
      expect(queryBuilder.orWhere).toHaveBeenCalledWith(
        'user.USER_PASSPORT_NO IN (:...ids)',
        { ids: ['1234567890123', 'AB1234567'] },
      );
    });

    it('should return empty array and skip query when all identifiers are blank', async () => {
      // Arrange / Act
      const result = await service.checkIdentifiers(['', '  ', '   ']);

      // Assert
      expect(result).toEqual([]);
      expect(usersRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should flag exists true/false based on national ID and passport hits', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue([
        {
          USER_NATIONAL_ID: '1234567890123',
          USER_PASSPORT_NO: null,
        },
        {
          USER_NATIONAL_ID: null,
          USER_PASSPORT_NO: 'AB1234567',
        },
      ]);

      // Act
      const result = await service.checkIdentifiers([
        '1234567890123',
        'AB1234567',
        'MISSING999',
      ]);

      // Assert
      expect(result).toEqual([
        { identifier: '1234567890123', exists: true },
        { identifier: 'AB1234567', exists: true },
        { identifier: 'MISSING999', exists: false },
      ]);
    });
  });

  describe('findByCode', () => {
    it('should throw NotFoundException including the missing code', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findByCode('69009999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByCode('69009999')).rejects.toThrow(
        'User with code 69009999 not found',
      );
    });
  });
});

describe('UserResponseDto', () => {
  // Use real DTO implementation (service suite mocks UserResponseDto).

  const { UserResponseDto: RealUserResponseDto } = jest.requireActual<{
    UserResponseDto: {
      fromEntity: (user: User) => UserResponseDto;
    };
  }>('./dto/user-response.dto');

  it('should omit password when mapping from entity', () => {
    // Arrange
    const user = {
      USER_ID: 1,
      USER_CODE: '69000001',
      USER_NATIONAL_ID: '1234567890123',
      USER_PASSPORT_NO: null,
      USER_EMAIL: 'student@buu.ac.th',
      USER_PASSWORD: 'should-not-leak',
      USER_STATUS: 'ACTIVE',
      CREATED_AT: new Date('2026-01-01'),
      UPDATED_AT: new Date('2026-01-02'),
    } as User;

    // Act
    const dto = RealUserResponseDto.fromEntity(user);

    // Assert
    expect(dto).not.toHaveProperty('USER_PASSWORD');
    expect(Object.prototype.hasOwnProperty.call(dto, 'USER_PASSWORD')).toBe(
      false,
    );
    expect(dto.USER_ID).toBe(1);
    expect(dto.USER_EMAIL).toBe('student@buu.ac.th');
  });
});
