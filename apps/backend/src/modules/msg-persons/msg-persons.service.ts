import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
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

  async updateRoles(
    psnId: string,
    roleIds: number[],
  ): Promise<MsgPersonResponseDto> {
    const person = await this.msgPersonsRepository.findOne({
      where: { PSN_ID: psnId },
      relations: ['ROLES'],
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const roles = await this.rolesRepository.find({
      where: { ROLE_ID: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    person.ROLES = roles;
    const saved = await this.msgPersonsRepository.save(person);
    return MsgPersonResponseDto.fromEntity(saved);
  }
}
