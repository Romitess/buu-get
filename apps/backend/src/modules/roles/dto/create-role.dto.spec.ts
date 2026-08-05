import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

describe('CreateRoleDto (ROLES-U-016)', () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(CreateRoleDto, plain);
    return validate(dto);
  };

  it('should pass validation when ROLE_NAME and ROLE_DESCRIPTION are non-empty strings', async () => {
    // Arrange
    const plain = {
      ROLE_NAME: 'candidate',
      ROLE_DESCRIPTION: 'ผู้เข้าสอบ',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when ROLE_NAME is empty', async () => {
    // Arrange
    const plain = {
      ROLE_NAME: '',
      ROLE_DESCRIPTION: 'desc',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'ROLE_NAME')).toBe(true);
  });

  it('should fail validation when ROLE_DESCRIPTION is missing', async () => {
    // Arrange
    const plain = {
      ROLE_NAME: 'staff',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'ROLE_DESCRIPTION')).toBe(true);
  });

  it('should fail validation when ROLE_NAME is not a string', async () => {
    // Arrange
    const plain = {
      ROLE_NAME: 123,
      ROLE_DESCRIPTION: 'desc',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'ROLE_NAME')).toBe(true);
  });
});
