import { aq as a } from './index-CKSooU2k.js';
const n = async (o, r) => {
  const e = r || localStorage.getItem('access_token'),
    t = {};
  return (
    e && (t.headers = { Authorization: `Bearer ${e}` }),
    (await a.get(`/profile-edit-history/profile/${o}`, t)).data
  );
};
export { n as f };
