import { P as o } from './index-CKSooU2k.js';
import { i as S } from './exam.service-0p8xz0zq.js';
const m = 2;
function c() {
  const n = o(),
    e = (a) => (a.SESSIONS || []).some((t) => Number(t.SS_SESSION_STATUS) >= m);
  return {
    isSeatAllocationLocked: e,
    navigateFromSeatAction: async (a) => {
      const t = await S(Number(a));
      await n.push({
        name: e(t) ? 'admin-exam-seat-candidates' : 'admin-exam-seat-management',
        params: { examId: String(a) },
      });
    },
  };
}
export { c as u };
