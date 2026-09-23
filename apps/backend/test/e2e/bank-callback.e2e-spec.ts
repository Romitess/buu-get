import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { RoleEnum } from '../../src/modules/roles/enums/role.enum';
import { BankCallbackController } from '../../src/modules/bank-callbacks/bank-callback.controller';
import { BillApprovalService } from '../../src/modules/bank-callbacks/services/bill-approval.service';
import { BillPaymentService } from '../../src/modules/bank-callbacks/services/bill-payment.service';
import { MockBankService } from '../../src/modules/bank-callbacks/services/mock-bank.service';
import { PaymentMode } from '../../src/modules/bank-callbacks/constants/payment-mode';
import { BankRespCode } from '../../src/modules/bank-callbacks/constants/bank-resp-codes';
import { PaymentStatusService } from '../../src/modules/bank-callbacks/services/payment-status.service';
import { TransactionPaymentStatus } from '../../src/modules/transactions/entities/transaction.entity';

jest.mock('uuid', () => ({
  v4: () => '00000000-0000-4000-8000-000000000000',
}));

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: {
        userId: number;
        email: string;
        role: RoleEnum;
        roles: RoleEnum[];
      };
    }>();
    req.user = {
      userId: 42,
      email: 'candidate@example.com',
      role: RoleEnum.CANDIDATE,
      roles: [RoleEnum.CANDIDATE],
    };
    return true;
  }
}

describe('Bank Callback (e2e)', () => {
  let app: INestApplication;
  let paymentMode: PaymentMode = PaymentMode.MOCK;

  const billApprovalService = {
    approve: jest.fn(),
  };
  const billPaymentService = {
    payment: jest.fn(),
  };
  const mockBankService = {
    assertBankCallbacksEnabled: jest.fn(),
    getPaymentMode: jest.fn(() => paymentMode),
    mockPay: jest.fn(),
  };
  const paymentStatusService = {
    getStatus: jest.fn(),
  };

  const baseApprovalBody = {
    user: 'mock@buu',
    password: 'mock-secret',
    comCode: 'BUU',
    prodCode: 'GET',
    command: 'approve',
    bankCode: '014',
    bankRef: 'BK202609091200001',
    dateTime: '20260909120000',
    effDate: '20260909',
    amount: '1500',
    channel: 'mobile',
    cusName: 'ทดสอบ ระบบ',
    ref1: '26000001',
    ref2: '260909000001',
    ref3: '',
    ref4: '',
  };

  beforeAll(async () => {
    const { TransactionsController } =
      await import('../../src/modules/transactions/transactions.controller');
    const { TransactionsService } =
      await import('../../src/modules/transactions/transactions.service');

    const transactionsService = {
      createTransactionForFlow: jest.fn(),
      createPendingPayment: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      confirmPaymentFlow: jest.fn(),
      startPaymentSession: jest.fn(),
      expireTransaction: jest.fn(),
      refundTransaction: jest.fn(),
      updateByErmId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [BankCallbackController, TransactionsController],
      providers: [
        { provide: BillApprovalService, useValue: billApprovalService },
        { provide: BillPaymentService, useValue: billPaymentService },
        { provide: MockBankService, useValue: mockBankService },
        { provide: PaymentStatusService, useValue: paymentStatusService },
        { provide: TransactionsService, useValue: transactionsService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) =>
              key === 'PAYMENT_MODE' ? paymentMode : fallback,
            ),
          },
        },
        RolesGuard,
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalGuards(new MockJwtAuthGuard(), moduleRef.get(RolesGuard));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    paymentMode = PaymentMode.MOCK;
    mockBankService.assertBankCallbacksEnabled.mockImplementation(
      () => undefined,
    );
  });

  it('DT-01: approval happy path returns respCode 0 + tranxId', async () => {
    billApprovalService.approve.mockResolvedValue({
      tranxId: 900001,
      bankRef: baseApprovalBody.bankRef,
      respCode: BankRespCode.SUCCESS,
      respMsg: 'Successful',
      balance: '1500',
      cusName: baseApprovalBody.cusName,
      info: '',
    });

    const res = await request(app.getHttpServer())
      .post('/api/approval')
      .send(baseApprovalBody)
      .expect(HttpStatus.OK);

    expect(res.body.respCode).toBe('0');
    expect(res.body.tranxId).toBe(900001);
    expect(billApprovalService.approve).toHaveBeenCalled();
  });

  it('DT-03: payment happy path returns respCode 0', async () => {
    billPaymentService.payment.mockResolvedValue({
      tranxId: '900001',
      bankRef: baseApprovalBody.bankRef,
      respCode: BankRespCode.SUCCESS,
      respMsg: 'Successful',
      balance: '1500',
      cusName: baseApprovalBody.cusName,
      info: '',
    });

    const res = await request(app.getHttpServer())
      .post('/api/payment')
      .send({ ...baseApprovalBody, command: 'payment', tranxId: '900001' })
      .expect(HttpStatus.OK);

    expect(res.body.respCode).toBe('0');
  });

  it('DT-N01: invalid credentials returns 101 with HTTP 200', async () => {
    billApprovalService.approve.mockResolvedValue({
      tranxId: null,
      bankRef: baseApprovalBody.bankRef,
      respCode: BankRespCode.INVALID_CREDENTIALS,
      respMsg: 'Invalid username/password',
      balance: '1500',
      cusName: baseApprovalBody.cusName,
      info: '',
    });

    const res = await request(app.getHttpServer())
      .post('/api/approval')
      .send({ ...baseApprovalBody, password: 'wrong' })
      .expect(HttpStatus.OK);

    expect(res.body.respCode).toBe('101');
  });

  it.each([
    ['104', BankRespCode.INVALID_REFERENCE],
    ['105', BankRespCode.INVALID_TRANX],
    ['106', BankRespCode.DUPLICATE],
    ['108', BankRespCode.INVALID_AMOUNT],
    ['103', BankRespCode.OVER_LIMIT],
    ['999', BankRespCode.EXPIRED],
  ])('negative respCode %s stays HTTP 200', async (code, respCode) => {
    billPaymentService.payment.mockResolvedValue({
      tranxId: '900001',
      bankRef: baseApprovalBody.bankRef,
      respCode,
      respMsg: 'error',
      balance: '1500',
      cusName: '',
      info: '',
    });

    const res = await request(app.getHttpServer())
      .post('/api/payment')
      .send({ ...baseApprovalBody, command: 'payment', tranxId: '900001' })
      .expect(HttpStatus.OK);

    expect(res.body.respCode).toBe(code);
  });

  it('DT-N13: non-POST returns HTTP 405', async () => {
    await request(app.getHttpServer())
      .get('/api/approval')
      .expect(HttpStatus.METHOD_NOT_ALLOWED);
  });

  it('CSV mode disables bank callbacks (503)', async () => {
    mockBankService.getPaymentMode.mockReturnValue(PaymentMode.CSV);

    await request(app.getHttpServer())
      .post('/api/approval')
      .send(baseApprovalBody)
      .expect(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('mock-pay triggers approval then payment path', async () => {
    mockBankService.mockPay.mockResolvedValue({
      approval: {
        respCode: '0',
        respMsg: 'Successful',
        tranxId: 900001,
      },
      payment: {
        respCode: '0',
        respMsg: 'Successful',
        tranxId: 900001,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/transactions/900001/mock-pay')
      .expect(HttpStatus.CREATED);

    expect(mockBankService.mockPay).toHaveBeenCalledWith(
      900001,
      expect.any(Object),
    );
    expect(res.body.payment.respCode).toBe('0');
  });

  it('payment-status poll reports paid', async () => {
    paymentStatusService.getStatus.mockResolvedValue({
      tranxId: 900001,
      paymentStatus: TransactionPaymentStatus.PAID,
      paid: true,
      ref1: '26000001',
      ref2: '260909000001',
      amount: 1500,
      qrCode: '|0994000249357XX\r26000001\r260909000001\r150000',
      expiresAt: null,
      paymentMode: PaymentMode.MOCK,
      message: 'ชำระเงินสำเร็จ',
    });

    const res = await request(app.getHttpServer())
      .get('/api/transactions/900001/payment-status')
      .expect(HttpStatus.OK);

    expect(res.body.paid).toBe(true);
    expect(res.body.message).toBe('ชำระเงินสำเร็จ');
  });
});
