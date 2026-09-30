import { BadRequestException } from '@nestjs/common';
import { ThaidIdentityProvider } from './thaid-identity.provider';
import { ThaidOidcClient } from './thaid-oidc.client';
import { ThaidHandoffService } from './thaid-handoff.service';
import { ThaidAccountService } from './thaid-account.service';

describe('ThaidIdentityProvider', () => {
  const oidc = {
    requireConfig: jest.fn(),
    buildAuthorizeUrl: jest.fn(
      (state: string) =>
        `https://imauthsbx.bora.dopa.go.th/api/v2/oauth2/auth/?state=${state}&verify_type=pin`,
    ),
    exchangeCode: jest.fn(),
    verifyIdToken: jest.fn(),
  };
  const handoff = {
    createState: jest.fn(),
    consumeState: jest.fn(),
  };
  const accounts = {
    linkToUser: jest.fn(),
  };
  const provider = new ThaidIdentityProvider(
    oidc as unknown as ThaidOidcClient,
    handoff as unknown as ThaidHandoffService,
    accounts as unknown as ThaidAccountService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds an authorize URL with a server-side state', async () => {
    handoff.createState.mockResolvedValue('server-state');

    const result = await provider.startAuth({ intent: 'register' });

    expect(handoff.createState).toHaveBeenCalledWith('register');
    expect(result.authorizationUrl).toContain('imauthsbx.bora.dopa.go.th');
    expect(result.authorizationUrl).toContain('verify_type=pin');
    expect(result.authorizationUrl).toContain('state=server-state');
    expect(result.authorizationUrl).not.toContain('client_secret');
  });

  it('does not exchange a code when state is missing or already used', async () => {
    handoff.consumeState.mockResolvedValue(null);

    await expect(
      provider.handleCallback({
        query: { code: 'secret-code', state: 'reused' },
        body: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(oidc.exchangeCode).not.toHaveBeenCalled();
  });

  it('exchanges the code only after the state is consumed', async () => {
    handoff.consumeState.mockResolvedValue('login');
    oidc.exchangeCode.mockResolvedValue('id-token');
    oidc.verifyIdToken.mockResolvedValue({
      pid: '1234567890123',
      name: 'ทดสอบ ระบบ',
    });

    const result = await provider.handleCallback({
      query: { code: 'secret-code', state: 'fresh' },
      body: {},
    });

    expect(oidc.exchangeCode).toHaveBeenCalledWith('secret-code');
    expect(result.subject).toBe('1234567890123');
    expect(result.claims.intent).toBe('login');
  });
});
