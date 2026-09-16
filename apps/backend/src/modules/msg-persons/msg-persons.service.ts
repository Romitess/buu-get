import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { getRoleRank, maxRoleRank } from 'src/common/constants/role-rank';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import {
  AuthenticatedUser,
  getUserRoles,
} from 'src/common/utils/authz.util';
import { Role } from '../roles/entities/role.entity';
import { MsgPersonResponseDto } from './dto/msg-person-response.dto';
import { MsgPersonsQueryDto } from './dto/msg-persons-query.dto';
import { MsgPerson } from './entities/msg-person.entity';

@Injectable()
export class MsgPersonsService {
  constructor(
    @InjectRepository(MsgPerson)
    private readonly msgPersonsRepository: Repository<MsgPerson>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll(
    query: MsgPersonsQueryDto = {},
  ): Promise<PaginatedResponse<MsgPersonResponseDto>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const queryBuilder = this.msgPersonsRepository
      .createQueryBuilder('person')
      .leftJoinAndSelect('person.ROLES', 'roles');

    if (query.role) {
      queryBuilder.innerJoin(
        'person.ROLES',
        'roleFilter',
        'roleFilter.ROLE_NAME = :role',
        { role: query.role },
      );
    }

    if (query.excludeRetired === true) {
      queryBuilder.andWhere(
        '(person.PSN_RETIRE = :activeRetire OR person.PSN_RETIRE IS NULL)',
        { activeRetire: 'N' },
      );
    }

    const search = query.search?.trim();
    if (search) {
      const searchPattern = `%${search}%`;
      const searchLower = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('person.PSN_ID LIKE :searchPattern', { searchPattern })
            .orWhere('LOWER(person.PSN_USERNAME) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(person.PSN_EMAIL_BUU) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(person.PSN_FNAMETH) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(person.PSN_LNAMETH) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(person.PSN_FNAMEEN) LIKE :searchLower', {
              searchLower,
            })
            .orWhere('LOWER(person.PSN_LNAMEEN) LIKE :searchLower', {
              searchLower,
            });
        }),
      );
    }

    const [persons, total] = await queryBuilder
      .orderBy('person.PSN_ID', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return buildPaginatedResponse(
      persons.map((person) => MsgPersonResponseDto.fromEntity(person)),
      total,
      page,
      limit,
    );
  }

  async findOne(psnId: string): Promise<MsgPersonResponseDto> {
    const person = await this.msgPersonsRepository.findOne({
      where: { PSN_ID: psnId },
      relations: ['ROLES'],
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return MsgPersonResponseDto.fromEntity(person);
  }

  /**
   * หาบุคลากรสำหรับ loginBuu — ต้องมีบัตรประชาชนตรง, ยังทำงานอยู่,
   * และ username ตรงแบบ case-sensitive เหมือน HRD
   */
  async findForLogin(
    citizenId: string,
    username: string,
  ): Promise<MsgPerson | null> {
    const person = await this.msgPersonsRepository.findOne({
      where: {
        PSN_IDCARD: citizenId,
        PSN_RETIRE: 'N',
      },
      relations: ['ROLES'],
    });

    if (!person) {
      return null;
    }

    if (!person.PSN_USERNAME || person.PSN_USERNAME !== username) {
      return null;
    }

    return person;
  }

  /** โหลดบุคลากรพร้อม roles สำหรับ GET /auth/me ของ person token */
  async findEntityById(psnId: string): Promise<MsgPerson | null> {
    return this.msgPersonsRepository.findOne({
      where: { PSN_ID: psnId },
      relations: ['ROLES'],
    });
  }

  async updateRoles(
    psnId: string,
    roleIds: number[],
    actor: AuthenticatedUser,
  ): Promise<MsgPersonResponseDto> {
    const person = await this.msgPersonsRepository.findOne({
      where: { PSN_ID: psnId },
      relations: ['ROLES'],
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const roles =
      roleIds.length === 0
        ? []
        : await this.rolesRepository.find({
            where: { ROLE_ID: In(roleIds) },
          });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    const actorMaxRank = maxRoleRank(getUserRoles(actor));
    const existingRoleIds = new Set(
      (person.ROLES ?? []).map((role) => role.ROLE_ID),
    );
    const existingHigherRoleIds = (person.ROLES ?? [])
      .filter((role) => getRoleRank(role.ROLE_NAME) > actorMaxRank)
      .map((role) => role.ROLE_ID);

    for (const higherRoleId of existingHigherRoleIds) {
      if (!roleIds.includes(higherRoleId)) {
        throw new ForbiddenException(
          'Cannot remove a role higher than your own',
        );
      }
    }

    const newlyAssignedHigher = roles.filter(
      (role) =>
        getRoleRank(role.ROLE_NAME) > actorMaxRank &&
        !existingRoleIds.has(role.ROLE_ID),
    );
    if (newlyAssignedHigher.length > 0) {
      throw new ForbiddenException(
        'Cannot assign a role higher than your own',
      );
    }

    person.ROLES = roles;
    const saved = await this.msgPersonsRepository.save(person);
    return MsgPersonResponseDto.fromEntity(saved);
  }
}
