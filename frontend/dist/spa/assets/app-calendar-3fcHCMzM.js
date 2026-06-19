import { Q as te } from './QResizeObserver-C4jaR1Qo.js';
import {
  O as ae,
  r as y,
  t as ne,
  A as le,
  Q as s,
  R as r,
  S as o,
  V as d,
  an as oe,
  W as se,
  a8 as b,
  bd as _,
  T as c,
  $ as re,
  a6 as h,
  a7 as D,
  X as p,
  a3 as M,
  a0 as ie,
  aC as V,
  U as H,
  Z as I,
  f as m,
  a2 as ce,
} from './index-CKSooU2k.js';
import { u as ue } from './vue-i18n-Bebkm_iB.js';
const de = { class: 'calendar-component' },
  me = { class: 'calendar-container' },
  ve = { key: 0, class: 'calendar-main-view' },
  ge = { class: 'calendar-header' },
  he = { class: 'month-title' },
  De = { class: 'month-subtitle' },
  fe = { class: 'calendar-grid' },
  _e = ['aria-label', 'onClick', 'onKeydown'],
  pe = { key: 0, class: 'calendar-footer-legend' },
  we = { class: 'legend-item' },
  Se = { class: 'legend-item' },
  ye = { key: 1, class: 'month-year-picker-view' },
  be = { class: 'picker-header row items-center justify-between q-px-sm q-py-xs' },
  Me = { class: 'text-subtitle2 text-weight-bold' },
  Te = { class: 'year-selector scroll-column' },
  Ye = ['aria-label', 'onClick', 'onKeydown'],
  ke = { class: 'month-grid q-pa-sm' },
  Fe = ['aria-label', 'onClick', 'onKeydown'],
  f = 543,
  xe = 100,
  $e = 42,
  Ne = ae({
    __name: 'app-calendar',
    props: {
      modelValue: {},
      showLegend: { type: Boolean, default: !1 },
      disablePastDates: { type: Boolean, default: !1 },
      minDate: {},
      maxDate: {},
    },
    emits: ['update:modelValue', 'change-month', 'click-date', 'main-card-resize'],
    setup(T, { emit: R }) {
      const Q = Array.from({ length: 7 }, (t, a) =>
          new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(2e3, 0, 3 + a)),
        ),
        z = Array.from({ length: 12 }, (t, a) =>
          new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(new Date(2e3, a, 1)),
        ),
        B = Array.from({ length: 12 }, (t, a) =>
          new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2e3, a, 1)),
        ),
        L = Array.from({ length: 12 }, (t, a) =>
          new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2e3, a, 1)),
        ),
        i = T,
        { t: Y } = ue(),
        v = R,
        g = y(!1),
        n = y(new Date()),
        k = y(F());
      function F() {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      }
      let x;
      const $ = () => {
        const t = new Date(),
          e = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1).getTime() - t.getTime();
        x = setTimeout(() => {
          ((k.value = F()), $());
        }, e + 1e3);
      };
      (ne(() => {
        $();
      }),
        le(() => {
          clearTimeout(x);
        }));
      const U = m(() => `${z[n.value.getMonth()]} ${n.value.getFullYear() + f}`),
        N = m(() => `${B[n.value.getMonth()]} ${n.value.getFullYear()}`),
        j = m(() => {
          let t = new Date().getFullYear();
          if (i.maxDate) {
            const e = new Date(i.maxDate);
            isNaN(e.getTime()) || (t = e.getFullYear());
          }
          const a = t + f;
          return Array.from({ length: xe + 1 }, (e, l) => a - l);
        }),
        q = m(() => {
          if (!i.maxDate) return !1;
          const t = new Date(i.maxDate);
          if (isNaN(t.getTime())) return !1;
          const a = t.getFullYear(),
            e = t.getMonth(),
            l = n.value.getMonth(),
            u = n.value.getFullYear();
          return u > a || (u === a && l >= e);
        }),
        w = (t) => {
          if (!i.maxDate) return !1;
          const a = new Date(i.maxDate);
          if (isNaN(a.getTime())) return !1;
          const e = a.getFullYear(),
            l = a.getMonth(),
            u = n.value.getFullYear();
          return u > e || (u === e && t > l);
        },
        A = m(() => {
          const t = new Date(n.value.getFullYear(), n.value.getMonth(), 1).getDay();
          return t === 0 ? 6 : t - 1;
        }),
        W = m(() => {
          const t = A.value + C.value.length;
          return $e - t;
        }),
        C = m(() => {
          const t = n.value.getFullYear(),
            a = n.value.getMonth(),
            e = new Date(t, a + 1, 0).getDate(),
            l = k.value;
          return Array.from({ length: e }, (u, Z) => {
            const K = Z + 1,
              S = `${t}-${String(a + 1).padStart(2, '0')}-${String(K).padStart(2, '0')}`,
              J = S === l,
              ee = S < l;
            return { value: K, isToday: J, isPast: ee, dateString: S };
          });
        }),
        G = () => {
          ((n.value = new Date(n.value.getFullYear(), n.value.getMonth() - 1, 1)),
            v('change-month', n.value.getMonth() + 1, n.value.getFullYear()));
        },
        X = () => {
          ((n.value = new Date(n.value.getFullYear(), n.value.getMonth() + 1, 1)),
            v('change-month', n.value.getMonth() + 1, n.value.getFullYear()));
        },
        E = (t) => {
          ((n.value = new Date(n.value.getFullYear(), t, 1)),
            v('change-month', t + 1, n.value.getFullYear()),
            (g.value = !1));
        },
        O = (t) => {
          ((n.value = new Date(t, n.value.getMonth(), 1)),
            v('change-month', n.value.getMonth() + 1, t));
        },
        P = (t) => {
          (i.disablePastDates && t.isPast) ||
            (i.minDate && t.dateString < i.minDate) ||
            (v('update:modelValue', t.dateString), v('click-date', t.dateString));
        };
      return (t, a) => (
        s(),
        r('div', de, [
          o('div', me, [
            d(
              oe,
              { class: 'calendar-card', flat: '' },
              {
                default: se(() => [
                  d(te, { onResize: a[0] || (a[0] = (e) => t.$emit('main-card-resize', e)) }),
                  g.value
                    ? (s(),
                      r('div', ye, [
                        o('div', be, [
                          o('div', Me, c(N.value), 1),
                          d(b, {
                            flat: '',
                            round: '',
                            dense: '',
                            icon: 'close',
                            size: 'sm',
                            onClick: a[3] || (a[3] = (e) => (g.value = !1)),
                          }),
                        ]),
                        d(I),
                        o('div', Te, [
                          (s(!0),
                          r(
                            h,
                            null,
                            D(
                              j.value,
                              (e) => (
                                s(),
                                r(
                                  'div',
                                  {
                                    key: e,
                                    class: M([
                                      'year-item',
                                      { active: n.value.getFullYear() === e - f },
                                    ]),
                                    role: 'button',
                                    tabindex: '0',
                                    'aria-label': `Select year ${e}`,
                                    onClick: (l) => O(e - f),
                                    onKeydown: _((l) => O(e - f), ['enter']),
                                  },
                                  c(e),
                                  43,
                                  Ye,
                                )
                              ),
                            ),
                            128,
                          )),
                        ]),
                        d(I),
                        o('div', ke, [
                          (s(!0),
                          r(
                            h,
                            null,
                            D(
                              p(L),
                              (e, l) => (
                                s(),
                                r(
                                  'div',
                                  {
                                    key: e,
                                    class: M([
                                      'month-item',
                                      { active: n.value.getMonth() === l, disabled: w(l) },
                                    ]),
                                    role: 'button',
                                    tabindex: '0',
                                    'aria-label': `Select month ${e}`,
                                    onClick: (u) => !w(l) && E(l),
                                    onKeydown: _((u) => !w(l) && E(l), ['enter']),
                                  },
                                  c(e),
                                  43,
                                  Fe,
                                )
                              ),
                            ),
                            128,
                          )),
                        ]),
                      ]))
                    : (s(),
                      r('div', ve, [
                        o('div', ge, [
                          d(b, {
                            flat: '',
                            round: '',
                            dense: '',
                            icon: 'chevron_left',
                            class: 'calendar-nav-btn',
                            onClick: G,
                          }),
                          o(
                            'div',
                            {
                              class: 'calendar-title cursor-pointer',
                              role: 'button',
                              tabindex: '0',
                              'aria-label': 'Select month and year',
                              onClick: a[1] || (a[1] = (e) => (g.value = !0)),
                              onKeydown: a[2] || (a[2] = _((e) => (g.value = !0), ['enter'])),
                            },
                            [
                              o('h2', he, [
                                o('span', null, c(U.value), 1),
                                d(re, { name: 'arrow_drop_down', class: 'dropdown-icon' }),
                              ]),
                              o('p', De, c(N.value), 1),
                            ],
                            32,
                          ),
                          d(
                            b,
                            {
                              flat: '',
                              round: '',
                              dense: '',
                              icon: 'chevron_right',
                              class: 'calendar-nav-btn',
                              disable: q.value,
                              onClick: X,
                            },
                            null,
                            8,
                            ['disable'],
                          ),
                        ]),
                        o('div', fe, [
                          (s(!0),
                          r(
                            h,
                            null,
                            D(p(Q), (e) => (s(), r('div', { class: 'weekday', key: e }, c(e), 1))),
                            128,
                          )),
                          (s(!0),
                          r(
                            h,
                            null,
                            D(
                              A.value,
                              (e) => (
                                s(),
                                r('div', { class: 'day-cell empty', key: 'empty-' + e })
                              ),
                            ),
                            128,
                          )),
                          (s(!0),
                          r(
                            h,
                            null,
                            D(
                              C.value,
                              (e) => (
                                s(),
                                r(
                                  'div',
                                  {
                                    key: e.dateString,
                                    class: M([
                                      'day-cell',
                                      {
                                        active: T.modelValue === e.dateString,
                                        today: e.isToday,
                                        disabled:
                                          (i.disablePastDates && e.isPast) ||
                                          (i.minDate && e.dateString < i.minDate) ||
                                          (i.maxDate && e.dateString > i.maxDate),
                                      },
                                    ]),
                                    role: 'button',
                                    tabindex: '0',
                                    'aria-label': `Select date ${e.dateString}`,
                                    onClick: (l) => P(e),
                                    onKeydown: _((l) => P(e), ['enter']),
                                  },
                                  [
                                    ie(c(e.value) + ' ', 1),
                                    V(t.$slots, 'day-content', { day: e }, void 0, !0),
                                  ],
                                  42,
                                  _e,
                                )
                              ),
                            ),
                            128,
                          )),
                          (s(!0),
                          r(
                            h,
                            null,
                            D(
                              W.value,
                              (e) => (
                                s(),
                                r('div', { key: 'trailing-' + e, class: 'day-cell empty' })
                              ),
                            ),
                            128,
                          )),
                        ]),
                        i.showLegend
                          ? (s(),
                            r('div', pe, [
                              o('div', we, [
                                a[4] ||
                                  (a[4] = o(
                                    'div',
                                    { class: 'legend-dot dot-available' },
                                    null,
                                    -1,
                                  )),
                                o('span', null, c(p(Y)('exam.calendar.legendAvailable')), 1),
                              ]),
                              o('div', Se, [
                                a[5] ||
                                  (a[5] = o('div', { class: 'legend-dot dot-full' }, null, -1)),
                                o('span', null, c(p(Y)('exam.calendar.legendFull')), 1),
                              ]),
                            ]))
                          : H('', !0),
                      ])),
                ]),
                _: 3,
              },
            ),
            g.value ? H('', !0) : V(t.$slots, 'footer', { key: 0 }, void 0, !0),
          ]),
        ])
      );
    },
  }),
  Oe = ce(Ne, [['__scopeId', 'data-v-2774e823']]);
export { Oe as A };
