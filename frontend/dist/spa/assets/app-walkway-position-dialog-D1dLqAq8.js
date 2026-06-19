import {
  c as ke,
  h as de,
  a as Re,
  f as w,
  aK as Pe,
  a_ as Fe,
  a8 as Le,
  m as Qe,
  aT as qe,
  O as X,
  Q as v,
  R as f,
  a6 as H,
  a7 as O,
  S as c,
  at as z,
  a3 as Q,
  T as R,
  a2 as K,
  aC as Ne,
  w as j,
  _ as te,
  au as Se,
  W as P,
  V as B,
  an as xe,
  $ as ae,
  az as ve,
  am as Ce,
  r as _,
  t as Ee,
  I as ye,
  o as Ue,
  U as ue,
  X as ce,
  a0 as je,
} from './index-CKSooU2k.js';
import { Q as Xe } from './QTooltip-BUG2ohUJ.js';
import { u as Ke } from './vue-i18n-Bebkm_iB.js';
import { A as ee } from './app-button-D_cMl4aM.js';
const Ye = ke({
    name: 'QBtnGroup',
    props: {
      unelevated: Boolean,
      outline: Boolean,
      flat: Boolean,
      rounded: Boolean,
      square: Boolean,
      push: Boolean,
      stretch: Boolean,
      glossy: Boolean,
      spread: Boolean,
    },
    setup(l, { slots: y }) {
      const o = w(() => {
        const k = [
          'unelevated',
          'outline',
          'flat',
          'rounded',
          'square',
          'push',
          'stretch',
          'glossy',
        ]
          .filter((p) => l[p])
          .map((p) => `q-btn-group--${p}`)
          .join(' ');
        return (
          `q-btn-group row no-wrap${k.length !== 0 ? ' ' + k : ''}` +
          (l.spread ? ' q-btn-group--spread' : ' inline')
        );
      });
      return () => de('div', { class: o.value }, Re(y.default));
    },
  }),
  Ht = ke({
    name: 'QBtnToggle',
    props: {
      ...Pe,
      modelValue: { required: !0 },
      options: {
        type: Array,
        required: !0,
        validator: (l) =>
          l.every((y) => ('label' in y || 'icon' in y || 'slot' in y) && 'value' in y),
      },
      color: String,
      textColor: String,
      toggleColor: { type: String, default: 'primary' },
      toggleTextColor: String,
      outline: Boolean,
      flat: Boolean,
      unelevated: Boolean,
      rounded: Boolean,
      push: Boolean,
      glossy: Boolean,
      size: String,
      padding: String,
      noCaps: Boolean,
      noWrap: Boolean,
      dense: Boolean,
      readonly: Boolean,
      disable: Boolean,
      stack: Boolean,
      stretch: Boolean,
      spread: Boolean,
      clearable: Boolean,
      ripple: { type: [Boolean, Object], default: !0 },
    },
    emits: ['update:modelValue', 'clear', 'click'],
    setup(l, { slots: y, emit: o }) {
      const k = w(() => l.options.find((i) => i.value === l.modelValue) !== void 0),
        p = w(() => ({ type: 'hidden', name: l.name, value: l.modelValue })),
        x = qe(p),
        C = w(() => Fe(l)),
        T = w(() => ({ rounded: l.rounded, dense: l.dense, ...C.value })),
        M = w(() =>
          l.options.map((i, n) => {
            const { attrs: V, value: A, slot: F, ...b } = i;
            return {
              slot: F,
              props: {
                key: n,
                'aria-pressed': A === l.modelValue ? 'true' : 'false',
                ...V,
                ...b,
                ...T.value,
                disable: l.disable || b.disable === !0,
                color: A === l.modelValue ? r(b, 'toggleColor') : r(b, 'color'),
                textColor: A === l.modelValue ? r(b, 'toggleTextColor') : r(b, 'textColor'),
                noCaps: r(b, 'noCaps') === !0,
                noWrap: r(b, 'noWrap') === !0,
                size: r(b, 'size'),
                padding: r(b, 'padding'),
                ripple: r(b, 'ripple'),
                stack: r(b, 'stack') === !0,
                stretch: r(b, 'stretch') === !0,
                onClick(W) {
                  g(A, i, W);
                },
              },
            };
          }),
        );
      function g(i, n, V) {
        l.readonly ||
          (l.modelValue === i
            ? l.clearable && (o('update:modelValue', null, null), o('clear'))
            : o('update:modelValue', i, n),
          o('click', V));
      }
      function r(i, n) {
        return i[n] === void 0 ? l[n] : i[n];
      }
      function m() {
        const i = M.value.map((n) => de(Le, n.props, n.slot !== void 0 ? y[n.slot] : void 0));
        return (l.name !== void 0 && !l.disable && k.value && x(i, 'push'), Qe(y.default, i));
      }
      return () =>
        de(
          Ye,
          {
            class: 'q-btn-toggle',
            ...C.value,
            rounded: l.rounded,
            stretch: l.stretch,
            glossy: l.glossy,
            spread: l.spread,
          },
          m,
        );
    },
  }),
  Je = { class: 'row items-center q-gutter-x-lg' },
  Ze = { class: 'text-body2 text-dark font-weight-medium' },
  Ie = X({
    __name: 'app-seat-legend',
    props: { items: {} },
    setup(l) {
      return (y, o) => (
        v(),
        f('div', Je, [
          (v(!0),
          f(
            H,
            null,
            O(
              l.items,
              (k, p) => (
                v(),
                f('div', { key: p, class: 'row items-center' }, [
                  c(
                    'div',
                    {
                      class: Q(['legend-dot q-mr-sm', k.dotClass]),
                      style: z({
                        backgroundColor: k.color,
                        border: k.border
                          ? `1px solid ${k.borderColor || 'var(--seat-available-border)'}`
                          : void 0,
                      }),
                    },
                    null,
                    6,
                  ),
                  c('span', Ze, R(k.label), 1),
                ])
              ),
            ),
            128,
          )),
        ])
      );
    },
  }),
  et = K(Ie, [['__scopeId', 'data-v-b54b20b1']]),
  tt = {
    key: 0,
    src: '/icons/seat-broken.svg',
    class: 'broken-icon',
    alt: '',
    'aria-hidden': 'true',
  },
  at = { key: 1 },
  lt = X({
    __name: 'app-exam-seat-square',
    props: { seatNumber: {}, status: { default: 'available' } },
    emits: ['click'],
    setup(l) {
      return (y, o) => (
        v(),
        f(
          'div',
          {
            class: Q([
              'seat-square cursor-pointer flex items-center justify-center text-subtitle2 text-weight-bold transition-fast',
              [
                l.status === 'assigned' ? 'assigned-bg border-assigned' : '',
                l.status === 'broken' ? 'broken-bg border-broken' : '',
                l.status === 'blocked' ? 'blocked-bg border-blocked' : '',
                l.status === 'available' ? 'available-bg text-dark' : '',
              ],
            ]),
            onClick: o[0] || (o[0] = (k) => y.$emit('click', l.seatNumber)),
          },
          [
            l.status === 'broken' ? (v(), f('img', tt)) : (v(), f('span', at, R(l.seatNumber), 1)),
            Ne(y.$slots, 'default', {}, void 0, !0),
          ],
          2,
        )
      );
    },
  }),
  ot = K(lt, [['__scopeId', 'data-v-4f9afff6']]),
  st = { class: 'seat-status-title' },
  nt = { class: 'seat-status-options' },
  it = ['onClick'],
  rt = X({
    __name: 'app-seat-status-dialog',
    props: {
      modelValue: { type: Boolean },
      targetLabel: {},
      currentStatus: { default: 'available' },
    },
    emits: ['update:modelValue', 'select'],
    setup(l, { emit: y }) {
      const o = l,
        k = y,
        p = _('available'),
        x = [
          {
            value: 'available',
            label: 'เปิดใช้ที่นั่ง',
            icon: 'event_seat',
            iconClass: 'seat-status-icon--available',
          },
          {
            value: 'omitted',
            label: 'ละเว้นที่นั่ง',
            icon: 'remove_circle',
            iconClass: 'seat-status-icon--omitted',
          },
          {
            value: 'broken',
            label: 'ที่นั่งชำรุด',
            icon: 'block',
            iconClass: 'seat-status-icon--broken',
          },
        ],
        C = w({ get: () => o.modelValue, set: (g) => k('update:modelValue', g) }),
        T = () => {
          C.value = !1;
        },
        M = (g) => {
          ((p.value = g), k('select', g), T());
        };
      return (
        j(
          () => o.modelValue,
          (g) => {
            g && (p.value = o.currentStatus);
          },
        ),
        j(
          () => o.currentStatus,
          (g) => {
            o.modelValue && (p.value = g);
          },
        ),
        (g, r) => (
          v(),
          te(
            Se,
            { modelValue: C.value, 'onUpdate:modelValue': r[1] || (r[1] = (m) => (C.value = m)) },
            {
              default: P(() => [
                B(
                  xe,
                  { class: 'seat-status-dialog-card' },
                  {
                    default: P(() => [
                      c(
                        'button',
                        {
                          class: 'seat-status-close',
                          type: 'button',
                          'aria-label': 'Close',
                          onPointerdown: r[0] || (r[0] = ve(() => {}, ['stop'])),
                          onClick: ve(T, ['stop']),
                        },
                        [B(ae, { name: 'close', size: '32px' })],
                        32,
                      ),
                      B(
                        Ce,
                        { class: 'seat-status-content' },
                        {
                          default: P(() => [
                            c('div', st, 'ระบุสถานะที่นั่งของ' + R(l.targetLabel), 1),
                            c('div', nt, [
                              (v(),
                              f(
                                H,
                                null,
                                O(x, (m) =>
                                  c(
                                    'button',
                                    {
                                      key: m.value,
                                      class: Q([
                                        'seat-status-option',
                                        [
                                          `seat-status-option--${m.value}`,
                                          { 'seat-status-option--selected': m.value === p.value },
                                        ],
                                      ]),
                                      type: 'button',
                                      onClick: (i) => M(m.value),
                                    },
                                    [
                                      B(ae, { name: m.icon, class: Q(m.iconClass) }, null, 8, [
                                        'name',
                                        'class',
                                      ]),
                                      c('span', null, R(m.label), 1),
                                    ],
                                    10,
                                    it,
                                  ),
                                ),
                                64,
                              )),
                            ]),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    _: 1,
                  },
                ),
              ]),
              _: 1,
            },
            8,
            ['modelValue'],
          )
        )
      );
    },
  }),
  ut = K(rt, [['__scopeId', 'data-v-a4b0d045']]),
  ct = { class: 'exam-seat-preview' },
  dt = { class: 'q-mb-xs' },
  vt = ['onClick'],
  pt = ['onClick'],
  gt = { key: 1, class: 'empty-preview' },
  mt = { key: 0, class: 'seat-preview-footer' },
  wt = X({
    __name: 'app-exam-seat-preview',
    props: {
      rows: { default: 0 },
      cols: { default: 0 },
      placeholderText: { default: 'จำนวนที่นั่งทั้งหมด' },
      splitLeftRight: { type: Boolean, default: !1 },
      walkwayPositions: { default: () => [] },
      numberingDirection: { default: 'vertical' },
      omittedSeats: { default: () => new Set() },
      showSeatGuides: { type: Boolean, default: !1 },
      showFooterHint: { type: Boolean, default: !1 },
    },
    setup(l, { expose: y }) {
      const o = l,
        k = 1 / 0,
        { t: p } = Ke(),
        x = _(null),
        C = _(null),
        T = _(0),
        M = _(0),
        g = w(() => o.rows ?? 0),
        r = w(() => o.cols ?? 0),
        m = [
          { label: 'ที่นั่งว่าง', dotClass: 'available' },
          { label: 'ละเว้นที่นั่ง', dotClass: 'omitted' },
          { label: 'ที่นั่งชำรุด', dotClass: 'broken' },
        ],
        i = w(() => {
          const e = g.value * r.value;
          return Math.min(e, k);
        }),
        n = _(!1),
        V = _(''),
        A = _(null),
        F = _('available'),
        b = _(new Set()),
        W = _(new Set()),
        $e = (e) => {
          ((V.value = `ที่นั่ง ${e}`),
            (A.value = { type: 'seat', seatId: e }),
            (F.value = Y(e)),
            (n.value = !0));
        },
        _e = (e) => {
          ((V.value = `คอลัมน์ ${e}`),
            (A.value = { type: 'column', index: e - 1 }),
            (F.value = ge()),
            (n.value = !0));
        },
        Be = (e) => {
          ((V.value = `แถว ${e + 1}`),
            (A.value = { type: 'row', index: e }),
            (F.value = ge()),
            (n.value = !0));
        },
        pe = () => {
          const e = A.value;
          return e
            ? e.type === 'seat'
              ? [e.seatId]
              : e.type === 'row'
                ? (J.value[e.index]?.map((t) => t.id) ?? [])
                : J.value.map((t) => t[e.index]?.id).filter((t) => typeof t == 'string')
            : [];
        },
        We = (e) => {
          const t = pe(),
            a = new Set(b.value),
            s = new Set(W.value);
          (t.forEach((u) => {
            (a.delete(u), s.delete(u), e === 'omitted' && a.add(u), e === 'broken' && s.add(u));
          }),
            (b.value = a),
            (W.value = s),
            (F.value = e));
        },
        Y = (e) => (b.value.has(e) ? 'omitted' : W.value.has(e) ? 'broken' : 'available'),
        ge = () => {
          const e = pe(),
            t = e[0];
          if (!t) return 'available';
          const a = Y(t);
          return e.every((u) => Y(u) === a) ? a : 'available';
        };
      y({
        brokenSeats: W,
        omittedSeats: b,
        setSeatStatusSets: (e) => {
          ((W.value = new Set(e.brokenSeats ?? [])), (b.value = new Set(e.omittedSeats ?? [])));
        },
        getSeatStatuses: () => {
          const e = {};
          return (
            J.value.forEach((t, a) => {
              t.forEach((s, u) => {
                const h = Y(s.id),
                  G = h === 'broken' ? 1 : h === 'omitted' ? 2 : 0;
                ((e[s.id] = G), (e[`${a + 1}-${u + 1}`] = G));
              });
            }),
            e
          );
        },
      });
      const Ge = (e) => (b.value.has(e) ? 'blocked' : W.value.has(e) ? 'broken' : 'available'),
        le = (e, t, a) => {
          const s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
            u = `${s[e] ?? e + 1}${t + 1}`,
            h = `${s[t] ?? t + 1}${e + 1}`;
          return a === 'horizontal' ? u : h;
        },
        me = (e, t, a) => {
          if (t === a) return new Set(e);
          const s = new Set();
          for (let u = 0; u < g.value; u++)
            for (let h = 0; h < r.value; h++) {
              const G = le(u, h, t);
              e.has(G) && s.add(le(u, h, a));
            }
          return s;
        },
        He = w(() => {
          const e = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return o.numberingDirection === 'horizontal'
            ? Array.from({ length: r.value }, (t, a) => `${a + 1}`)
            : Array.from({ length: r.value }, (t, a) => e[a] ?? `${a + 1}`);
        }),
        Ve = w(() => {
          const e = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return o.numberingDirection === 'horizontal'
            ? Array.from({ length: g.value }, (t, a) => e[a] ?? `${a + 1}`)
            : Array.from({ length: g.value }, (t, a) => `${a + 1}`);
        }),
        J = w(() => {
          const e = [],
            t = g.value,
            a = r.value;
          for (let s = 0; s < t; s++) {
            const u = [];
            for (let h = 0; h < a; h++) u.push({ id: le(s, h, o.numberingDirection) });
            e.push(u);
          }
          return e;
        }),
        we = w(() =>
          o.walkwayPositions.filter((e) => e.type === 'column').sort((e, t) => e.index - t.index),
        ),
        oe = w(() =>
          o.walkwayPositions.filter((e) => e.type === 'row').sort((e, t) => e.index - t.index),
        ),
        q = w(() => we.value.length > 0),
        N = w(() => oe.value.length > 0),
        he = (e) => `${e + 1}`,
        fe = (e) => `${e + 1}`,
        D = (e) => Number.parseFloat(e) || 0,
        d = w(() => {
          const e = Math.max(g.value, r.value),
            t = e > 18 && (q.value || N.value),
            a = e > 10 && (q.value || N.value),
            s = t ? '18px' : a ? '20px' : '18px';
          return e > 18
            ? {
                width: '40px',
                height: '40px',
                fontSize: '13px',
                rowGap: N.value ? '24px' : '8px',
                colGap: q.value ? '24px' : '12px',
                aisleWidth: q.value ? s : '10px',
                aisleHeight: N.value ? s : '10px',
                guideHeight: '22px',
                rowGuideWidth: '22px',
                rowWalkwayOffset: '34px',
                guideFontSize: '12px',
                walkwayFontSize: '14px',
              }
            : e > 10
              ? {
                  width: '52px',
                  height: '52px',
                  fontSize: '14px',
                  rowGap: N.value ? '28px' : '16px',
                  colGap: q.value ? '28px' : '18px',
                  aisleWidth: q.value ? s : '14px',
                  aisleHeight: N.value ? s : '14px',
                  guideHeight: '24px',
                  rowGuideWidth: '24px',
                  rowWalkwayOffset: '42px',
                  guideFontSize: '13px',
                  walkwayFontSize: '14px',
                }
              : {
                  width: '64px',
                  height: '64px',
                  fontSize: '16px',
                  rowGap: '36px',
                  colGap: '24px',
                  aisleWidth: s,
                  aisleHeight: s,
                  guideHeight: '26px',
                  rowGuideWidth: '26px',
                  rowWalkwayOffset: '50px',
                  guideFontSize: '14px',
                  walkwayFontSize: '14px',
                };
        }),
        ze = w(() => {
          const e = [
              o.showSeatGuides ? d.value.rowGuideWidth : '0px',
              ...Array.from({ length: r.value }, () => d.value.width),
            ],
            t = [
              o.showSeatGuides ? d.value.guideHeight : '0px',
              ...Array.from({ length: g.value }, () => d.value.height),
            ];
          return {
            display: 'grid',
            gridTemplateColumns: e.join(' '),
            gridTemplateRows: t.join(' '),
            columnGap: d.value.colGap,
            rowGap: d.value.rowGap,
            paddingRight: d.value.colGap,
            paddingBottom: d.value.rowGap,
          };
        }),
        be = w(() => {
          const e = o.showSeatGuides ? D(d.value.rowGuideWidth) : 0,
            t = o.showSeatGuides ? D(d.value.guideHeight) : 0,
            a = D(d.value.width),
            s = D(d.value.height),
            u = D(d.value.colGap),
            h = D(d.value.rowGap);
          return {
            bodyLeft: e + u,
            bodyTop: t + h,
            bodyWidth: r.value * a + Math.max(r.value - 1, 0) * u,
            bodyHeight: g.value * s + Math.max(g.value - 1, 0) * h,
            colGap: u,
            rowGap: h,
            seatWidth: a,
            seatHeight: s,
          };
        }),
        Te = (e) => {
          const t = be.value,
            a = D(d.value.aisleWidth),
            s = D(d.value.aisleHeight),
            u = t.bodyLeft + e * t.seatWidth + Math.max(e - 1, 0) * t.colGap + (t.colGap - a) / 2,
            G = oe.value
              .map((S) => {
                const $ =
                  S.index * t.seatHeight + Math.max(S.index - 1, 0) * t.rowGap + (t.rowGap - s) / 2;
                return { start: Math.max(0, $ - 4), end: Math.min(t.bodyHeight, $ + s + 4) };
              })
              .sort((S, $) => S.start - $.start)
              .reduce(
                (S, $) => {
                  const U = S[S.length - 1];
                  return (
                    U &&
                      ($.start > U.start && (U.end = Math.min(U.end, $.start)),
                      $.end < t.bodyHeight && S.push({ start: $.end, end: t.bodyHeight })),
                    S
                  );
                },
                [{ start: 0, end: t.bodyHeight }],
              ),
            L = G.reduce(
              (S, $) => ($.end - $.start > S.end - S.start ? $ : S),
              G[0] ?? { start: 0, end: t.bodyHeight },
            ),
            I = Math.max(8, Math.min(L.start + (L.end - L.start) / 2, t.bodyHeight - 8));
          return {
            position: 'absolute',
            left: `${u}px`,
            top: `${t.bodyTop}px`,
            width: d.value.aisleWidth,
            height: `${t.bodyHeight}px`,
            fontSize: d.value.walkwayFontSize,
            '--column-label-top': `${I}px`,
          };
        },
        Me = (e) => {
          const t = be.value,
            a = D(d.value.aisleHeight),
            s = t.bodyTop + e * t.seatHeight + Math.max(e - 1, 0) * t.rowGap + (t.rowGap - a) / 2;
          return {
            position: 'absolute',
            left: `${t.bodyLeft}px`,
            top: `${s}px`,
            width: `${t.bodyWidth}px`,
            height: d.value.aisleHeight,
            fontSize: d.value.walkwayFontSize,
          };
        },
        E = _(1),
        se = _(0),
        ne = _(0),
        Z = w(() => g.value > 20 || r.value > 20),
        ie = () => {
          if (!C.value || !x.value) {
            E.value = 1;
            return;
          }
          const e = C.value.style,
            t = e.transform,
            a = e.position,
            s = e.width,
            u = e.height;
          ((e.transform = 'none'),
            (e.position = 'static'),
            (e.width = 'max-content'),
            (e.height = 'auto'),
            C.value.offsetWidth);
          const h = C.value.scrollWidth,
            G = C.value.scrollHeight + 24;
          ((se.value = h),
            (ne.value = G),
            (e.transform = t),
            (e.position = a),
            (e.width = s),
            (e.height = u));
          const L = x.value,
            I = L.clientWidth - 16,
            S = L.clientHeight ? L.clientHeight - 8 : 99999;
          if (h <= 0 || G <= 0) {
            E.value = 1;
            return;
          }
          if (Z.value) {
            E.value = Math.min(I / h, 1);
            return;
          }
          const $ = I / h,
            U = S / G,
            Oe = Math.min($, U, 1);
          E.value = Math.max(0.15, Oe);
        },
        Ae = w(() => {
          const e = E.value,
            t = se.value,
            a = ne.value;
          return Z.value
            ? {
                width: '100%',
                height: `${a * e}px`,
                position: 'relative',
                overflow: 'visible',
                display: 'flex',
                justifyContent: 'center',
              }
            : e >= 1 || t <= 0 || a <= 0
              ? { width: '100%', display: 'flex', justifyContent: 'center' }
              : {
                  width: `${T.value - 16}px`,
                  height: `${a * e}px`,
                  position: 'relative',
                  overflow: 'visible',
                };
        }),
        De = w(() => {
          const e = E.value,
            t = se.value,
            a = ne.value;
          return Z.value
            ? {
                transform: `translateX(-50%) scale(${e})`,
                transformOrigin: 'top center',
                position: 'absolute',
                left: '50%',
                top: '0',
                width: `${t}px`,
                height: `${a}px`,
              }
            : e >= 1 || t <= 0 || a <= 0
              ? { transform: 'none', width: 'max-content' }
              : {
                  transform: `translateX(-50%) scale(${e})`,
                  transformOrigin: 'top center',
                  position: 'absolute',
                  left: '50%',
                  top: '0',
                  width: `${t}px`,
                  height: `${a}px`,
                };
        });
      let re = null;
      return (
        Ee(() => {
          (x.value &&
            ((re = new ResizeObserver(() => {
              ((T.value = x.value?.clientWidth ?? 0), (M.value = x.value?.clientHeight ?? 0), ie());
            })),
            re.observe(x.value)),
            ye(() => ie()));
        }),
        Ue(() => {
          re?.disconnect();
        }),
        j(
          [g, r, () => o.splitLeftRight, () => o.numberingDirection, () => o.walkwayPositions],
          () => {
            ye(() => ie());
          },
        ),
        j(
          () => o.numberingDirection,
          (e, t) => {
            !t || e === t || ((W.value = me(W.value, t, e)), (b.value = me(b.value, t, e)));
          },
        ),
        j(
          () => o.omittedSeats,
          (e) => {
            b.value = new Set(e);
          },
          { immediate: !0 },
        ),
        (e, t) => (
          v(),
          f('div', ct, [
            c('div', dt, [B(et, { items: m })]),
            t[3] ||
              (t[3] = c(
                'div',
                { class: 'teacher-desk-divider q-mb-sm' },
                [
                  c('div', { class: 'teacher-line' }),
                  c(
                    'div',
                    { class: 'q-px-md rounded-borders teacher-desk-label' },
                    " Teacher's Desk & Projector Screen ",
                  ),
                  c('div', { class: 'teacher-line' }),
                ],
                -1,
              )),
            c(
              'div',
              {
                ref_key: 'containerRef',
                ref: x,
                class: Q(['seat-preview-content', { 'seat-preview-content--scroll': Z.value }]),
              },
              [
                i.value > 0
                  ? (v(),
                    f(
                      'div',
                      { key: 0, class: 'seat-grid-scaling-wrapper', style: z(Ae.value) },
                      [
                        c(
                          'div',
                          {
                            ref_key: 'gridRef',
                            ref: C,
                            class: 'seat-grid-scalable',
                            style: z(De.value),
                          },
                          [
                            c(
                              'div',
                              { class: 'seat-grid-wrapper', style: z(ze.value) },
                              [
                                o.showSeatGuides && r.value > 0
                                  ? (v(),
                                    f(
                                      H,
                                      { key: 0 },
                                      [
                                        c(
                                          'div',
                                          {
                                            class: 'seat-row-guide-spacer',
                                            style: z({
                                              gridColumn: '1',
                                              gridRow: '1',
                                              width: d.value.rowGuideWidth,
                                            }),
                                          },
                                          null,
                                          4,
                                        ),
                                        (v(!0),
                                        f(
                                          H,
                                          null,
                                          O(
                                            r.value,
                                            (a) => (
                                              v(),
                                              f(
                                                'button',
                                                {
                                                  key: `col-guide-${a}`,
                                                  class: 'seat-column-guide',
                                                  type: 'button',
                                                  style: z({
                                                    gridColumn: he(a),
                                                    gridRow: '1',
                                                    width: d.value.width,
                                                  }),
                                                  onClick: (s) => _e(a),
                                                },
                                                R(He.value[a - 1]),
                                                13,
                                                vt,
                                              )
                                            ),
                                          ),
                                          128,
                                        )),
                                      ],
                                      64,
                                    ))
                                  : ue('', !0),
                                (v(!0),
                                f(
                                  H,
                                  null,
                                  O(
                                    J.value,
                                    (a, s) => (
                                      v(),
                                      f(
                                        H,
                                        { key: `row-${s}` },
                                        [
                                          o.showSeatGuides
                                            ? (v(),
                                              f(
                                                'button',
                                                {
                                                  key: 0,
                                                  class: 'seat-row-guide',
                                                  type: 'button',
                                                  style: z({
                                                    gridColumn: '1',
                                                    gridRow: fe(s + 1),
                                                    width: d.value.rowGuideWidth,
                                                    height: d.value.height,
                                                    fontSize: d.value.guideFontSize,
                                                  }),
                                                  onClick: (u) => Be(s),
                                                },
                                                R(Ve.value[s]),
                                                13,
                                                pt,
                                              ))
                                            : ue('', !0),
                                          (v(!0),
                                          f(
                                            H,
                                            null,
                                            O(
                                              a,
                                              (u, h) => (
                                                v(),
                                                f(
                                                  'div',
                                                  {
                                                    key: u.id,
                                                    class: 'seat-item',
                                                    style: z({
                                                      gridColumn: he(h + 1),
                                                      gridRow: fe(s + 1),
                                                      width: d.value.width,
                                                      height: d.value.height,
                                                      fontSize: d.value.fontSize,
                                                    }),
                                                  },
                                                  [
                                                    B(
                                                      ot,
                                                      {
                                                        'seat-number': u.id,
                                                        status: Ge(u.id),
                                                        onClick: $e,
                                                      },
                                                      {
                                                        default: P(() => [
                                                          B(
                                                            Xe,
                                                            {
                                                              anchor: 'top middle',
                                                              self: 'bottom middle',
                                                              class: 'seat-tooltip text-body2',
                                                            },
                                                            {
                                                              default: P(() => [
                                                                je(
                                                                  R(
                                                                    W.value.has(u.id)
                                                                      ? ce(p)(
                                                                          'admin.locationManagement.seatTooltip.markAvailable',
                                                                        )
                                                                      : ce(p)(
                                                                          'admin.locationManagement.seatTooltip.markBroken',
                                                                        ),
                                                                  ),
                                                                  1,
                                                                ),
                                                              ]),
                                                              _: 2,
                                                            },
                                                            1024,
                                                          ),
                                                        ]),
                                                        _: 2,
                                                      },
                                                      1032,
                                                      ['seat-number', 'status'],
                                                    ),
                                                  ],
                                                  4,
                                                )
                                              ),
                                            ),
                                            128,
                                          )),
                                        ],
                                        64,
                                      )
                                    ),
                                  ),
                                  128,
                                )),
                                (v(!0),
                                f(
                                  H,
                                  null,
                                  O(
                                    we.value,
                                    (a) => (
                                      v(),
                                      f(
                                        'div',
                                        {
                                          key: `column-walkway-${a.index}`,
                                          class: 'seat-column-walkway',
                                          style: z(Te(a.index)),
                                        },
                                        [...(t[1] || (t[1] = [c('span', null, 'ทางเดิน', -1)]))],
                                        4,
                                      )
                                    ),
                                  ),
                                  128,
                                )),
                                (v(!0),
                                f(
                                  H,
                                  null,
                                  O(
                                    oe.value,
                                    (a) => (
                                      v(),
                                      f(
                                        'div',
                                        {
                                          key: `row-walkway-${a.index}`,
                                          class: 'seat-row-walkway',
                                          style: z(Me(a.index)),
                                        },
                                        [...(t[2] || (t[2] = [c('span', null, 'ทางเดิน', -1)]))],
                                        4,
                                      )
                                    ),
                                  ),
                                  128,
                                )),
                              ],
                              4,
                            ),
                          ],
                          4,
                        ),
                      ],
                      4,
                    ))
                  : (v(), f('div', gt)),
              ],
              2,
            ),
            o.showFooterHint
              ? (v(),
                f('div', mt, [
                  B(ae, { name: 'info_outline', size: '18px', color: 'dark' }),
                  c('span', null, R(ce(p)('admin.locationManagement.createPage.previewHint')), 1),
                ]))
              : ue('', !0),
            B(
              ut,
              {
                modelValue: n.value,
                'onUpdate:modelValue': t[0] || (t[0] = (a) => (n.value = a)),
                'target-label': V.value,
                'current-status': F.value,
                onSelect: We,
              },
              null,
              8,
              ['modelValue', 'target-label', 'current-status'],
            ),
          ])
        )
      );
    },
  }),
  Vt = K(wt, [['__scopeId', 'data-v-f2afb0c7']]),
  ht = { class: 'walkway-picker' },
  ft = { class: 'walkway-picker-section' },
  bt = { class: 'walkway-option-grid walkway-option-grid--rows' },
  yt = { class: 'walkway-picker-section' },
  kt = { class: 'walkway-option-grid walkway-option-grid--cols' },
  St = { class: 'walkway-actions' },
  xt = X({
    __name: 'app-walkway-position-dialog',
    props: {
      modelValue: { type: Boolean },
      rows: { default: 0 },
      cols: { default: 0 },
      numberingDirection: { default: 'vertical' },
      selectedPositions: { default: () => [] },
    },
    emits: ['update:modelValue', 'confirm'],
    setup(l, { emit: y }) {
      const o = l,
        k = y,
        p = _([]),
        x = w({ get: () => o.modelValue, set: (m) => k('update:modelValue', m) }),
        C = w(() => {
          const m = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return Array.from({ length: Math.max(o.rows, 0) }, (i, n) => ({
            label: `แถว ${o.numberingDirection === 'horizontal' ? (m[n] ?? n + 1) : n + 1}`,
            value: `row-${n + 1}`,
          }));
        }),
        T = w(() => {
          const m = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return Array.from({ length: Math.max(o.cols, 0) }, (i, n) => ({
            label: `คอลัมน์ที่ ${o.numberingDirection === 'horizontal' ? n + 1 : (m[n] ?? n + 1)}`,
            value: `col-${n + 1}`,
          }));
        }),
        M = () => {
          x.value = !1;
        },
        g = (m) => {
          if (p.value.includes(m)) {
            p.value = p.value.filter((i) => i !== m);
            return;
          }
          p.value = [...p.value, m];
        },
        r = () => {
          (k('confirm', p.value), M());
        };
      return (
        j(
          () => o.modelValue,
          (m) => {
            m && (p.value = [...o.selectedPositions]);
          },
        ),
        (m, i) => (
          v(),
          te(
            Se,
            { modelValue: x.value, 'onUpdate:modelValue': i[0] || (i[0] = (n) => (x.value = n)) },
            {
              default: P(() => [
                B(
                  xe,
                  { class: 'walkway-dialog-card' },
                  {
                    default: P(() => [
                      c(
                        'button',
                        {
                          class: 'walkway-dialog-close',
                          type: 'button',
                          'aria-label': 'Close',
                          onClick: ve(M, ['stop']),
                        },
                        [B(ae, { name: 'close', size: '28px' })],
                      ),
                      B(
                        Ce,
                        { class: 'walkway-dialog-content' },
                        {
                          default: P(() => [
                            i[4] ||
                              (i[4] = c(
                                'div',
                                { class: 'walkway-dialog-title' },
                                'ระบุตำแหน่งทางเดิน',
                                -1,
                              )),
                            i[5] ||
                              (i[5] = c(
                                'div',
                                { class: 'walkway-dialog-subtitle' },
                                ' เลือกตำแหน่งที่ต้องการเพิ่มทางเดิน (แทรกหลังแถว/คอลัมน์) ',
                                -1,
                              )),
                            c('div', ht, [
                              c('section', ft, [
                                i[1] ||
                                  (i[1] = c('div', { class: 'walkway-picker-heading' }, 'แถว', -1)),
                                c('div', bt, [
                                  (v(!0),
                                  f(
                                    H,
                                    null,
                                    O(
                                      C.value,
                                      (n) => (
                                        v(),
                                        te(
                                          ee,
                                          {
                                            key: n.value,
                                            outline: '',
                                            'no-caps': '',
                                            color: 'grey-5',
                                            class: Q([
                                              'walkway-option-btn',
                                              {
                                                'walkway-option-btn--selected': p.value.includes(
                                                  n.value,
                                                ),
                                              },
                                            ]),
                                            label: n.label,
                                            onClick: (V) => g(n.value),
                                          },
                                          null,
                                          8,
                                          ['class', 'label', 'onClick'],
                                        )
                                      ),
                                    ),
                                    128,
                                  )),
                                ]),
                              ]),
                              i[3] || (i[3] = c('div', { class: 'walkway-divider' }, null, -1)),
                              c('section', yt, [
                                i[2] ||
                                  (i[2] = c(
                                    'div',
                                    { class: 'walkway-picker-heading' },
                                    'คอลัมน์',
                                    -1,
                                  )),
                                c('div', kt, [
                                  (v(!0),
                                  f(
                                    H,
                                    null,
                                    O(
                                      T.value,
                                      (n) => (
                                        v(),
                                        te(
                                          ee,
                                          {
                                            key: n.value,
                                            outline: '',
                                            'no-caps': '',
                                            color: 'grey-5',
                                            class: Q([
                                              'walkway-option-btn',
                                              {
                                                'walkway-option-btn--selected': p.value.includes(
                                                  n.value,
                                                ),
                                              },
                                            ]),
                                            label: n.label,
                                            onClick: (V) => g(n.value),
                                          },
                                          null,
                                          8,
                                          ['class', 'label', 'onClick'],
                                        )
                                      ),
                                    ),
                                    128,
                                  )),
                                ]),
                              ]),
                            ]),
                            c('div', St, [
                              B(ee, {
                                label: 'ยกเลิก',
                                'no-caps': '',
                                class: 'walkway-action-btn cancel-btn',
                                onClick: M,
                              }),
                              B(ee, {
                                label: 'ยืนยัน',
                                'no-caps': '',
                                color: 'primary',
                                class: 'walkway-action-btn',
                                onClick: r,
                              }),
                            ]),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    _: 1,
                  },
                ),
              ]),
              _: 1,
            },
            8,
            ['modelValue'],
          )
        )
      );
    },
  }),
  zt = K(xt, [['__scopeId', 'data-v-57ba3ae7']]);
export { Vt as A, Ht as Q, zt as a };
