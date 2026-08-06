import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReceiptStatus } from '../entities/receipt.entity';
import { CreateReceiptDto, UpdateReceiptDto } from './receipt.dto';

describe('CreateReceiptDto', () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(CreateReceiptDto, plain);
    return validate(dto);
  };

  describe('required fields (RCPT-U-014)', () => {
    it('should pass validation when TRANX_ID and RC_SIGNATURE_ID are valid', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 1,
        RC_SIGNATURE_ID: 'signature-id',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when required fields are empty', async () => {
      // Arrange
      const plain = {};

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'TRANX_ID')).toBe(true);
      expect(errors.some((e) => e.property === 'RC_SIGNATURE_ID')).toBe(true);
    });

    it('should fail validation when TRANX_ID is not an int', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 'not-an-int',
        RC_SIGNATURE_ID: 'signature-id',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'TRANX_ID')).toBe(true);
    });

    it('should fail validation when RC_SIGNATURE_ID is empty', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 1,
        RC_SIGNATURE_ID: '',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'RC_SIGNATURE_ID')).toBe(true);
    });
  });

  describe('RC_STATUS enum (RCPT-U-015)', () => {
    it('should pass when RC_STATUS is a valid ReceiptStatus', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 1,
        RC_SIGNATURE_ID: 'sig',
        RC_STATUS: ReceiptStatus.ISSUED,
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail IsEnum when RC_STATUS is invalid', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 1,
        RC_SIGNATURE_ID: 'sig',
        RC_STATUS: 99,
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const statusError = errors.find((e) => e.property === 'RC_STATUS');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toEqual(
        expect.objectContaining({
          isEnum: expect.any(String),
        }),
      );
    });
  });

  describe('RC_ISSUED_AT date (RCPT-U-016)', () => {
    it('should pass when RC_ISSUED_AT is a valid ISO date string', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 1,
        RC_SIGNATURE_ID: 'sig',
        RC_ISSUED_AT: '2026-08-05T10:00:00.000Z',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail when RC_ISSUED_AT is not a date string', async () => {
      // Arrange
      const plain = {
        TRANX_ID: 1,
        RC_SIGNATURE_ID: 'sig',
        RC_ISSUED_AT: 'not-a-date',
      };

      // Act
      const errors = await validateDto(plain);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'RC_ISSUED_AT')).toBe(true);
    });
  });
});

describe('UpdateReceiptDto (RCPT-U-017)', () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateReceiptDto, plain);
    return validate(dto);
  };

  it('should accept a partial patch with only RC_STATUS', async () => {
    // Arrange
    const plain = { RC_STATUS: ReceiptStatus.ISSUED };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should accept an empty patch object', async () => {
    // Arrange
    const plain = {};

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should still validate provided fields (invalid RC_STATUS)', async () => {
    // Arrange
    const plain = { RC_STATUS: 'invalid' };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'RC_STATUS')).toBe(true);
  });
});

describe('Tax/profile fields absent from DTOs (RCPT-U-018)', () => {
  const taxProfileKeys = [
    'RC_TAX_ID',
    'RC_NAME',
    'RC_PHONE',
    'RC_ADDRESS',
    'RC_VERIFY_CODE',
  ];

  it('should not declare tax/profile/verify fields on CreateReceiptDto prototype keys', () => {
    // Arrange
    const createKeys = Object.keys(new CreateReceiptDto());
    const declared = Object.getOwnPropertyNames(CreateReceiptDto.prototype);

    // Act / Assert — instance + prototype should not list tax/profile fields
    for (const key of taxProfileKeys) {
      expect(createKeys).not.toContain(key);
      expect(declared).not.toContain(key);
    }
  });

  it('should strip/forbid tax fields under whitelist + forbidNonWhitelisted', async () => {
    // Arrange
    const plain = {
      TRANX_ID: 1,
      RC_SIGNATURE_ID: 'sig',
      RC_TAX_ID: '1234567890123',
      RC_NAME: 'Tax Name',
      RC_PHONE: '0812345678',
      RC_ADDRESS: 'Somewhere',
      RC_VERIFY_CODE: 'SHOULDNOTSET',
    };
    const dto = plainToInstance(CreateReceiptDto, plain);

    // Act
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const forbiddenProps = errors.map((e) => e.property);
    expect(forbiddenProps).toEqual(
      expect.arrayContaining([
        'RC_TAX_ID',
        'RC_NAME',
        'RC_PHONE',
        'RC_ADDRESS',
        'RC_VERIFY_CODE',
      ]),
    );
  });

  it('should strip/forbid tax fields on UpdateReceiptDto under whitelist pipe', async () => {
    // Arrange
    const plain = {
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_TAX_ID: '999',
      RC_NAME: 'Nope',
    };
    const dto = plainToInstance(UpdateReceiptDto, plain);

    // Act
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'RC_TAX_ID')).toBe(true);
    expect(errors.some((e) => e.property === 'RC_NAME')).toBe(true);
  });
});
