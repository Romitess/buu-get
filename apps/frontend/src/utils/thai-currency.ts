/**
 * แปลงตัวเลข (THB) เป็นข้อความภาษาไทย เช่น 500 → 'ห้าร้อยบาทถ้วน'
 * รองรับเฉพาะจำนวนเต็มไม่ติดลบ ตั้งแต่ 0 ถึง 999,999
 */

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

/** แปลงตัวเลขเป็นคำอ่านภาษาไทยตามหลักไทย */
function readThaiNumber(amount: number): string {
  if (amount === 0) return THAI_DIGITS[0]!;

  const digits = String(Math.floor(amount)).split('').map(Number);
  const len = digits.length;

  return digits
    .map((digit, idx) => {
      const place = len - idx - 1;
      if (digit === 0) return '';

      // หลักหน่วยที่มากกว่าหนึ่งหลัก: ใช้ 'เอ็ด' แทน 'หนึ่ง'
      if (place === 0 && digit === 1 && len > 1) return 'เอ็ด';
      // หลักสิบ: 1 → '' (ใช้แค่ 'สิบ'), 2 → 'ยี่'
      if (place === 1) {
        if (digit === 1) return THAI_PLACES[1]!;
        if (digit === 2) return 'ยี่' + THAI_PLACES[1]!;
      }
      return THAI_DIGITS[digit] + THAI_PLACES[place]!;
    })
    .join('');
}

/** แปลงเงิน (สกุลบาท) เป็นข้อความเต็ม เช่น 'ห้าร้อยบาทถ้วน' */
export function numberToThaiText(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '-';
  return `${readThaiNumber(amount)}บาทถ้วน`;
}
