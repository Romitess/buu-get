import {
  amountsEqual,
  buildBillPaymentQrPayload,
  clipToLength,
  formatBankDateTime,
  parseBankDateTime,
  toOptionalDecimal,
  toOptionalInt,
  toOptionalTranxId,
} from './bank-callback.util';

describe('bank-callback.util', () => {
  it('parses 14-digit bank dateTime', () => {
    const parsed = parseBankDateTime('20260909120130');
    expect(parsed).not.toBeNull();
    expect(parsed?.payDate).toBe('2026-09-09');
    expect(parsed?.payTime).toBe('12:01:30');
  });

  it('rejects invalid dateTime formats', () => {
    expect(parseBankDateTime('20260909')).toBeNull();
    expect(parseBankDateTime('abcdefghijklmn')).toBeNull();
    expect(parseBankDateTime(undefined)).toBeNull();
  });

  it('compares amounts loosely across string/number', () => {
    expect(amountsEqual('1500', 1500)).toBe(true);
    expect(amountsEqual('1500.00', '1500')).toBe(true);
    expect(amountsEqual('1499', 1500)).toBe(false);
  });

  it('builds Bill Payment QR payload', () => {
    const payload = buildBillPaymentQrPayload({
      taxId: '0994000249357',
      suffix: 'XX',
      ref1: '1234567',
      ref2: '2026090900001',
      amount: 1500,
    });
    expect(payload).toBe('|0994000249357XX\r1234567\r2026090900001\r150000');
  });

  it('formats bank dateTime as YYYYMMDDhhmmss', () => {
    const formatted = formatBankDateTime(new Date(2026, 8, 9, 12, 0, 0));
    expect(formatted).toBe('20260909120000');
  });

  it('parses optional ints and decimals like lifelong columns', () => {
    expect(toOptionalInt('014')).toBe(14);
    expect(toOptionalInt('')).toBeNull();
    expect(toOptionalDecimal('500')).toBe('500.00');
    expect(toOptionalTranxId(900001)).toBe('900001');
    expect(clipToLength('abcdefghij', 4)).toBe('abcd');
  });
});
