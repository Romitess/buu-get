import {
  O as _,
  t as T,
  Q as s,
  R as r,
  V as g,
  a8 as I,
  U as h,
  S as t,
  T as a,
  a3 as E,
  $ as k,
  _ as N,
  aE as R,
  f as v,
  r as f,
  a2 as S,
} from './index-CKSooU2k.js';
import { u as B } from './vue-i18n-Bebkm_iB.js';
import { I as V } from './image-display-9myJRY3L.js';
import { g as A } from './exam-rule-voucher.service-CrkXcGFH.js';
const D = { class: 'q-pa-md page-container-test' },
  M = { key: 0, class: 'row justify-end q-mb-md no-print' },
  C = { ref: 'voucherRef', class: 'voucher-wrapper' },
  U = { key: 0, class: 'voucher-card' },
  j = { class: 'voucher-header row items-center no-wrap' },
  q = { class: 'col text-center' },
  G = { class: 'header-title' },
  P = { class: 'header-subtitle' },
  $ = { class: 'voucher-body relative-position' },
  z = { class: 'content-container' },
  X = { class: 'profile-column' },
  L = { key: 0, class: 'voucher-photo-placeholder' },
  Q = { class: 'detail-grid-column' },
  J = { class: 'row q-col-gutter-y-sm full-height items-center' },
  O = { class: 'col-12 col-sm-6 detail-group' },
  W = { class: 'info-group' },
  F = { class: 'info-value' },
  H = { class: 'info-group' },
  K = { class: 'info-value name-value' },
  Y = { class: 'info-group' },
  Z = { class: 'info-value' },
  tt = { class: 'info-group' },
  et = { class: 'info-value' },
  it = { class: 'col-12 col-sm-6 detail-group' },
  at = { class: 'info-group' },
  lt = { class: 'info-value' },
  st = { class: 'info-group' },
  ot = { class: 'info-value' },
  rt = { class: 'info-group' },
  ct = { class: 'info-value venue-value' },
  dt = { key: 0 },
  ht = { class: 'info-group' },
  nt = { class: 'info-value' },
  vt = { class: 'voucher-footer flex flex-center column' },
  ut = { class: 'barcode-wrapper flex flex-center column bg-white q-pa-sm' },
  gt = { class: 'barcode-value text-weight-bold text-uppercase' },
  ft = { key: 1, class: 'regulations-block' },
  bt = { class: 'regulations-box relative-position' },
  wt = { class: 'regulations-content-wrapper' },
  yt = { class: 'regulations-heading-inline' },
  mt = { class: 'regulations-text-content q-mb-md' },
  xt = { class: 'regulations-heading-inline q-mt-md' },
  pt = { class: 'regulations-text-content' },
  _t = _({
    __name: 'test-voucher-report',
    props: {
      data: {},
      regulationsEn: {},
      regulationsTh: {},
      showRegulations: { type: Boolean, default: !0 },
      showVoucherCard: { type: Boolean, default: !0 },
      showActions: { type: Boolean, default: !0 },
      useImagePlaceholder: { type: Boolean, default: !1 },
    },
    setup(o) {
      const n = o,
        b = {
          id: 1,
          fullName: 'Mr. Somdream Jaidee',
          studentId: '66100001',
          examName: 'BUU-GET : Burapha University’s Graduate English Test',
          examDate: '15 May 2026',
          examTime: '08.00 AM - 10.00 AM',
          examType: 'General',
          location: 'QS1, Burapha University',
          seatNo: 'A1',
          voucherNo: 'ENG2026-001',
          citizenId: '1-1234-12345-12-1',
          testSession: 'X/XXXX',
        },
        l = v(() => n.data ?? b),
        { t: u } = B(),
        c = f(''),
        d = f(''),
        w = u('admin.testVoucherManagement.defaultRegulationsEn'),
        y = u('admin.testVoucherManagement.defaultRegulationsTh');
      T(async () => {
        try {
          const i = await A();
          (i.regulationsEn && (c.value = i.regulationsEn),
            i.regulationsTh && (d.value = i.regulationsTh));
        } catch {
          try {
            const i = localStorage.getItem('buu-get-regulations-en'),
              e = localStorage.getItem('buu-get-regulations-th');
            (i &&
              (i.startsWith('[')
                ? (c.value = JSON.parse(i).join(`
`))
                : (c.value = i)),
              e &&
                (e.startsWith('[')
                  ? (d.value = JSON.parse(e).join(`
`))
                  : (d.value = e)));
          } catch (i) {
            console.error('Failed to load regulations from localStorage', i);
          }
        }
      });
      const m = v(() => {
          let i = n.regulationsEn;
          i == null && (i = c.value || w);
          const e = Array.isArray(i)
            ? i.join(`
`)
            : i;
          return e ? e.trim().replace(/\n\s*(?!\d+\.)/g, ' ') : '';
        }),
        x = v(() => {
          let i = n.regulationsTh;
          i == null && (i = d.value || y);
          const e = Array.isArray(i)
            ? i.join(`
`)
            : i;
          return e ? e.trim().replace(/\n\s*(?!\d+\.)/g, ' ') : '';
        }),
        p = () => {
          window.print();
        };
      return (i, e) => (
        s(),
        r('div', D, [
          o.showActions
            ? (s(),
              r('div', M, [
                g(
                  I,
                  {
                    color: 'primary',
                    icon: 'print',
                    label: i.$t('exam.voucher.print'),
                    class: 'print-btn shadow-2 text-weight-bold',
                    onClick: p,
                  },
                  null,
                  8,
                  ['label'],
                ),
              ]))
            : h('', !0),
          t(
            'div',
            C,
            [
              o.showVoucherCard
                ? (s(),
                  r('div', U, [
                    t('div', j, [
                      e[0] ||
                        (e[0] = t(
                          'div',
                          { class: 'col-auto' },
                          [
                            t('img', {
                              src: 'icons/logo-vocher.png',
                              class: 'header-logo',
                              alt: 'BUULI Logo',
                            }),
                          ],
                          -1,
                        )),
                      t('div', q, [
                        t('h1', G, a(i.$t('exam.voucher.title')), 1),
                        t('h2', P, a(i.$t('exam.voucher.subtitle')), 1),
                      ]),
                    ]),
                    t('div', $, [
                      e[10] ||
                        (e[10] = t('div', { class: 'watermark-bg no-pointer-events' }, 'GET', -1)),
                      t('div', z, [
                        t('div', X, [
                          t(
                            'div',
                            {
                              class: E([
                                'profile-photo-wrapper',
                                { 'shadow-1': !o.useImagePlaceholder },
                              ]),
                            },
                            [
                              o.useImagePlaceholder
                                ? (s(),
                                  r('div', L, [
                                    g(k, { name: 'image', size: '48px', color: 'black' }),
                                  ]))
                                : (s(),
                                  N(
                                    V,
                                    {
                                      key: 1,
                                      'image-path': l.value.profileImage,
                                      class: 'profile-photo-img',
                                      width: '100%',
                                      height: '100%',
                                      'object-fit': 'cover',
                                      'border-radius': '0px',
                                      alt: 'Profile Photo',
                                    },
                                    null,
                                    8,
                                    ['image-path'],
                                  )),
                            ],
                            2,
                          ),
                          e[1] || (e[1] = t('div', { class: 'signature-line' }, null, -1)),
                        ]),
                        t('div', Q, [
                          t('div', J, [
                            t('div', O, [
                              t('div', W, [
                                e[2] ||
                                  (e[2] = t(
                                    'label',
                                    { class: 'info-label' },
                                    'Test Taker ID:',
                                    -1,
                                  )),
                                t('div', F, a(l.value.studentId), 1),
                              ]),
                              t('div', H, [
                                e[3] ||
                                  (e[3] = t('label', { class: 'info-label' }, 'Name Surname:', -1)),
                                t('div', K, a(l.value.fullName), 1),
                              ]),
                              t('div', Y, [
                                e[4] ||
                                  (e[4] = t('label', { class: 'info-label' }, 'Citizen ID:', -1)),
                                t('div', Z, a(l.value.citizenId || '-'), 1),
                              ]),
                              t('div', tt, [
                                e[5] ||
                                  (e[5] = t('label', { class: 'info-label' }, 'Test Session:', -1)),
                                t('div', et, a(l.value.testSession || '-'), 1),
                              ]),
                            ]),
                            t('div', it, [
                              t('div', at, [
                                e[6] ||
                                  (e[6] = t('label', { class: 'info-label' }, 'Test Date:', -1)),
                                t('div', lt, a(l.value.examDate), 1),
                              ]),
                              t('div', st, [
                                e[7] || (e[7] = t('label', { class: 'info-label' }, 'Time:', -1)),
                                t('div', ot, a(l.value.examTime), 1),
                              ]),
                              t('div', rt, [
                                e[8] || (e[8] = t('label', { class: 'info-label' }, 'Venue:', -1)),
                                t('div', ct, [
                                  t('span', null, a(l.value.location), 1),
                                  l.value.locationRoom
                                    ? (s(), r('span', dt, ' ' + a(l.value.locationRoom), 1))
                                    : h('', !0),
                                ]),
                              ]),
                              t('div', ht, [
                                e[9] ||
                                  (e[9] = t('label', { class: 'info-label' }, 'Seat Number:', -1)),
                                t('div', nt, a(l.value.seatNo), 1),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                    t('div', vt, [
                      t('div', ut, [
                        e[11] ||
                          (e[11] = R(
                            '<svg class="barcode-svg" viewBox="0 0 360 48" xmlns="http://www.w3.org/2000/svg" data-v-02b33311><rect x="0" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="6" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="10" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="18" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="22" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="26" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="34" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="40" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="44" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="52" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="58" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="64" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="68" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="74" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="80" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="84" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="92" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="98" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="102" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="110" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="116" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="122" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="126" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="132" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="138" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="142" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="150" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="156" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="160" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="168" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="174" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="180" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="184" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="190" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="196" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="200" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="208" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="214" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="218" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="226" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="232" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="238" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="242" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="248" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="254" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="258" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="266" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="272" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="276" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="284" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="290" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="296" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="300" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="306" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="312" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="316" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="324" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="330" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect><rect x="334" y="0" width="4" height="48" fill="#000" data-v-02b33311></rect><rect x="342" y="0" width="2" height="48" fill="#000" data-v-02b33311></rect><rect x="348" y="0" width="3" height="48" fill="#000" data-v-02b33311></rect><rect x="354" y="0" width="1" height="48" fill="#000" data-v-02b33311></rect></svg>',
                            1,
                          )),
                        t('div', gt, a(l.value.barcodeValue || l.value.voucherNo), 1),
                      ]),
                    ]),
                  ]))
                : h('', !0),
              o.showRegulations
                ? (s(),
                  r('div', ft, [
                    t('div', bt, [
                      e[12] ||
                        (e[12] = t('div', { class: 'watermark-bg no-pointer-events' }, 'GET', -1)),
                      t('div', wt, [
                        t(
                          'h4',
                          yt,
                          a(i.$t('admin.testVoucherManagement.regulationsEnLabel')) + ': ',
                          1,
                        ),
                        t('div', mt, a(m.value), 1),
                        t('h4', xt, a(i.$t('admin.testVoucherManagement.regulationsThLabel')), 1),
                        t('div', pt, a(x.value), 1),
                      ]),
                    ]),
                  ]))
                : h('', !0),
            ],
            512,
          ),
        ])
      );
    },
  }),
  Nt = S(_t, [['__scopeId', 'data-v-02b33311']]);
export { Nt as T };
