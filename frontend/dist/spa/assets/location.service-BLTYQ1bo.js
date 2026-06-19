import { aq as s } from './index-CKSooU2k.js';
const i = async () => {
    const a = await s.get('/exam-locations');
    return Promise.all(
      a.data.map(async (t) => {
        try {
          return await c(t.LOCATION_ID);
        } catch {
          return t;
        }
      }),
    );
  },
  n = async (a) => (await s.post('/exam-locations', a)).data,
  p = async (a, t) => {
    const e = await n(a),
      o = await s.post(
        `/exam-location-seats/generate/${e.LOCATION_ID}`,
        { seatStatuses: t },
        { timeout: 12e4 },
      );
    return { location: e, seats: o.data };
  },
  m = async (a, t) => (await s.patch(`/exam-locations/${a}`, t)).data,
  d = async (a) => {
    await s.delete(`/exam-locations/${a}`);
  },
  c = async (a) => (await s.get(`/exam-locations/${a}`)).data;
export { c as a, p as c, d, i as f, m as u };
