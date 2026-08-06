import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { PaymentConfigsService } from './payment-configs.service';
import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from './dto/payment-config.dto';
import { PaymentConfig } from './entities/payment-config.entity';

describe('PaymentConfigsService', () => {
  let service: PaymentConfigsService;
  let paymentConfigRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    softRemove: jest.Mock;
  };

  const baseDto: CreatePaymentConfigDto = {
    PROVIDER_NAME: 'Krungthai',
    PC_COMP_CODE: 'COMP01',
    PC_PROD_CODE: 'PROD01',
    PC_IS_ACTIVE: true,
    PC_EFFECTIVE_FROM: new Date('2026-01-01T00:00:00.000Z'),
  };

  const existingConfig = {
    PC_ID: 1,
    PROVIDER_NAME: 'Krungthai',
    PC_COMP_CODE: 'COMP01',
    PC_PROD_CODE: 'PROD01',
    PC_IS_ACTIVE: true,
    PC_EFFECTIVE_FROM: new Date('2026-01-01T00:00:00.000Z'),
    PC_EFFECTIVE_TO: null,
    CREATED_AT: new Date('2026-01-01T00:00:00.000Z'),
    UPDATED_AT: new Date('2026-01-01T00:00:00.000Z'),
    DELETED_AT: null,
    TRANSACTIONS: [],
  } as PaymentConfig;

  beforeEach(() => {
    paymentConfigRepository = {
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity: PaymentConfig) =>
          Promise.resolve({ ...entity, PC_ID: entity.PC_ID ?? 1 }),
        ),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };
    service = new PaymentConfigsService(
      paymentConfigRepository as unknown as Repository<PaymentConfig>,
    );
  });

  describe('create', () => {
    it('should map DTO through repository.create then save (PCFG-U-001)', async () => {
      // Arrange
      const createdEntity = { ...baseDto } as PaymentConfig;
      paymentConfigRepository.create.mockReturnValue(createdEntity);
      paymentConfigRepository.save.mockResolvedValue({
        ...createdEntity,
        PC_ID: 10,
      });

      // Act
      const result = await service.create(baseDto);

      // Assert
      expect(paymentConfigRepository.create).toHaveBeenCalledWith(baseDto);
      expect(paymentConfigRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result.PC_ID).toBe(10);
      expect(result.PROVIDER_NAME).toBe('Krungthai');
    });
  });

  describe('findAll', () => {
    it('should return repository.find() with no custom filters (PCFG-U-002)', async () => {
      // Arrange
      const rows = [existingConfig];
      paymentConfigRepository.find.mockResolvedValue(rows);

      // Act
      const result = await service.findAll();

      // Assert
      expect(paymentConfigRepository.find).toHaveBeenCalledWith();
      expect(paymentConfigRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('findOne', () => {
    it('should load PaymentConfig with TRANSACTIONS relation (PCFG-U-003)', async () => {
      // Arrange
      const withTx = {
        ...existingConfig,
        TRANSACTIONS: [{ TRANX_ID: 99 }],
      } as PaymentConfig;
      paymentConfigRepository.findOne.mockResolvedValue(withTx);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(paymentConfigRepository.findOne).toHaveBeenCalledWith({
        where: { PC_ID: 1 },
        relations: ['TRANSACTIONS'],
      });
      expect(result).toEqual(withTx);
      expect(result.TRANSACTIONS).toHaveLength(1);
    });

    it('should throw NotFoundException when PaymentConfig is missing (PCFG-U-004)', async () => {
      // Arrange
      paymentConfigRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'PaymentConfig with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update then re-fetch via findOne (PCFG-U-005)', async () => {
      // Arrange
      const dto: UpdatePaymentConfigDto = {
        PROVIDER_NAME: 'Updated Bank',
        PC_IS_ACTIVE: false,
      };
      const updated = {
        ...existingConfig,
        PROVIDER_NAME: 'Updated Bank',
        PC_IS_ACTIVE: false,
      } as PaymentConfig;
      paymentConfigRepository.findOne
        .mockResolvedValueOnce(existingConfig)
        .mockResolvedValueOnce(updated);

      // Act
      const result = await service.update(1, dto);

      // Assert
      expect(paymentConfigRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { PC_ID: 1 },
        relations: ['TRANSACTIONS'],
      });
      expect(paymentConfigRepository.update).toHaveBeenCalledWith(1, dto);
      expect(paymentConfigRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { PC_ID: 1 },
        relations: ['TRANSACTIONS'],
      });
      expect(result).toEqual(updated);
      expect(result.PROVIDER_NAME).toBe('Updated Bank');
    });

    it('should throw NotFoundException and not call update when missing (PCFG-U-006)', async () => {
      // Arrange
      paymentConfigRepository.findOne.mockResolvedValue(null);
      const dto: UpdatePaymentConfigDto = { PROVIDER_NAME: 'Nope' };

      // Act / Assert
      await expect(service.update(42, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(42, dto)).rejects.toThrow(
        'PaymentConfig with ID 42 not found',
      );
      expect(paymentConfigRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should softRemove existing PaymentConfig (PCFG-U-007)', async () => {
      // Arrange
      paymentConfigRepository.findOne.mockResolvedValue(existingConfig);

      // Act
      await service.remove(1);

      // Assert
      expect(paymentConfigRepository.findOne).toHaveBeenCalledWith({
        where: { PC_ID: 1 },
        relations: ['TRANSACTIONS'],
      });
      expect(paymentConfigRepository.softRemove).toHaveBeenCalledWith(
        existingConfig,
      );
    });

    it('should throw NotFoundException when PaymentConfig is missing (PCFG-U-008)', async () => {
      // Arrange
      paymentConfigRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.remove(77)).rejects.toThrow(NotFoundException);
      await expect(service.remove(77)).rejects.toThrow(
        'PaymentConfig with ID 77 not found',
      );
      expect(paymentConfigRepository.softRemove).not.toHaveBeenCalled();
    });
  });
});
