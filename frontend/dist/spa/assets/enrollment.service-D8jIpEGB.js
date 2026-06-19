import { aq as t } from './index-CKSooU2k.js';
const o = async () => (await t.get('/exam-enrollments')).data,
  c = async (e) => (await t.post('/exam-enrollments/match-import', { refs: e })).data,
  m = async (e) =>
    (await t.get(`/exam-enrollments/exam/${e}`)).data.map((s, n) => ({
      index: n + 1,
      ermId: s.ERM_ID,
      nationalId: s.USER?.USER_NATIONAL_ID || '-',
      titleTh: s.USER?.PROFILE?.userTitleTh || '-',
      fullnameTh: s.USER?.PROFILE?.userFullnameTh || '-',
      paymentStatus: s.ERM_STATUS,
      verifyStatus: s.ERM_VERIFY_STATUS,
      sessionId: s.SESSION_ID,
      sessionLocationId: s.SL_ID ?? null,
      userProfileId: s.USER?.PROFILE?.userProfileId || 0,
      remark: s.ERM_PHYSICAL_STATUS || '',
      slId: s.SL_ID,
      lsId: s.LS_ID,
    })),
  l = async (e) => (await t.get(`/exam-enrollments/exam/${e}`)).data,
  p = async (e) => (await t.get(`/exam-enrollments/${e}`)).data,
  i = async (e, a) => (await t.patch(`/exam-enrollments/${e}`, a)).data,
  u = async (e, a) =>
    (await t.patch('/exam-enrollments/bulk-seat-assignments', { assignments: e, sessionIds: a }))
      .data,
  E = async (e, a) => (await t.post(`/exam-enrollments/${e}/request-fix`, a)).data;
export { p as a, u as b, m as c, o as d, c as e, l as f, E as r, i as u };
