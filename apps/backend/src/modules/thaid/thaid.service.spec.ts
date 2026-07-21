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
});
