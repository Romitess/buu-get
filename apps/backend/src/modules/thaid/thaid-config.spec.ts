import { DEFAULT_THAID_SCOPE, resolveThaidConfig } from './thaid-config';

describe('resolveThaidConfig', () => {
  it('defaults to the sandbox host and callback', () => {
    const config = resolveThaidConfig({
      THAID_CLIENT_ID: 'client',
      THAID_CLIENT_SECRET: 'secret',
    });

    expect(config.env).toBe('sandbox');
    expect(config.issuer).toBe('https://imauthsbx.bora.dopa.go.th');
    expect(config.redirectUri).toBe(
      'https://buu-get-test.buu.ac.th/api/sandbox/callback',
    );
    expect(config.verifyType).toBe('pin');
    expect(config.scope).toBe(DEFAULT_THAID_SCOPE);
    expect(config.scope).toContain('address');
  });

  it('keeps the fixed scope when an old THAID_SCOPE value is still present', () => {
    const config = resolveThaidConfig({
      THAID_SCOPE: 'openid pid name',
    } as Parameters<typeof resolveThaidConfig>[0]);

    expect(config.scope).toBe(DEFAULT_THAID_SCOPE);
  });

  it('uses the production host and callback when THAID_ENV=production', () => {
    const config = resolveThaidConfig({ THAID_ENV: 'production' });

    expect(config.issuer).toBe('https://imauth.bora.dopa.go.th');
    expect(config.redirectUri).toBe(
      'https://buu-get.buu.ac.th/api/thaid/callback',
    );
  });

  it('strips a trailing slash from an overridden redirect URI', () => {
    const config = resolveThaidConfig({
      THAID_REDIRECT_URI: 'https://buu-get-test.buu.ac.th/api/sandbox/callback/',
    });

    expect(config.redirectUri).toBe(
      'https://buu-get-test.buu.ac.th/api/sandbox/callback',
    );
  });
});
