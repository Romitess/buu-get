import {
  generateCertificateCode,
  generateReceiptVerifyCode,
} from './verification-code.util';

describe('verification-code.util', () => {
  it('generates receipt verify code with 16 characters', () => {
    const code = generateReceiptVerifyCode();
    expect(code).toHaveLength(16);
    expect(code).toMatch(/^[A-Z0-9]{16}$/);
  });

  it('generates unique receipt verify codes', () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generateReceiptVerifyCode()),
    );
    expect(codes.size).toBe(20);
  });

  it('generates certificate verify code with 16 characters', () => {
    const code = generateCertificateCode();
    expect(code).toHaveLength(16);
    expect(code).toMatch(/^[A-Z0-9]{16}$/);
  });

  it('generates unique certificate verify codes', () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generateCertificateCode()),
    );
    expect(codes.size).toBe(20);
  });
});
