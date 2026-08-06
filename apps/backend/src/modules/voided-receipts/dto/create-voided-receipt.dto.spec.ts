import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVoidedReceiptDto } from './create-voided-receipt.dto';

describe('CreateVoidedReceiptDto', () => {
  const validateDto = async (plain: Record<string, unknown>) => {
    const dto = plainToInstance(CreateVoidedReceiptDto, plain);
    return validate(dto);
  };

  it('VOID-U-018: should fail validation when RC_ID is not a number', async () => {
    // Arrange
    const plain = {
      RC_ID: 'not-a-number',
      VR_REASON: 'Valid reason',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'RC_ID')).toBe(true);
  });

  it('VOID-U-018: should fail validation when RC_ID is missing', async () => {
    // Arrange
    const plain = {
      VR_REASON: 'Valid reason',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'RC_ID')).toBe(true);
  });

  it('VOID-U-019: should fail validation when VR_REASON is empty (MinLength 1)', async () => {
    // Arrange
    const plain = {
      RC_ID: 1,
      VR_REASON: '',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'VR_REASON')).toBe(true);
  });

  it('VOID-U-020: should fail validation when VR_REASON exceeds MaxLength 2000', async () => {
    // Arrange
    const plain = {
      RC_ID: 1,
      VR_REASON: 'x'.repeat(2001),
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'VR_REASON')).toBe(true);
  });

  it('should pass validation when RC_ID is a number and VR_REASON is within bounds', async () => {
    // Arrange
    const plain = {
      RC_ID: 1,
      VR_REASON: 'Valid void reason',
    };

    // Act
    const errors = await validateDto(plain);

    // Assert
    expect(errors).toHaveLength(0);
  });
});
