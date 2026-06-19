import { aq as s } from './index-CKSooU2k.js';
const r = async (a, n) => (await s.patch(`/transactions/by-erm/${a}`, n)).data,
  o = async (a) =>
    (await s.post('/transactions/pending-payment', { ...a, TRANX_AMOUNT: Number(a.TRANX_AMOUNT) }))
      .data;
export { o as c, r as u };
