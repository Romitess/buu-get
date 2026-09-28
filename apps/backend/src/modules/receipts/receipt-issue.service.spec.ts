import { ServiceUnavailableException } from '@nestjs/common';
import { ReceiptIssueService } from './receipt-issue.service';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';

describe('ReceiptIssueService', () => {
  let service: ReceiptIssueService;
  let platformGatewayService: {
    getSignatureImageByPerson: jest.Mock;
    uploadBuffer: jest.Mock;
  };

  beforeEach(() => {
    platformGatewayService = {
      getSignatureImageByPerson: jest.fn(),
      uploadBuffer: jest.fn(),
    };
    service = new ReceiptIssueService(
      platformGatewayService as unknown as PlatformGatewayService,
    );
  });

  describe('fetchSignatureByPerson', () => {
    it('should return signature payload from e-sign response', async () => {
      platformGatewayService.getSignatureImageByPerson.mockResolvedValue({
        status: 'success',
        result: {
          PSN_ID: '00000001',
          PSN_FULLNAME: 'User Test1',
          SIGN_BASE64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        },
      });

      const result = await service.fetchSignatureByPerson('00000001');

      expect(
        platformGatewayService.getSignatureImageByPerson,
      ).toHaveBeenCalledWith({ psn_id: '00000001' });
      expect(result).toEqual({
        psnId: '00000001',
        fullName: 'User Test1',
        signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
      });
    });

    it('should throw when SIGN_BASE64 is missing', async () => {
      platformGatewayService.getSignatureImageByPerson.mockResolvedValue({
        status: 'success',
        result: { PSN_ID: '00000001', PSN_FULLNAME: 'User Test1' },
      });

      await expect(
        service.fetchSignatureByPerson('00000001', { retries: 2 }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(
        platformGatewayService.getSignatureImageByPerson,
      ).toHaveBeenCalledTimes(2);
    });

    it('should retry until signature image is available', async () => {
      platformGatewayService.getSignatureImageByPerson
        .mockResolvedValueOnce({
          status: 'success',
          result: { PSN_ID: '00000001', PSN_FULLNAME: 'User Test1' },
        })
        .mockResolvedValueOnce({
          status: 'success',
          result: {
            PSN_ID: '00000001',
            PSN_FULLNAME: 'User Test1',
            SIGN_BASE64:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
          },
        });

      const result = await service.fetchSignatureByPerson('00000001', {
        retries: 3,
      });

      expect(
        platformGatewayService.getSignatureImageByPerson,
      ).toHaveBeenCalledTimes(2);
      expect(result.signatureBase64).toContain('base64,');
    });
  });
});
