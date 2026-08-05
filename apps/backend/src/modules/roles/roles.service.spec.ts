import type { Repository } from 'typeorm';
import { RolesService } from './roles.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import type { Role } from './entities/role.entity';
import { RoleEnum } from './enums/role.enum';
import { USER_ADMIN_ROLES } from 'src/common/constants/role-groups';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: {
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    roleRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new RolesService(roleRepository as unknown as Repository<Role>);
  });

  describe('create', () => {
    it('should save DTO via repository when creating a role (ROLES-U-001)', async () => {
      // Arrange
      const dto: CreateRoleDto = {
        ROLE_NAME: 'candidate',
        ROLE_DESCRIPTION: 'ผู้เข้าสอบ',
      };
      const saved: Role = {
        ROLE_ID: 1,
        ...dto,
      } as Role;
      roleRepository.save.mockResolvedValue(saved);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(roleRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(saved);
    });
  });

  describe('findAll', () => {
    it('should return repository find() result (ROLES-U-002)', async () => {
      // Arrange
      const roles = [
        { ROLE_ID: 1, ROLE_NAME: 'admin' },
        { ROLE_ID: 2, ROLE_NAME: 'staff' },
      ] as Role[];
      roleRepository.find.mockResolvedValue(roles);

      // Act
      const result = await service.findAll();

      // Assert
      expect(roleRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual(roles);
    });
  });

  describe('findOne', () => {
    it('should find by ROLE_ID (ROLES-U-003)', async () => {
      // Arrange
      const role = { ROLE_ID: 5, ROLE_NAME: 'finance' } as Role;
      roleRepository.findOne.mockResolvedValue(role);

      // Act
      const result = await service.findOne(5);

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { ROLE_ID: 5 },
      });
      expect(result).toEqual(role);
    });
  });

  describe('update', () => {
    it('should delegate update to repository (ROLES-U-004)', async () => {
      // Arrange
      const dto: UpdateRoleDto = { ROLE_DESCRIPTION: 'updated' };
      const updateResult = { affected: 1, raw: [], generatedMaps: [] };
      roleRepository.update.mockResolvedValue(updateResult);

      // Act
      const result = await service.update(3, dto);

      // Assert
      expect(roleRepository.update).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(updateResult);
    });
  });

  describe('remove', () => {
    it('should hard-delete by id via repository.delete (ROLES-U-005)', async () => {
      // Arrange
      const deleteResult = { affected: 1, raw: [] };
      roleRepository.delete.mockResolvedValue(deleteResult);

      // Act
      const result = await service.remove(7);

      // Assert
      expect(roleRepository.delete).toHaveBeenCalledWith(7);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('findByName', () => {
    it('should find by ROLE_NAME (ROLES-U-006)', async () => {
      // Arrange
      const role = { ROLE_ID: 2, ROLE_NAME: 'staff' } as Role;
      roleRepository.findOne.mockResolvedValue(role);

      // Act
      const result = await service.findByName('staff');

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { ROLE_NAME: 'staff' },
      });
      expect(result).toEqual(role);
    });
  });
});

describe('RoleEnum (ROLES-U-007)', () => {
  it('should expose exactly 8 role values', () => {
    // Arrange
    const expected = [
      'candidate',
      'staff',
      'finance',
      'proctor',
      'executive',
      'registration_officer',
      'exam_operations_officer',
      'admin',
    ];

    // Act
    const values = Object.values(RoleEnum);

    // Assert
    expect(values).toHaveLength(8);
    expect(values).toEqual(expect.arrayContaining(expected));
    expect(RoleEnum.CANDIDATE).toBe('candidate');
    expect(RoleEnum.STAFF).toBe('staff');
    expect(RoleEnum.FINANCE).toBe('finance');
    expect(RoleEnum.PROCTOR).toBe('proctor');
    expect(RoleEnum.EXECUTIVE).toBe('executive');
    expect(RoleEnum.REGISTRATION_OFFICER).toBe('registration_officer');
    expect(RoleEnum.EXAM_OPERATIONS_OFFICER).toBe('exam_operations_officer');
    expect(RoleEnum.ADMIN).toBe('admin');
  });
});

describe('USER_ADMIN_ROLES (ROLES-U-008)', () => {
  it('should contain admin only', () => {
    // Arrange / Act
    const roles = USER_ADMIN_ROLES;

    // Assert
    expect(roles).toEqual([RoleEnum.ADMIN]);
    expect(roles).toHaveLength(1);
    expect(roles).not.toContain(RoleEnum.STAFF);
    expect(roles).not.toContain(RoleEnum.CANDIDATE);
  });
});
