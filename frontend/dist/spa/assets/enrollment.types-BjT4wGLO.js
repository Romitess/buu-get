var I = ((A) => ((A[(A.MISSING = 0)] = 'MISSING'), (A[(A.INTIME = 1)] = 'INTIME'), A))(I || {}),
  D = ((A) => (
    (A[(A.UNPAID = 0)] = 'UNPAID'),
    (A[(A.PAID = 1)] = 'PAID'),
    (A[(A.SEAT_ASSIGNED = 2)] = 'SEAT_ASSIGNED'),
    (A[(A.SEAT_PUBLISHED = 3)] = 'SEAT_PUBLISHED'),
    (A[(A.ATTENDED = 4)] = 'ATTENDED'),
    (A[(A.CANCELLED = 5)] = 'CANCELLED'),
    A
  ))(D || {}),
  E = ((A) => (
    (A[(A.UNCHECKED = 0)] = 'UNCHECKED'),
    (A[(A.PASS = 1)] = 'PASS'),
    (A[(A.WAIT_FIXED = 2)] = 'WAIT_FIXED'),
    (A[(A.CANCELLED = 3)] = 'CANCELLED'),
    A
  ))(E || {});
const N = {
    0: 'ค้างชำระ',
    1: 'ชำระเงินแล้ว',
    2: 'ชำระเงินแล้ว',
    3: 'ชำระเงินแล้ว',
    4: 'ชำระเงินแล้ว',
    5: 'ยกเลิก',
  },
  T = { 0: 'รอการตรวจสอบ', 1: 'ผ่าน', 2: 'รอการแก้ไข', 3: 'ยกเลิก' };
export { D as E, N as P, T as V, E as a, I as b };
