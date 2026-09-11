import { NotFoundException } from '@nestjs/common';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { MsgPersonsService } from './msg-persons.service';
import { MsgPersonResponseDto } from './dto/msg-person-response.dto';
import type { MsgPerson } from './entities/msg-person.entity';
import type { Role } from '../roles/entities/role.entity';

jest.mock('./dto/msg-person-response.dto', () => ({
  MsgPersonResponseDto: {
    fromEntity: jest.fn(),
  },
}));

jest.mock('./entities/msg-person.entity', () => ({
  MsgPerson: class MsgPerson {},
}));

jest.mock('../roles/entities/role.entity', () => ({
  Role: class Role {},
}));

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  innerJoin: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

describe('MsgPersonsService', () => {
  let service: MsgPersonsService;
  let msgPersonsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let rolesRepository: {
    find: jest.Mock;
  };
  let queryBuilder: QueryBuilderMock;

  const mockFromEntity = jest.mocked(MsgPersonResponseDto.fromEntity);

  const basePerson = (overrides: Partial<MsgPerson> = {}): MsgPerson => ({
    PSN_ID: 'TSTSTAFF01',
    PRF_NAMETH: null,
    PRF_NAMEEN: null,
    PSN_FNAMETH: 'เจ้าหน้าที่',
    PSN_FNAMEEN: null,
    PSN_LNAMETH: 'ทดสอบ',
    PSN_LNAMEEN: null,
    PSN_EMAIL_BUU: 'test.staff@buu-get.test',
    PSN_RETIRE: 'N',
    PSN_TECHNIQUE: null,
    PSN_USERNAME: 'staff',
    ROLES: [],
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
      getManyAndCount: jest.fn(),
    };
    return qb;
  };

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();
    msgPersonsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    rolesRepository = {
      find: jest.fn(),
    };
    service = new MsgPersonsService(
      msgPersonsRepository as never,
      rolesRepository as never,
    );
    mockFromEntity.mockImplementation(
      (person) =>
        ({
          PSN_ID: person.PSN_ID,
          ROLES: person.ROLES,
        }) as MsgPersonResponseDto,
    );
  });

  describe('findAll', () => {
    it('should default to page=1 and limit=10 when query is empty', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(PAGINATION_DEFAULT_LIMIT);
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.limit).toBe(PAGINATION_DEFAULT_LIMIT);
    });

    it('should filter by role name when role query is provided', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ role: 'staff' });

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'person.ROLES',
        'roleFilter',
        'roleFilter.ROLE_NAME = :role',
        { role: 'staff' },
      );
    });

    it('should apply search brackets when search is provided', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'staff' });

      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return person DTO when found', async () => {
      const person = basePerson();
      msgPersonsRepository.findOne.mockResolvedValue(person);

      const result = await service.findOne('TSTSTAFF01');

      expect(msgPersonsRepository.findOne).toHaveBeenCalledWith({
        where: { PSN_ID: 'TSTSTAFF01' },
        relations: ['ROLES'],
      });
      expect(result.PSN_ID).toBe('TSTSTAFF01');
    });

    it('should throw NotFoundException when person is missing', async () => {
      msgPersonsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('MISSING')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateRoles', () => {
    it('should assign roles when all role ids exist', async () => {
      const person = basePerson();
      const roles = [
        { ROLE_ID: 1, ROLE_NAME: 'staff' },
        { ROLE_ID: 2, ROLE_NAME: 'admin' },
      ] as Role[];
      msgPersonsRepository.findOne.mockResolvedValue(person);
      rolesRepository.find.mockResolvedValue(roles);
      msgPersonsRepository.save.mockImplementation(async (p: MsgPerson) => p);

      const result = await service.updateRoles('TSTSTAFF01', [1, 2]);

      expect(rolesRepository.find).toHaveBeenCalled();
      expect(msgPersonsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ ROLES: roles }),
      );
      expect(result.ROLES).toEqual(roles);
    });

    it('should throw NotFoundException when person is missing', async () => {
      msgPersonsRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRoles('MISSING', [1])).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(rolesRepository.find).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when one or more roles are missing', async () => {
      msgPersonsRepository.findOne.mockResolvedValue(basePerson());
      rolesRepository.find.mockResolvedValue([
        { ROLE_ID: 1, ROLE_NAME: 'staff' },
      ] as Role[]);

      await expect(
        service.updateRoles('TSTSTAFF01', [1, 999]),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(msgPersonsRepository.save).not.toHaveBeenCalled();
    });
  });
});
