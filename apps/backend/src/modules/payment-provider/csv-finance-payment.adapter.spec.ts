import { NotImplementedException } from '@nestjs/common';
import { CsvFinancePaymentAdapter } from './csv-finance-payment.adapter';

describe('CsvFinancePaymentAdapter', () => {
  const adapter = new CsvFinancePaymentAdapter();

  it('createIntent returns a noop intent (no local PAID path)', async () => {
    const result = await adapter.createIntent({
      ermId: 1,
      pcId: 2,
      amount: 500,
    });

    expect(result).toEqual({
      providerRef: null,
      expiresAt: null,
      tranxId: null,
    });
  });

  it('handleWebhook ignores payload without marking PAID', async () => {
    const result = await adapter.handleWebhook({ ref: 'x' });

    expect(result.ignored).toBe(true);
    expect(result.reason).toMatch(/confirmPayment/);
  });

  it('expire throws NotImplementedException', async () => {
    await expect(adapter.expire(99)).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
