import { NotFoundException } from '@nestjs/common';
import { ThaidIdTokenClaims } from './thaid-jwt';

/** ข้อมูลจำลองสำหรับเครื่องที่ไม่ได้เชื่อม ThaiD */
export const MOCK_THAID_CLAIMS: ThaidIdTokenClaims = {
  pid: '1103700123451',
  sub: 'thaid-mock',
  name: 'นาย ภัทรพล สุดประเสริฐ',
  nameEn: 'Mr. Pattarapon Sudprasert',
  title: 'นาย',
  titleEn: 'Mr.',
  birthdate: '2004-04-11',
  address: '99/12 หมู่ที่ 5 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
};

export function assertThaidMockEnabled(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new NotFoundException();
  }
}
