import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFundSourceDto } from './create-fund-source.dto';
import { UpdateFundSourceDto } from './update-fund-source.dto';

describe('CreateFundSourceDto', () => {
  const validPlain = {
    FS_ACCOUNT_CODE: 'ACC-001',
    FS_NAME: 'ทุนสนับสนุนการศึกษา',
    FS_OPEN_STATUS: true,
  };

  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(CreateFundSourceDto, plain);
    return validate(dto);
  };

  it('should pass validation for a valid CreateFundSourceDto', async () => {
    // Arrange
    const plain = { ...validPlain };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when FS_ACCOUNT_CODE is empty (FUND-U-010)', async () => {
    // Arrange
    const plain = { ...validPlain, FS_ACCOUNT_CODE: '' };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const codeError = errors.find((e) => e.property === 'FS_ACCOUNT_CODE');
    expect(codeError).toBeDefined();
    expect(codeError?.constraints).toEqual(
      expect.objectContaining({
        isNotEmpty: expect.any(String),
      }),
    );
  });

  it('should fail validation when FS_ACCOUNT_CODE exceeds MaxLength 50 (FUND-U-011)', async () => {
    // Arrange
    const plain = { ...validPlain, FS_ACCOUNT_CODE: 'A'.repeat(51) };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const codeError = errors.find((e) => e.property === 'FS_ACCOUNT_CODE');
    expect(codeError).toBeDefined();
    expect(codeError?.constraints).toEqual(
      expect.objectContaining({
        maxLength: expect.any(String),
      }),
    );
  });

  it('should fail validation when FS_NAME is empty (FUND-U-012)', async () => {
    // Arrange
    const plain = { ...validPlain, FS_NAME: '' };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'FS_NAME');
    expect(nameError).toBeDefined();
    expect(nameError?.constraints).toEqual(
      expect.objectContaining({
        isNotEmpty: expect.any(String),
      }),
    );
  });

  it('should fail validation when FS_NAME exceeds MaxLength 255 (FUND-U-013)', async () => {
    // Arrange
    const plain = { ...validPlain, FS_NAME: 'N'.repeat(256) };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'FS_NAME');
    expect(nameError).toBeDefined();
    expect(nameError?.constraints).toEqual(
      expect.objectContaining({
        maxLength: expect.any(String),
      }),
    );
  });

  it('should fail validation when FS_OPEN_STATUS is not a boolean (FUND-U-014)', async () => {
    // Arrange
    const plain = { ...validPlain, FS_OPEN_STATUS: 'yes' };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'FS_OPEN_STATUS');
    expect(statusError).toBeDefined();
    expect(statusError?.constraints).toEqual(
      expect.objectContaining({
        isBoolean: expect.any(String),
      }),
    );
  });
});

describe('UpdateFundSourceDto PartialType (FUND-U-015)', () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateFundSourceDto, plain);
    return validate(dto);
  };

  it('should accept an empty patch object', async () => {
    // Arrange
    const plain = {};

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should accept a partial patch with only FS_NAME', async () => {
    // Arrange
    const plain = { FS_NAME: 'Partial fund' };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should accept a partial patch with only FS_OPEN_STATUS', async () => {
    // Arrange
    const plain = { FS_OPEN_STATUS: false };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should still validate provided fields (overlong FS_ACCOUNT_CODE)', async () => {
    // Arrange
    const plain = { FS_ACCOUNT_CODE: 'A'.repeat(51) };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'FS_ACCOUNT_CODE')).toBe(true);
  });
});
