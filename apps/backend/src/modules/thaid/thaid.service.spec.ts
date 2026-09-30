import { BadRequestException } from '@nestjs/common';
import { ThaidService } from './thaid.service';
import { ThaidIdentityProvider } from './thaid-identity.provider';
import { ThaidAccountService } from './thaid-account.service';
import { ThaidHandoffService } from './thaid-handoff.service';
import { ThaidOidcClient } from './thaid-oidc.client';

describe('ThaidService', () => {
  const identity = {
    startAuth: jest.fn(),
    handleCallback: jest.fn(),
    linkToUser: jest.fn(),
  };
  const accounts = {
    resolve: jest.fn(),
    issueLoginForUser: jest.fn(),
  };
  const handoff = {
    createSessionTicket: jest.fn(),
    consumeSessionTicket: jest.fn(),
  };
  const oidc = {
    getConfig: jest.fn().mockReturnValue({ env: 'sandbox' }),
  };

  const service = new ThaidService(
    identity as unknown as ThaidIdentityProvider,
    accounts as unknown as ThaidAccountService,
    handoff as unknown as ThaidHandoffService,
    oidc as unknown as ThaidOidcClient,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    oidc.getConfig.mockReturnValue({ env: 'sandbox' });
  });

  it('echoes approval callback payload', () => {
    const result = service.handleCallback('approval', {
      body: { ref1: 'ABC', amount: 500 },
      query: { bank: 'BBL' },
    });

    expect(result.ok).toBe(true);
    expect(result.endpoint).toBe('approval');
    expect(result.body).toEqual({ ref1: 'ABC', amount: 500 });
    expect(result.query).toEqual({ bank: 'BBL' });
    expect(result.receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('handles empty body and query for payment', () => {
    const result = service.handleCallback('payment', {
      body: {},
      query: {},
    });

    expect(result.endpoint).toBe('payment');
    expect(result.body).toEqual({});
    expect(result.query).toEqual({});
  });

  describe('completeIdentityCallback', () => {
    it('maps access_denied without exchanging a code', async () => {
      const result = await service.completeIdentityCallback('sandbox', {
        error: 'access_denied',
        state: 'csrf-state',
      });

      expect(result.statusCode).toBe(302);
      expect(result.url).toBe('/#/thaid/callback?status=denied');
      expect(identity.handleCallback).not.toHaveBeenCalled();
    });

    it('maps other OAuth errors to error', async () => {
      const result = await service.completeIdentityCallback('sandbox', {
        error: 'server_error',
      });

      expect(result.url).toBe('/#/thaid/callback?status=error');
      expect(identity.handleCallback).not.toHaveBeenCalled();
    });

    it('maps missing code/error to unknown', async () => {
      const result = await service.completeIdentityCallback('sandbox', {});

      expect(result.url).toBe('/#/thaid/callback?status=unknown');
    });

    it('rejects a callback whose source does not match THAID_ENV', async () => {
      const result = await service.completeIdentityCallback('thaid', {
        code: 'secret-code',
        state: 'csrf-state',
      });

      expect(result.url).toBe('/#/thaid/callback?status=error');
      expect(result.url).not.toContain('secret-code');
      expect(identity.handleCallback).not.toHaveBeenCalled();
    });

    it('redirects with a one-time ticket and does not expose the code', async () => {
      identity.handleCallback.mockResolvedValue({
        subject: '1234567890123',
        claims: { pid: '1234567890123', intent: 'login' },
      });
      accounts.resolve.mockResolvedValue({
        outcome: 'login',
        notice: 'signed_in',
        userId: 7,
      });
      handoff.createSessionTicket.mockResolvedValue('ticket-value');

      const result = await service.completeIdentityCallback(
        'sandbox',
        { code: 'secret-code', state: 'csrf-state' },
        'http://localhost:9000/',
      );

      expect(identity.handleCallback).toHaveBeenCalledWith({
        query: { code: 'secret-code', state: 'csrf-state' },
        body: {},
      });
      expect(result.url).toBe(
        'http://localhost:9000/#/thaid/callback?ticket=ticket-value',
      );
      expect(result.url).not.toContain('secret-code');
      expect(result.url).not.toContain('access_token');
    });

    it('redirects to error when state validation fails and does not leak the code', async () => {
      identity.handleCallback.mockRejectedValue(
        new BadRequestException('invalid state'),
      );

      const result = await service.completeIdentityCallback('sandbox', {
        code: 'secret-code',
        state: 'reused',
      });

      expect(result.url).toBe('/#/thaid/callback?status=error');
      expect(result.url).not.toContain('secret-code');
      expect(handoff.createSessionTicket).not.toHaveBeenCalled();
    });
  });

  describe('exchangeSession', () => {
    it('returns a login response for a login ticket', async () => {
      handoff.consumeSessionTicket.mockResolvedValue({
        outcome: 'login',
        notice: 'signed_in',
        userId: 7,
      });
      accounts.issueLoginForUser.mockResolvedValue({
        accessToken: 'app-jwt',
        user: {
          id: 7,
          actorType: 'user',
          email: 'student@example.com',
          role: 'candidate',
          roles: ['candidate'],
        },
      });

      await expect(service.exchangeSession('ticket-value')).resolves.toEqual({
        outcome: 'login',
        notice: 'signed_in',
        login: expect.objectContaining({ accessToken: 'app-jwt' }),
      });
    });

    it('returns prefill without creating a user', async () => {
      const prefill = {
        outcome: 'prefill' as const,
        notice: 'no_account' as const,
        registrationToken: 'proof',
        prefill: {
          nationalId: '1234567890123',
          titleTH: 'นาย',
          titleEN: 'Mr.',
          fullName: 'ทดสอบ ระบบ',
          englishName: 'Test User',
          birthdate: '1990-01-02',
        },
      };
      handoff.consumeSessionTicket.mockResolvedValue(prefill);

      await expect(service.exchangeSession('ticket-value')).resolves.toEqual(
        prefill,
      );
      expect(accounts.issueLoginForUser).not.toHaveBeenCalled();
    });
  });
});
