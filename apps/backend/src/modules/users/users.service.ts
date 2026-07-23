import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UserIdentifierCheckResultDto } from './dto/check-user-identifiers.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserProfileService } from '../user-profile/user-profile.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly userProfileService: UserProfileService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { USER_ROLES, profile, ...userData } = createUserDto;

    // ตรวจสอบ duplicate
    const whereConditions: Record<string, string>[] = [
      { USER_EMAIL: userData.USER_EMAIL },
    ];

    if (userData.USER_NATIONAL_ID) {
      whereConditions.push({
        USER_NATIONAL_ID: userData.USER_NATIONAL_ID,
      });
    }

    if (userData.USER_PASSPORT_NO) {
      whereConditions.push({
        USER_PASSPORT_NO: userData.USER_PASSPORT_NO,
      });
    }

    const existingUser = await this.usersRepository.findOne({
      where: whereConditions,
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('This user already exists.');
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    userData.USER_PASSWORD = await bcrypt.hash(userData.USER_PASSWORD, salt);

    // ใช้ Transaction เพื่อให้ User + Profile สร้างสำเร็จพร้อมกัน
    const savedUser = await this.dataSource.transaction(async (manager) => {
      // สร้าง User entity และผูก Roles
      const user = manager.create(User, userData);

      if (USER_ROLES && USER_ROLES.length > 0) {
        const roles = await this.rolesRepository.findByIds(USER_ROLES);
        user.ROLES_ID = roles;
      }

      const newUser = await manager.save(User, user);
      newUser.USER_CODE = this.generateUserCode(newUser.USER_ID);
      await manager.update(
        User,
        { USER_ID: newUser.USER_ID },
        { USER_CODE: newUser.USER_CODE },
      );

      // สร้าง Profile อัตโนมัติถ้ามีข้อมูลส่งมา
      if (profile) {
        await this.userProfileService.create(
          {
            userId: newUser.USER_ID,
            ...profile,
          },
          manager,
        );
      }

      return newUser;
    });

    return UserResponseDto.fromEntity(savedUser);
  }

  generateUserCode(userId: number, date: Date = new Date()): string {
    const buddhistYear = date.getFullYear() + 543;
    const yearPrefix = buddhistYear.toString().slice(-2);

    return `${yearPrefix}${String(userId).padStart(6, '0')}`;
  }

  async findAll(
    query: UsersQueryDto = {},
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .leftJoinAndSelect('user.ROLES_ID', 'roles');

    if (query.role) {
      queryBuilder.innerJoin(
        'user.ROLES_ID',
        'role',
        'role.ROLE_NAME = :role',
        { role: query.role },
      );
    }

    const search = query.search?.trim();
    if (search) {
      const searchPattern = `%${search}%`;
      const searchLower = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('user.USER_NATIONAL_ID LIKE :searchPattern', {
              searchPattern,
            })
            .orWhere('user.USER_PASSPORT_NO LIKE :searchPattern', {
              searchPattern,
            })
            .orWhere('LOWER(user.USER_EMAIL) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(profile.userFullnameTh) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(profile.userFullnameEn) LIKE :searchLower', {
              searchLower,
            });
        }),
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.CREATED_AT', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return buildPaginatedResponse(
      users.map((user) => UserResponseDto.fromEntity(user)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { USER_ID: id },
      relations: ['PROFILE', 'ROLES_ID', 'IMAGE'], // ✅ เพิ่มตรงนี้
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromEntity(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { USER_EMAIL: email },
      relations: ['ROLES_ID'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { USER_ID: id },
      relations: ['ROLES_ID', 'PROFILE', 'IMAGE'],
    });
  }

  async updateRole(
    userId: number,
    roleIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { USER_ID: userId },
      relations: ['ROLES_ID', 'PROFILE'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = await this.rolesRepository.find({
      where: { ROLE_ID: In(roleIds) },
    });

    user.ROLES_ID = roles;
    const savedUser = await this.usersRepository.save(user);
    return UserResponseDto.fromEntity(savedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { USER_ID: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.softRemove(user);
  }

  async findByCode(code: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { USER_CODE: code },
      relations: ['PROFILE', 'ROLES_ID', 'IMAGE'],
    });

    if (!user) {
      throw new NotFoundException(`User with code ${code} not found`);
    }

    return UserResponseDto.fromEntity(user);
  }

  /** ตรวจสอบว่ารหัสประชาชน/passport มีอยู่ในระบบหรือไม่ */
  async checkIdentifiers(
    identifiers: string[],
  ): Promise<UserIdentifierCheckResultDto[]> {
    const normalized = [
      ...new Set(
        identifiers.map((id) => id.trim()).filter((id) => id.length > 0),
      ),
    ];

    if (normalized.length === 0) {
      return [];
    }

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.USER_NATIONAL_ID', 'user.USER_PASSPORT_NO'])
      .where('user.USER_NATIONAL_ID IN (:...ids)', { ids: normalized })
      .orWhere('user.USER_PASSPORT_NO IN (:...ids)', { ids: normalized })
      .getMany();

    const foundSet = new Set<string>();
    for (const user of users) {
      if (user.USER_NATIONAL_ID?.trim()) {
        foundSet.add(user.USER_NATIONAL_ID.trim());
      }
      if (user.USER_PASSPORT_NO?.trim()) {
        foundSet.add(user.USER_PASSPORT_NO.trim());
      }
    }

    return normalized.map((identifier) => ({
      identifier,
      exists: foundSet.has(identifier),
    }));
  }
}
