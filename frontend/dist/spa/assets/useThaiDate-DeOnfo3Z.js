import { B as r } from './exam.service-0p8xz0zq.js';
const s = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ],
  h = 1e3 * 60 * 60 * 24;
function M() {
  return {
    formatThaiDate: (e) => {
      if (!e) return '-';
      const t = new Date(e);
      if (isNaN(t.getTime())) return e;
      const n = t.getDate().toString().padStart(2, '0'),
        a = (t.getMonth() + 1).toString().padStart(2, '0'),
        o = t.getFullYear() + r;
      return `${n}/${a}/${o}`;
    },
    formatThaiDateShort: (e) => {
      if (!e) return '-';
      const t = new Date(e);
      if (isNaN(t.getTime())) return e;
      const n = t.getDate(),
        a = s[t.getMonth()] ?? '',
        o = t.getFullYear() + r;
      return `${n} ${a} ${o}`;
    },
    formatThaiDateRange: (e, t) => {
      if (!e || !t) return '-';
      const n = new Date(e),
        a = new Date(t);
      if (isNaN(n.getTime()) || isNaN(a.getTime())) return '-';
      const o = n.getDate(),
        i = a.getDate(),
        c = n.getMonth(),
        D = a.getMonth(),
        u = s[c] ?? '',
        g = s[D] ?? '',
        f = a.getFullYear() + r;
      return c === D && n.getFullYear() === a.getFullYear()
        ? `${o} - ${i} ${g} ${f}`
        : `${o} ${u} - ${i} ${g} ${f}`;
    },
    calcDaysDiff: (e, t) => {
      if (!e || !t) return 0;
      const n = new Date(e),
        a = new Date(t);
      if (isNaN(n.getTime()) || isNaN(a.getTime())) return 0;
      const o = Math.abs(a.getTime() - n.getTime());
      return Math.ceil(o / h);
    },
  };
}
export { M as u };
