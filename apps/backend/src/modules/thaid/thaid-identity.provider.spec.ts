import { BadRequestException } from '@nestjs/common';
import {
  readThaidClaims,
  ThaidIdentityProvider,
} from './thaid-identity.provider';
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
    fetchUserInfo: jest.fn(),
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

    expect(handoff.createState).toHaveBeenCalledWith('register', undefined);
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
    handoff.consumeState.mockResolvedValue({ intent: 'login', userId: null });
    oidc.exchangeCode.mockResolvedValue({ idToken: 'id-token' });
    oidc.verifyIdToken.mockResolvedValue({
      pid: '1234567890123',
      name: 'ทดสอบ ระบบ',
    });

    const result = await provider.handleCallback({
      query: { code: 'secret-code', state: 'fresh' },
      body: {},
    });

    expect(oidc.exchangeCode).toHaveBeenCalledWith('secret-code');
    expect(oidc.fetchUserInfo).not.toHaveBeenCalled();
    expect(result.subject).toBe('1234567890123');
    expect(result.claims.intent).toBe('login');
  });

  it('keeps an address that arrived on the id token', async () => {
    handoff.consumeState.mockResolvedValue({
      intent: 'register',
      userId: null,
    });
    oidc.exchangeCode.mockResolvedValue({ idToken: 'id-token' });
    oidc.verifyIdToken.mockResolvedValue({
      pid: '1234567890123',
      address: '99/12 หมู่ที่ 5 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    });

    const result = await provider.handleCallback({
      query: { code: 'secret-code', state: 'fresh' },
      body: {},
    });

    expect(result.claims.address).toBe(
      '99/12 หมู่ที่ 5 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    );
  });

  it('reads the house address from userinfo when the id token has none', async () => {
    handoff.consumeState.mockResolvedValue({ intent: 'login', userId: null });
    oidc.exchangeCode.mockResolvedValue({
      idToken: 'id-token',
      accessToken: 'access-token',
    });
    oidc.verifyIdToken.mockResolvedValue({ pid: '1234567890123' });
    oidc.fetchUserInfo.mockResolvedValue({
      house_address: {
        id: '12345678901',
        raw: '99/12#5###สุขุมวิท#คลองเตย#คลองเตย#กรุงเทพมหานคร',
      },
    });

    const result = await provider.handleCallback({
      query: { code: 'secret-code', state: 'fresh' },
      body: {},
    });

    expect(readThaidClaims(result.claims).identity.address).toBe(
      '99/12 หมู่ที่ 5 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    );
    expect(oidc.fetchUserInfo).toHaveBeenCalledWith('access-token');
    expect(result.claims.address).toBe(
      '99/12 หมู่ที่ 5 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    );
  });
});
