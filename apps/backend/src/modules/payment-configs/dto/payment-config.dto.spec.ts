import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from './payment-config.dto';

describe('CreatePaymentConfigDto', () => {
  const validPlain = {
    PROVIDER_NAME: 'Krungthai',
    PC_COMP_CODE: 'COMP01',
    PC_PROD_CODE: 'PROD01',
    PC_IS_ACTIVE: true,
    PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
  };

  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(CreatePaymentConfigDto, plain);
    return validate(dto);
  };

  describe('required strings (PCFG-U-009)', () => {
    it('should pass validation when PROVIDER_NAME, PC_COMP_CODE, and PC_PROD_CODE are present', async () => {
      // Arrange
      const plain = { ...validPlain };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when PROVIDER_NAME, PC_COMP_CODE, and PC_PROD_CODE are omitted', async () => {
      // Arrange
      const plain = {
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'PROVIDER_NAME')).toBe(true);
      expect(errors.some((e) => e.property === 'PC_COMP_CODE')).toBe(true);
      expect(errors.some((e) => e.property === 'PC_PROD_CODE')).toBe(true);
    });

    it('should fail validation when required string fields are empty', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PROVIDER_NAME: '',
        PC_COMP_CODE: '',
        PC_PROD_CODE: '',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'PROVIDER_NAME')).toBe(true);
      expect(errors.some((e) => e.property === 'PC_COMP_CODE')).toBe(true);
      expect(errors.some((e) => e.property === 'PC_PROD_CODE')).toBe(true);
    });
  });

  describe('MaxLength constraints (PCFG-U-010)', () => {
    it('should fail when PROVIDER_NAME exceeds 100 characters', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PROVIDER_NAME: 'A'.repeat(101),
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'PROVIDER_NAME');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toEqual(
        expect.objectContaining({
          maxLength: expect.any(String),
        }),
      );
    });

    it('should fail when PC_COMP_CODE exceeds 20 characters', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PC_COMP_CODE: 'C'.repeat(21),
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const codeError = errors.find((e) => e.property === 'PC_COMP_CODE');
      expect(codeError).toBeDefined();
      expect(codeError?.constraints).toEqual(
        expect.objectContaining({
          maxLength: expect.any(String),
        }),
      );
    });

    it('should fail when PC_PROD_CODE exceeds 20 characters', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PC_PROD_CODE: 'P'.repeat(21),
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const codeError = errors.find((e) => e.property === 'PC_PROD_CODE');
      expect(codeError).toBeDefined();
      expect(codeError?.constraints).toEqual(
        expect.objectContaining({
          maxLength: expect.any(String),
        }),
      );
    });

    it('should pass when string fields are at MaxLength bounds', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PROVIDER_NAME: 'A'.repeat(100),
        PC_COMP_CODE: 'C'.repeat(20),
        PC_PROD_CODE: 'P'.repeat(20),
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('PC_IS_ACTIVE required bool (PCFG-U-011)', () => {
    it('should fail when PC_IS_ACTIVE is omitted', async () => {
      // Arrange
      const { PC_IS_ACTIVE: _omit, ...plain } = validPlain;

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'PC_IS_ACTIVE')).toBe(true);
    });

    it('should pass when PC_IS_ACTIVE is true', async () => {
      // Arrange
      const plain = { ...validPlain, PC_IS_ACTIVE: true };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass when PC_IS_ACTIVE is false', async () => {
      // Arrange
      const plain = { ...validPlain, PC_IS_ACTIVE: false };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail when PC_IS_ACTIVE is not a boolean', async () => {
      // Arrange
      const plain = { ...validPlain, PC_IS_ACTIVE: 'yes' };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const activeError = errors.find((e) => e.property === 'PC_IS_ACTIVE');
      expect(activeError).toBeDefined();
      expect(activeError?.constraints).toEqual(
        expect.objectContaining({
          isBoolean: expect.any(String),
        }),
      );
    });
  });

  describe('PC_EFFECTIVE_FROM required ISO (PCFG-U-012)', () => {
    it('should fail when PC_EFFECTIVE_FROM is missing', async () => {
      // Arrange
      const { PC_EFFECTIVE_FROM: _omit, ...plain } = validPlain;

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'PC_EFFECTIVE_FROM')).toBe(true);
    });

    it('should fail when PC_EFFECTIVE_FROM is not a valid ISO date string', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PC_EFFECTIVE_FROM: 'not-a-date',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const fromError = errors.find((e) => e.property === 'PC_EFFECTIVE_FROM');
      expect(fromError).toBeDefined();
      expect(fromError?.constraints).toEqual(
        expect.objectContaining({
          isDateString: expect.any(String),
        }),
      );
    });

    it('should pass when PC_EFFECTIVE_FROM is a valid ISO date string', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PC_EFFECTIVE_FROM: '2026-08-05T10:00:00.000Z',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('PC_EFFECTIVE_TO optional (PCFG-U-013)', () => {
    it('should pass when PC_EFFECTIVE_TO is omitted', async () => {
      // Arrange
      const plain = { ...validPlain };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
      expect(plain).not.toHaveProperty('PC_EFFECTIVE_TO');
    });

    it('should fail when PC_EFFECTIVE_TO is invalid', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PC_EFFECTIVE_TO: 'invalid-date',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const toError = errors.find((e) => e.property === 'PC_EFFECTIVE_TO');
      expect(toError).toBeDefined();
      expect(toError?.constraints).toEqual(
        expect.objectContaining({
          isDateString: expect.any(String),
        }),
      );
    });

    it('should pass when PC_EFFECTIVE_TO is a valid ISO date string', async () => {
      // Arrange
      const plain = {
        ...validPlain,
        PC_EFFECTIVE_TO: '2026-12-31T23:59:59.000Z',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });
});

describe('UpdatePaymentConfigDto PartialType (PCFG-U-014)', () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(UpdatePaymentConfigDto, plain);
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

  it('should accept a partial patch with only PROVIDER_NAME', async () => {
    // Arrange
    const plain = { PROVIDER_NAME: 'Partial Bank' };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should accept a partial patch with only PC_IS_ACTIVE', async () => {
    // Arrange
    const plain = { PC_IS_ACTIVE: false };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should still validate provided fields (overlong PROVIDER_NAME)', async () => {
    // Arrange
    const plain = { PROVIDER_NAME: 'A'.repeat(101) };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'PROVIDER_NAME')).toBe(true);
  });
});
