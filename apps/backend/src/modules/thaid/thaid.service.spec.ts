import { ThaidService } from './thaid.service';

describe('ThaidService', () => {
  const service = new ThaidService();

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

  describe('buildIdentityCallbackRedirect', () => {
    it('redirects to success without exposing authorization code', () => {
      const result = service.buildIdentityCallbackRedirect('thaid', {
        code: 'secret-code',
        state: 'csrf-state',
      });

      expect(result.statusCode).toBe(302);
      expect(result.url).toBe('/#/thaid/callback?status=success');
      expect(result.url).not.toContain('secret-code');
      expect(result.url).not.toContain('csrf-state');
    });

    it('maps access_denied to denied', () => {
      const result = service.buildIdentityCallbackRedirect('sandbox', {
        error: 'access_denied',
      });

      expect(result.url).toBe('/#/thaid/callback?status=denied');
    });

    it('maps other OAuth errors to error', () => {
      const result = service.buildIdentityCallbackRedirect('thaid', {
        error: 'server_error',
      });

      expect(result.url).toBe('/#/thaid/callback?status=error');
    });

    it('maps missing code/error to unknown', () => {
      const result = service.buildIdentityCallbackRedirect('sandbox', {});

      expect(result.url).toBe('/#/thaid/callback?status=unknown');
    });

    it('prefixes FRONTEND_URL when provided', () => {
      const result = service.buildIdentityCallbackRedirect(
        'thaid',
        { code: 'abc' },
        'http://localhost:9000/',
      );

      expect(result.url).toBe(
        'http://localhost:9000/#/thaid/callback?status=success',
      );
    });

    it('uses the same result page for sandbox and thaid sources', () => {
      const sandbox = service.buildIdentityCallbackRedirect('sandbox', {
        code: 'abc',
      });
      const thaid = service.buildIdentityCallbackRedirect('thaid', {
        code: 'abc',
      });

      expect(sandbox.url).toBe(thaid.url);
      expect(sandbox.url).toBe('/#/thaid/callback?status=success');
    });
  });
});
