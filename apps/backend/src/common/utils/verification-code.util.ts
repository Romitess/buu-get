import { randomBytes } from 'crypto';

const VERIFY_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const VERIFY_CODE_LENGTH = 16;

function generateVerifyCode(length = VERIFY_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  return Array.from(
    bytes,
    (byte) => VERIFY_CODE_ALPHABET[byte % VERIFY_CODE_ALPHABET.length],
  ).join('');
}

export function generateCertificateCode(): string {
  return generateVerifyCode();
}

export function generateReceiptVerifyCode(): string {
  return generateVerifyCode();
}
