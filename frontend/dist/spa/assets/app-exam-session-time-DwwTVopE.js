import {
  O as ye,
  Q as w,
  R as P,
  S as r,
  T as b,
  V as le,
  $ as D,
  a3 as be,
  _ as M,
  Z as J,
  U as O,
  r as x,
  f as v,
  a2 as Ce,
  i as Ne,
  e as ie,
  b9 as Te,
  g as xe,
  o as Se,
  t as Oe,
  J as We,
  as as ze,
  h as S,
  m as Ke,
  ba as je,
  bb as Ue,
  af as He,
  c as qe,
  bc as se,
  F as ge,
  w as Z,
  b5 as Ge,
  b6 as Xe,
  a as Je,
  p as Ze,
  W as Ye,
  a7 as et,
  a6 as tt,
} from './index-CKSooU2k.js';
import { b as at, r as nt } from './QSelect-CcXwe87O.js';
import { Q as ot } from './QResizeObserver-C4jaR1Qo.js';
const lt = { class: 'app-exam-info-card buu-card q-pa-lg' },
  it = { class: 'card-content row items-center no-wrap' },
  st = { class: 'col' },
  ct = { class: 'exam-title text-h5 text-weight-bold q-mb-md q-ma-none' },
  rt = { class: 'row items-center q-gutter-x-xl details-row' },
  ut = { class: 'info-item row items-center' },
  dt = { class: 'info-item row items-center' },
  ft = { key: 1 },
  vt = { key: 0, class: 'col-auto row no-wrap items-center justify-end stats-section' },
  mt = { class: 'count-block text-center' },
  ht = { class: 'applicant-label text-grey-7' },
  bt = { class: 'applicant-value text-weight-medium text-dark' },
  gt = { key: 2, class: 'count-block text-center' },
  wt = { class: 'applicant-label text-grey-7' },
  yt = { class: 'applicant-value text-weight-medium text-dark' },
  Ct = { key: 1, class: 'col-auto row no-wrap items-center stats-section' },
  Tt = { class: 'count-block text-center' },
  xt = { class: 'applicant-label text-grey-7' },
  St = { class: 'applicant-value text-weight-medium text-dark' },
  qt = { key: 2, class: 'col-auto row no-wrap items-center stats-section' },
  kt = { class: 'count-block text-center' },
  _t = { class: 'applicant-label text-grey-7' },
  It = { class: 'applicant-value text-weight-medium text-dark' },
  pt = { key: 3, class: 'col-auto text-right self-start' },
  $t = { class: 'applicant-label text-grey-7 text-caption' },
  At = { class: 'applicant-value text-h4 text-weight-bold text-dark' },
  Lt = ye({
    __name: 'app-exam-info-card',
    props: {
      title: {},
      date: {},
      time: {},
      location: {},
      selectedLocationId: { default: null },
      locationOptions: { default: () => [] },
      applicantCount: {},
      isAdmin: { type: Boolean, default: !1 },
      isAttendance: { type: Boolean, default: !1 },
      isScore: { type: Boolean, default: !1 },
      paidCount: {},
      totalCapacity: {},
      hidePaid: { type: Boolean, default: !1 },
      hideMainSeparator: { type: Boolean, default: !1 },
      countWithCapacity: { type: Boolean, default: !1 },
    },
    emits: ['update:selectedLocationId'],
    setup(e) {
      const y = e,
        f = x(!1),
        g = v(() => {
          const n = y.title.replace(/\s*\([^)]*\)\s*$/u, '').trim();
          return n.replace(/\s+(?:รอบ(?:ที่)?\s*)?\d+\/\d{4}\s*$/u, '').trim() || n || y.title;
        });
      return (n, c) => (
        w(),
        P('div', lt, [
          r('div', it, [
            r('header', st, [
              r('h2', ct, b(g.value), 1),
              r('section', rt, [
                r('div', ut, [
                  le(D, { name: 'event', size: '20px', class: 'q-mr-sm' }),
                  r('span', null, b(e.date), 1),
                ]),
                r('div', dt, [
                  le(D, { name: 'schedule', size: '20px', class: 'q-mr-sm' }),
                  r('span', null, b(e.time), 1),
                ]),
                r(
                  'div',
                  {
                    class: be([
                      'info-item row items-center',
                      { 'location-select-item': e.locationOptions.length > 0 },
                    ]),
                  },
                  [
                    le(D, { name: 'location_on', size: '20px', class: 'q-mr-sm' }),
                    e.locationOptions.length > 0
                      ? (w(),
                        M(
                          at,
                          {
                            key: 0,
                            'model-value': e.selectedLocationId,
                            options: e.locationOptions,
                            'emit-value': '',
                            'map-options': '',
                            outlined: '',
                            dense: '',
                            'dropdown-icon': 'keyboard_arrow_down',
                            'popup-content-class': 'seat-room-menu',
                            class: be(['location-select', { 'location-select--open': f.value }]),
                            onPopupShow: c[0] || (c[0] = (m) => (f.value = !0)),
                            onPopupHide: c[1] || (c[1] = (m) => (f.value = !1)),
                            'onUpdate:modelValue':
                              c[2] || (c[2] = (m) => n.$emit('update:selectedLocationId', m)),
                          },
                          null,
                          8,
                          ['model-value', 'options', 'class'],
                        ))
                      : (w(), P('span', ft, b(e.location), 1)),
                  ],
                  2,
                ),
              ]),
            ]),
            e.isAdmin && !e.isAttendance && !e.isScore
              ? (w(),
                P('section', vt, [
                  e.hideMainSeparator
                    ? O('', !0)
                    : (w(), M(J, { key: 0, vertical: '', class: 'stat-divider q-mr-md gt-xs' })),
                  r('div', mt, [
                    r('div', ht, b(n.$t('components.examInfoCard.registeredCount')), 1),
                    r(
                      'div',
                      bt,
                      b(
                        e.countWithCapacity
                          ? `${e.applicantCount}/${e.totalCapacity}`
                          : e.applicantCount,
                      ),
                      1,
                    ),
                  ]),
                  e.hidePaid
                    ? O('', !0)
                    : (w(), M(J, { key: 1, vertical: '', class: 'stat-divider q-mx-sm' })),
                  e.hidePaid
                    ? O('', !0)
                    : (w(),
                      P('div', gt, [
                        r('div', wt, b(n.$t('components.examInfoCard.paidCount')), 1),
                        r('div', yt, b(e.paidCount) + '/' + b(e.totalCapacity), 1),
                      ])),
                ]))
              : e.isAdmin && e.isScore
                ? (w(),
                  P('section', Ct, [
                    e.hideMainSeparator
                      ? O('', !0)
                      : (w(), M(J, { key: 0, vertical: '', class: 'stat-divider q-mr-md gt-xs' })),
                    r('div', Tt, [
                      r('div', xt, b(n.$t('components.examInfoCard.examTakerCount')), 1),
                      r('div', St, b(e.applicantCount), 1),
                    ]),
                  ]))
                : e.isAdmin && e.isAttendance
                  ? (w(),
                    P('section', qt, [
                      e.hideMainSeparator
                        ? O('', !0)
                        : (w(),
                          M(J, { key: 0, vertical: '', class: 'stat-divider q-mr-md gt-xs' })),
                      r('div', kt, [
                        r('div', _t, b(n.$t('components.examInfoCard.attendedCount')), 1),
                        r('div', It, b(e.applicantCount) + '/' + b(e.totalCapacity), 1),
                      ]),
                    ]))
                  : e.applicantCount !== void 0
                    ? (w(),
                      P('section', pt, [
                        r('div', $t, b(n.$t('components.examInfoCard.candidateCount')), 1),
                        r('div', At, b(e.applicantCount), 1),
                      ]))
                    : O('', !0),
          ]),
        ])
      );
    },
  }),
  zt = Ce(Lt, [['__scopeId', 'data-v-81313e79']]);
let Bt = 0;
const Pt = ['click', 'keydown'],
  Rt = {
    icon: String,
    label: [Number, String],
    alert: [Boolean, String],
    alertIcon: String,
    name: { type: [Number, String], default: () => `t_${Bt++}` },
    noCaps: Boolean,
    tabindex: [String, Number],
    disable: Boolean,
    contentClass: String,
    ripple: { type: [Boolean, Object], default: !0 },
  };
function Mt(e, y, f, g) {
  const n = Ne(Te, ie);
  if (n === ie) return (console.error('QTab/QRouteTab component needs to be child of QTabs'), ie);
  const { proxy: c } = xe(),
    m = x(null),
    h = x(null),
    K = x(null),
    Y = v(() =>
      e.disable || e.ripple === !1
        ? !1
        : { keyCodes: [13, 32], early: !0, ...(e.ripple === !0 ? {} : e.ripple) },
    ),
    E = v(() => n.currentModel.value === e.name),
    ee = v(
      () =>
        'q-tab relative-position self-stretch flex flex-center text-center' +
        (E.value
          ? ' q-tab--active' +
            (n.tabProps.value.activeClass ? ' ' + n.tabProps.value.activeClass : '') +
            (n.tabProps.value.activeColor ? ` text-${n.tabProps.value.activeColor}` : '') +
            (n.tabProps.value.activeBgColor ? ` bg-${n.tabProps.value.activeBgColor}` : '')
          : ' q-tab--inactive') +
        (e.icon && e.label && !n.tabProps.value.inlineLabel ? ' q-tab--full' : '') +
        (e.noCaps || n.tabProps.value.noCaps ? ' q-tab--no-caps' : '') +
        (e.disable ? ' disabled' : ' q-focusable q-hoverable cursor-pointer'),
    ),
    $ = v(
      () =>
        'q-tab__content self-stretch flex-center relative-position q-anchor--skip non-selectable ' +
        (n.tabProps.value.inlineLabel ? 'row no-wrap q-tab__content--inline' : 'column') +
        (e.contentClass !== void 0 ? ` ${e.contentClass}` : ''),
    ),
    q = v(() =>
      e.disable || n.hasFocus.value || (!E.value && n.hasActiveTab.value) ? -1 : e.tabindex || 0,
    );
  function k(i, T) {
    if ((!T && !i?.qAvoidFocus && m.value?.focus(), !e.disable)) {
      (n.updateModel({ name: e.name }), f('click', i));
      return;
    }
  }
  function A(i) {
    (je(i, [13, 32])
      ? k(i, !0)
      : !Ue(i) &&
        i.keyCode >= 35 &&
        i.keyCode <= 40 &&
        !i.altKey &&
        !i.metaKey &&
        n.onKbdNavigate(i.keyCode, c.$el) &&
        He(i),
      f('keydown', i));
  }
  function W() {
    const i = n.tabProps.value.narrowIndicator,
      T = [],
      I = S('div', { ref: K, class: ['q-tab__indicator', n.tabProps.value.indicatorClass] });
    (e.icon !== void 0 && T.push(S(D, { class: 'q-tab__icon', name: e.icon })),
      e.label !== void 0 && T.push(S('div', { class: 'q-tab__label' }, e.label)),
      e.alert &&
        T.push(
          e.alertIcon !== void 0
            ? S(D, {
                class: 'q-tab__alert-icon',
                color: e.alert !== !0 ? e.alert : void 0,
                name: e.alertIcon,
              })
            : S('div', { class: 'q-tab__alert' + (e.alert !== !0 ? ` text-${e.alert}` : '') }),
        ),
      i && T.push(I));
    const _ = [
      S('div', { class: 'q-focus-helper', tabindex: -1, ref: m }),
      S('div', { class: $.value }, Ke(y.default, T)),
    ];
    return (i || _.push(I), _);
  }
  const V = { name: v(() => e.name), rootRef: h, tabIndicatorRef: K, routeData: g };
  (Se(() => {
    n.unregisterTab(V);
  }),
    Oe(() => {
      n.registerTab(V);
    }));
  function j(i, T) {
    const I = {
      ref: h,
      class: ee.value,
      tabindex: q.value,
      role: 'tab',
      'aria-selected': E.value ? 'true' : 'false',
      'aria-disabled': e.disable ? 'true' : void 0,
      onClick: k,
      onKeydown: A,
      ...T,
    };
    return We(S(i, I, W()), [[ze, Y.value]]);
  }
  return { renderTab: j, $tabs: n };
}
const Dt = qe({
  name: 'QTab',
  props: Rt,
  emits: Pt,
  setup(e, { slots: y, emit: f }) {
    const { renderTab: g } = Mt(e, y, f);
    return () => g('div');
  },
});
function Et(e, y, f) {
  const g = f ? ['left', 'right'] : ['top', 'bottom'];
  return `absolute-${y ? g[0] : g[1]}${e ? ` text-${e}` : ''}`;
}
function we(e, y) {
  for (const f in e) if (e[f] !== y[f]) return !1;
  return !0;
}
const Vt = ['left', 'center', 'right', 'justify'],
  Qt = qe({
    name: 'QTabs',
    props: {
      modelValue: [Number, String],
      align: { type: String, default: 'center', validator: (e) => Vt.includes(e) },
      breakpoint: { type: [String, Number], default: 600 },
      vertical: Boolean,
      shrink: Boolean,
      stretch: Boolean,
      activeClass: String,
      activeColor: String,
      activeBgColor: String,
      indicatorColor: String,
      leftIcon: String,
      rightIcon: String,
      outsideArrows: Boolean,
      mobileArrows: Boolean,
      switchIndicator: Boolean,
      narrowIndicator: Boolean,
      inlineLabel: Boolean,
      noCaps: Boolean,
      dense: Boolean,
      contentClass: String,
      'onUpdate:modelValue': [Function, Array],
    },
    setup(e, { slots: y, emit: f }) {
      const { proxy: g } = xe(),
        { $q: n } = g,
        { registerTick: c } = se(),
        { registerTick: m } = se(),
        { registerTick: h } = se(),
        { registerTimeout: K, removeTimeout: Y } = ge(),
        { registerTimeout: E, removeTimeout: ee } = ge(),
        $ = x(null),
        q = x(null),
        k = x(e.modelValue),
        A = x(!1),
        W = x(!0),
        V = x(!1),
        j = x(!1),
        i = [],
        T = x(0),
        I = x(!1);
      let _ = null,
        Q = null,
        R;
      const ke = v(() => ({
          activeClass: e.activeClass,
          activeColor: e.activeColor,
          activeBgColor: e.activeBgColor,
          indicatorClass: Et(e.indicatorColor, e.switchIndicator, e.vertical),
          narrowIndicator: e.narrowIndicator,
          inlineLabel: e.inlineLabel,
          noCaps: e.noCaps,
        })),
        _e = v(() => {
          const t = T.value,
            a = k.value;
          for (let o = 0; o < t; o++) if (i[o].name.value === a) return !0;
          return !1;
        }),
        Ie = v(() => `q-tabs__content--align-${A.value ? 'left' : j.value ? 'justify' : e.align}`),
        pe = v(
          () =>
            `q-tabs row no-wrap items-center q-tabs--${A.value ? '' : 'not-'}scrollable q-tabs--${e.vertical ? 'vertical' : 'horizontal'} q-tabs__arrows--${e.outsideArrows ? 'outside' : 'inside'} q-tabs--mobile-with${e.mobileArrows ? '' : 'out'}-arrows` +
            (e.dense ? ' q-tabs--dense' : '') +
            (e.shrink ? ' col-shrink' : '') +
            (e.stretch ? ' self-stretch' : ''),
        ),
        $e = v(
          () =>
            'q-tabs__content scroll--mobile row no-wrap items-center self-stretch hide-scrollbar relative-position ' +
            Ie.value +
            (e.contentClass !== void 0 ? ` ${e.contentClass}` : ''),
        ),
        U = v(() =>
          e.vertical
            ? { container: 'height', content: 'offsetHeight', scroll: 'scrollHeight' }
            : { container: 'width', content: 'offsetWidth', scroll: 'scrollWidth' },
        ),
        H = v(() => !e.vertical && n.lang.rtl === !0),
        te = v(() => !nt && H.value);
      (Z(H, N),
        Z(
          () => e.modelValue,
          (t) => {
            ae({ name: t, setCurrent: !0, skipEmit: !0 });
          },
        ),
        Z(() => e.outsideArrows, G));
      function ae({ name: t, setCurrent: a, skipEmit: o }) {
        k.value !== t &&
          (!o && e['onUpdate:modelValue'] !== void 0 && f('update:modelValue', t),
          (a || e['onUpdate:modelValue'] === void 0) && (Ae(k.value, t), (k.value = t)));
      }
      function G() {
        c(() => {
          $.value && ce({ width: $.value.offsetWidth, height: $.value.offsetHeight });
        });
      }
      function ce(t) {
        if (U.value === void 0 || q.value === null) return;
        const a = t[U.value.container],
          o = Math.min(
            q.value[U.value.scroll],
            Array.prototype.reduce.call(
              q.value.children,
              (d, s) => d + (s[U.value.content] || 0),
              0,
            ),
          ),
          u = a > 0 && o > a;
        ((A.value = u), u && m(N), (j.value = a < Number.parseInt(e.breakpoint, 10)));
      }
      function Ae(t, a) {
        const o = t != null && t !== '' ? i.find((d) => d.name.value === t) : null,
          u = a != null && a !== '' ? i.find((d) => d.name.value === a) : null;
        if (X) X = !1;
        else if (o && u) {
          const d = o.tabIndicatorRef.value,
            s = u.tabIndicatorRef.value;
          (_ !== null && (clearTimeout(_), (_ = null)),
            (d.style.transition = 'none'),
            (d.style.transform = 'none'),
            (s.style.transition = 'none'),
            (s.style.transform = 'none'));
          const l = d.getBoundingClientRect(),
            C = s.getBoundingClientRect();
          ((s.style.transform = e.vertical
            ? `translate3d(0,${l.top - C.top}px,0) scale3d(1,${C.height ? l.height / C.height : 1},1)`
            : `translate3d(${l.left - C.left}px,0,0) scale3d(${C.width ? l.width / C.width : 1},1,1)`),
            h(() => {
              _ = setTimeout(() => {
                ((_ = null),
                  (s.style.transition = 'transform .25s cubic-bezier(.4, 0, .2, 1)'),
                  (s.style.transform = 'none'));
              }, 70);
            }));
        }
        u && A.value && F(u.rootRef.value);
      }
      function F(t) {
        const { left: a, width: o, top: u, height: d } = q.value.getBoundingClientRect(),
          s = t.getBoundingClientRect();
        let l = e.vertical ? s.top - u : s.left - a;
        if (l < 0) {
          ((q.value[e.vertical ? 'scrollTop' : 'scrollLeft'] += Math.floor(l)), N());
          return;
        }
        ((l += e.vertical ? s.height - d : s.width - o),
          l > 0 && ((q.value[e.vertical ? 'scrollTop' : 'scrollLeft'] += Math.ceil(l)), N()));
      }
      function N() {
        const t = q.value;
        if (t === null) return;
        const a = t.getBoundingClientRect(),
          o = e.vertical ? t.scrollTop : Math.abs(t.scrollLeft);
        H.value
          ? ((W.value = Math.ceil(o + a.width) < t.scrollWidth - 1), (V.value = o > 0))
          : ((W.value = o > 0),
            (V.value = e.vertical
              ? Math.ceil(o + a.height) < t.scrollHeight
              : Math.ceil(o + a.width) < t.scrollWidth));
      }
      function re(t) {
        (Q !== null && clearInterval(Q),
          (Q = setInterval(() => {
            Pe(t) && L();
          }, 5)));
      }
      function ue() {
        re(te.value ? Number.MAX_SAFE_INTEGER : 0);
      }
      function de() {
        re(te.value ? 0 : Number.MAX_SAFE_INTEGER);
      }
      function L() {
        Q !== null && (clearInterval(Q), (Q = null));
      }
      function Le(t, a) {
        const o = Array.prototype.filter.call(
            q.value.children,
            (C) => C === a || C.matches?.('.q-tab.q-focusable'),
          ),
          u = o.length;
        if (u === 0) return;
        if (t === 36) return (F(o[0]), o[0].focus(), !0);
        if (t === 35) return (F(o[u - 1]), o[u - 1].focus(), !0);
        const d = t === (e.vertical ? 38 : 37),
          s = t === (e.vertical ? 40 : 39),
          l = d ? -1 : s ? 1 : void 0;
        if (l !== void 0) {
          const C = H.value ? -1 : 1,
            p = o.indexOf(a) + l * C;
          return (p >= 0 && p < u && (F(o[p]), o[p].focus({ preventScroll: !0 })), !0);
        }
      }
      const Be = v(() =>
        te.value
          ? {
              get: (t) => Math.abs(t.scrollLeft),
              set: (t, a) => {
                t.scrollLeft = -a;
              },
            }
          : e.vertical
            ? {
                get: (t) => t.scrollTop,
                set: (t, a) => {
                  t.scrollTop = a;
                },
              }
            : {
                get: (t) => t.scrollLeft,
                set: (t, a) => {
                  t.scrollLeft = a;
                },
              },
      );
      function Pe(t) {
        const a = q.value,
          { get: o, set: u } = Be.value;
        let d = !1,
          s = o(a);
        const l = t < s ? -1 : 1;
        return (
          (s += l * 5),
          s < 0
            ? ((d = !0), (s = 0))
            : ((l === -1 && s <= t) || (l === 1 && s >= t)) && ((d = !0), (s = t)),
          u(a, s),
          N(),
          d
        );
      }
      function Re() {
        let t = null,
          a = { matchedLen: 0, queryDiff: 9999, hrefLen: 0 };
        const o = i.filter((l) => l.routeData?.hasRouterLink.value === !0),
          { hash: u, query: d } = g.$route,
          s = Object.keys(d).length;
        for (const l of o) {
          const C = l.routeData.exact.value === !0;
          if (!l.routeData[C ? 'linkIsExactActive' : 'linkIsActive'].value) continue;
          const { hash: p, query: ne, matched: Qe, href: Fe } = l.routeData.resolvedLink.value,
            oe = Object.keys(ne).length;
          if (C) {
            if (p !== u || oe !== s || !we(d, ne)) continue;
            t = l.name.value;
            break;
          }
          if ((p !== '' && p !== u) || (oe !== 0 && !we(ne, d))) continue;
          const B = { matchedLen: Qe.length, queryDiff: s - oe, hrefLen: Fe.length - p.length };
          if (B.matchedLen > a.matchedLen) {
            ((t = l.name.value), (a = B));
            continue;
          } else if (B.matchedLen !== a.matchedLen) continue;
          if (B.queryDiff < a.queryDiff) ((t = l.name.value), (a = B));
          else if (B.queryDiff !== a.queryDiff) continue;
          B.hrefLen > a.hrefLen && ((t = l.name.value), (a = B));
        }
        if (t === null && i.some((l) => l.routeData === void 0 && l.name.value === k.value)) {
          X = !1;
          return;
        }
        ae({ name: t, setCurrent: !0 });
      }
      function Me(t) {
        if (
          (Y(), !I.value && $.value !== null && t.target && typeof t.target.closest == 'function')
        ) {
          const a = t.target.closest('.q-tab');
          a && $.value.contains(a) && ((I.value = !0), A.value && F(a));
        }
      }
      function De() {
        K(() => {
          I.value = !1;
        }, 30);
      }
      function z() {
        ve.avoidRouteWatcher === !1 ? E(Re) : ee();
      }
      function fe() {
        if (R === void 0) {
          const t = Z(() => g.$route.fullPath, z);
          R = () => {
            (t(), (R = void 0));
          };
        }
      }
      function Ee(t) {
        (i.push(t),
          T.value++,
          G(),
          t.routeData === void 0 || g.$route === void 0
            ? E(() => {
                if (A.value) {
                  const a = k.value,
                    o = a != null && a !== '' ? i.find((u) => u.name.value === a) : null;
                  o && F(o.rootRef.value);
                }
              })
            : (fe(), t.routeData.hasRouterLink.value && z()));
      }
      function Ve(t) {
        (i.splice(i.indexOf(t), 1),
          T.value--,
          G(),
          R !== void 0 &&
            t.routeData !== void 0 &&
            (i.every((a) => a.routeData === void 0) && R(), z()));
      }
      const ve = {
        currentModel: k,
        tabProps: ke,
        hasFocus: I,
        hasActiveTab: _e,
        registerTab: Ee,
        unregisterTab: Ve,
        verifyRouteModel: z,
        updateModel: ae,
        onKbdNavigate: Le,
        avoidRouteWatcher: !1,
      };
      Ze(Te, ve);
      function me() {
        (_ !== null && clearTimeout(_), L(), R?.());
      }
      let he = !1,
        X = !1;
      return (
        Se(me),
        Ge(() => {
          ((he = R !== void 0), me());
        }),
        Xe(() => {
          (he && (fe(), (X = !0), z()), G());
        }),
        () =>
          S('div', { ref: $, class: pe.value, role: 'tablist', onFocusin: Me, onFocusout: De }, [
            S(ot, { onResize: ce }),
            S('div', { ref: q, class: $e.value, onScroll: N }, Je(y.default)),
            S(D, {
              class:
                'q-tabs__arrow q-tabs__arrow--left absolute q-tab__icon' +
                (W.value ? '' : ' q-tabs__arrow--faded'),
              name: e.leftIcon || n.iconSet.tabs[e.vertical ? 'up' : 'left'],
              onMousedownPassive: ue,
              onTouchstartPassive: ue,
              onMouseupPassive: L,
              onMouseleavePassive: L,
              onTouchendPassive: L,
            }),
            S(D, {
              class:
                'q-tabs__arrow q-tabs__arrow--right absolute q-tab__icon' +
                (V.value ? '' : ' q-tabs__arrow--faded'),
              name: e.rightIcon || n.iconSet.tabs[e.vertical ? 'down' : 'right'],
              onMousedownPassive: de,
              onTouchstartPassive: de,
              onMouseupPassive: L,
              onMouseleavePassive: L,
              onTouchendPassive: L,
            }),
          ])
      );
    },
  }),
  Ft = ye({
    __name: 'app-exam-session-time',
    props: { modelValue: {}, sessions: {} },
    emits: ['update:modelValue'],
    setup(e) {
      const y = e,
        f = (c) => {
          const m = (c.SS_START_TIME || '').substring(0, 5),
            h = (c.SS_END_TIME || '').substring(0, 5);
          return !m || !h ? '-' : `${m}-${h}`;
        },
        g = (c) => `${c.SS_START_TIME || ''}-${c.SS_END_TIME || ''}`,
        n = v(() => {
          const c = new Set();
          return (y.sessions || []).filter((m) => {
            const h = g(m);
            return c.has(h) ? !1 : (c.add(h), !0);
          });
        });
      return (c, m) => (
        w(),
        M(
          Qt,
          {
            'model-value': e.modelValue,
            'onUpdate:modelValue': m[0] || (m[0] = (h) => c.$emit('update:modelValue', h)),
            dense: '',
            class: 'app-exam-session-tabs q-mb-sm',
            'active-color': 'blue-6',
            'indicator-color': 'blue-6',
            align: 'left',
            'narrow-indicator': '',
            'no-caps': '',
          },
          {
            default: Ye(() => [
              (w(!0),
              P(
                tt,
                null,
                et(
                  n.value,
                  (h) => (
                    w(),
                    M(Dt, { key: h.SS_ID, name: h.SS_ID, label: f(h) }, null, 8, ['name', 'label'])
                  ),
                ),
                128,
              )),
            ]),
            _: 1,
          },
          8,
          ['model-value'],
        )
      );
    },
  }),
  Kt = Ce(Ft, [['__scopeId', 'data-v-9dd7afe8']]);
export { Kt as A, zt as a };
