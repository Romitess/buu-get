import {
  c as je,
  aJ as vl,
  bH as Qe,
  aP as ml,
  aM as Sl,
  bI as Rl,
  D as El,
  g as Ue,
  K as Ll,
  bJ as Tl,
  f as d,
  h as b,
  $ as Be,
  bK as Hl,
  as as Dl,
  M as Pl,
  af as ie,
  w as me,
  I as Y,
  bL as Nl,
  bk as Kl,
  b5 as $l,
  b6 as jl,
  o as hl,
  r as R,
  v as Ql,
  aK as Ul,
  bM as ke,
  bN as Wl,
  bO as Xl,
  aS as Ne,
  aN as cl,
  aR as Yl,
  ba as Jl,
  aI as ve,
  bb as Gl,
  au as Zl,
  m as et,
  bP as lt,
} from './index-CKSooU2k.js';
import { a as tt, Q as nt } from './QItem-D-DX6y8A.js';
import { Q as it } from './QItemLabel-Ca36qfFu.js';
import { n as rl, Q as ot } from './format-DnjzHs7F.js';
const at = je({
    name: 'QField',
    inheritAttrs: !1,
    props: { ...Qe, tag: { type: String, default: 'label' } },
    emits: vl,
    setup() {
      return ml(Sl({ tagProp: !0 }));
    },
  }),
  ut = { xs: 8, sm: 10, md: 14, lg: 20, xl: 24 },
  ct = je({
    name: 'QChip',
    props: {
      ...El,
      ...Rl,
      dense: Boolean,
      icon: String,
      iconRight: String,
      iconRemove: String,
      iconSelected: String,
      label: [String, Number],
      color: String,
      textColor: String,
      modelValue: { type: Boolean, default: !0 },
      selected: { type: Boolean, default: null },
      square: Boolean,
      outline: Boolean,
      clickable: Boolean,
      removable: Boolean,
      removeAriaLabel: String,
      tabindex: [String, Number],
      disable: Boolean,
      ripple: { type: [Boolean, Object], default: !0 },
    },
    emits: ['update:modelValue', 'update:selected', 'remove', 'click'],
    setup(e, { slots: u, emit: c }) {
      const {
          proxy: { $q: f },
        } = Ue(),
        B = Pl(e, f),
        a = Tl(e, ut),
        O = d(() => e.selected || e.icon !== void 0),
        y = d(() => (e.selected ? e.iconSelected || f.iconSet.chip.selected : e.icon)),
        g = d(() => e.iconRemove || f.iconSet.chip.remove),
        z = d(() => !e.disable && (e.clickable || e.selected !== null)),
        r = d(() => {
          const s = (e.outline && e.color) || e.textColor;
          return (
            'q-chip row inline no-wrap items-center' +
            (!e.outline && e.color !== void 0 ? ` bg-${e.color}` : '') +
            (s ? ` text-${s} q-chip--colored` : '') +
            (e.disable ? ' disabled' : '') +
            (e.dense ? ' q-chip--dense' : '') +
            (e.outline ? ' q-chip--outline' : '') +
            (e.selected ? ' q-chip--selected' : '') +
            (z.value ? ' q-chip--clickable cursor-pointer non-selectable q-hoverable' : '') +
            (e.square ? ' q-chip--square' : '') +
            (B.value ? ' q-chip--dark q-dark' : '')
          );
        }),
        w = d(() => {
          const s = e.disable
              ? { tabindex: -1, 'aria-disabled': 'true' }
              : { tabindex: e.tabindex || 0 },
            H = {
              ...s,
              role: 'button',
              'aria-hidden': 'false',
              'aria-label': e.removeAriaLabel || f.lang.label.remove,
            };
          return { chip: s, remove: H };
        });
      function C(s) {
        s.keyCode === 13 && k(s);
      }
      function k(s) {
        e.disable || (c('update:selected', !e.selected), c('click', s));
      }
      function q(s) {
        (s.keyCode === void 0 || s.keyCode === 13) &&
          (ie(s), e.disable || (c('update:modelValue', !1), c('remove')));
      }
      function T() {
        const s = [];
        (z.value && s.push(b('div', { class: 'q-focus-helper' })),
          O.value && s.push(b(Be, { class: 'q-chip__icon q-chip__icon--left', name: y.value })));
        const H = e.label !== void 0 ? [b('div', { class: 'ellipsis' }, [e.label])] : void 0;
        return (
          s.push(
            b(
              'div',
              { class: 'q-chip__content col row no-wrap items-center q-anchor--skip' },
              Hl(u.default, H),
            ),
          ),
          e.iconRight &&
            s.push(b(Be, { class: 'q-chip__icon q-chip__icon--right', name: e.iconRight })),
          e.removable &&
            s.push(
              b(Be, {
                class: 'q-chip__icon q-chip__icon--remove cursor-pointer',
                name: g.value,
                ...w.value.remove,
                onClick: q,
                onKeyup: q,
              }),
            ),
          s
        );
      }
      return () => {
        if (!e.modelValue) return;
        const s = { class: r.value, style: a.value };
        return (
          z.value && Object.assign(s, w.value.chip, { onClick: k, onKeyup: C }),
          Ll('div', s, T(), 'ripple', e.ripple !== !1 && !e.disable, () => [[Dl, e.ripple]])
        );
      };
    },
  });
let Re = !1;
{
  const e = document.createElement('div');
  (e.setAttribute('dir', 'rtl'),
    Object.assign(e.style, { width: '1px', height: '1px', overflow: 'auto' }));
  const u = document.createElement('div');
  (Object.assign(u.style, { width: '1000px', height: '1px' }),
    document.body.append(e),
    e.append(u),
    (e.scrollLeft = -1e3),
    (Re = e.scrollLeft >= 0),
    e.remove());
}
const $ = 1e3,
  rt = ['start', 'center', 'end', 'start-force', 'center-force', 'end-force'],
  gl = Array.prototype.filter,
  st =
    window.getComputedStyle(document.body).overflowAnchor === void 0
      ? Ql
      : function (u, c) {
          u !== null &&
            (u._qOverflowAnimationFrame !== void 0 &&
              cancelAnimationFrame(u._qOverflowAnimationFrame),
            (u._qOverflowAnimationFrame = requestAnimationFrame(() => {
              if (u === null) return;
              u._qOverflowAnimationFrame = void 0;
              const f = u.children || [];
              gl.call(f, (a) => a.dataset && a.dataset.qVsAnchor !== void 0).forEach((a) => {
                delete a.dataset.qVsAnchor;
              });
              const B = f[c];
              B?.dataset && (B.dataset.qVsAnchor = '');
            })));
        };
function Se(e, u) {
  return e + u;
}
function Ke(e, u, c, f, B, a, O, y) {
  const g = e === window ? document.scrollingElement || document.documentElement : e,
    z = B ? 'offsetWidth' : 'offsetHeight',
    r = {
      scrollStart: 0,
      scrollViewSize: -O - y,
      scrollMaxSize: 0,
      offsetStart: -O,
      offsetEnd: -y,
    };
  if (
    (B
      ? (e === window
          ? ((r.scrollStart =
              window.pageXOffset || window.scrollX || document.body.scrollLeft || 0),
            (r.scrollViewSize += document.documentElement.clientWidth))
          : ((r.scrollStart = g.scrollLeft), (r.scrollViewSize += g.clientWidth)),
        (r.scrollMaxSize = g.scrollWidth),
        a && (r.scrollStart = (Re ? r.scrollMaxSize - r.scrollViewSize : 0) - r.scrollStart))
      : (e === window
          ? ((r.scrollStart = window.pageYOffset || window.scrollY || document.body.scrollTop || 0),
            (r.scrollViewSize += document.documentElement.clientHeight))
          : ((r.scrollStart = g.scrollTop), (r.scrollViewSize += g.clientHeight)),
        (r.scrollMaxSize = g.scrollHeight)),
    c !== null)
  )
    for (let w = c.previousElementSibling; w !== null; w = w.previousElementSibling)
      w.classList.contains('q-virtual-scroll--skip') || (r.offsetStart += w[z]);
  if (f !== null)
    for (let w = f.nextElementSibling; w !== null; w = w.nextElementSibling)
      w.classList.contains('q-virtual-scroll--skip') || (r.offsetEnd += w[z]);
  if (u !== e) {
    const w = g.getBoundingClientRect(),
      C = u.getBoundingClientRect();
    (B
      ? ((r.offsetStart += C.left - w.left), (r.offsetEnd -= C.width))
      : ((r.offsetStart += C.top - w.top), (r.offsetEnd -= C.height)),
      e !== window && (r.offsetStart += r.scrollStart),
      (r.offsetEnd += r.scrollMaxSize - r.offsetStart));
  }
  return r;
}
function sl(e, u, c, f) {
  (u === 'end' && (u = (e === window ? document.body : e)[c ? 'scrollWidth' : 'scrollHeight']),
    e === window
      ? c
        ? (f &&
            (u = (Re ? document.body.scrollWidth - document.documentElement.clientWidth : 0) - u),
          window.scrollTo(u, window.pageYOffset || window.scrollY || document.body.scrollTop || 0))
        : window.scrollTo(window.pageXOffset || window.scrollX || document.body.scrollLeft || 0, u)
      : c
        ? (f && (u = (Re ? e.scrollWidth - e.offsetWidth : 0) - u), (e.scrollLeft = u))
        : (e.scrollTop = u));
}
function xe(e, u, c, f) {
  if (c >= f) return 0;
  const B = u.length,
    a = Math.floor(c / $),
    O = Math.floor((f - 1) / $) + 1;
  let y = e.slice(a, O).reduce(Se, 0);
  return (
    c % $ !== 0 && (y -= u.slice(a * $, c).reduce(Se, 0)),
    f % $ !== 0 && f !== B && (y -= u.slice(f, O * $).reduce(Se, 0)),
    y
  );
}
const bl = {
    virtualScrollSliceSize: { type: [Number, String], default: 10 },
    virtualScrollSliceRatioBefore: { type: [Number, String], default: 1 },
    virtualScrollSliceRatioAfter: { type: [Number, String], default: 1 },
    virtualScrollItemSize: { type: [Number, String], default: 24 },
    virtualScrollStickySizeStart: { type: [Number, String], default: 0 },
    virtualScrollStickySizeEnd: { type: [Number, String], default: 0 },
    tableColspan: [Number, String],
  },
  bt = Object.keys(bl),
  dl = { virtualScrollHorizontal: Boolean, onVirtualScroll: Function, ...bl };
function dt({
  virtualScrollLength: e,
  getVirtualScrollTarget: u,
  getVirtualScrollEl: c,
  virtualScrollItemSizeComputed: f,
}) {
  const B = Ue(),
    { props: a, emit: O, proxy: y } = B,
    { $q: g } = y;
  let z,
    r,
    w,
    C = [],
    k;
  const q = R(0),
    T = R(0),
    s = R({}),
    H = R(null),
    W = R(null),
    D = R(null),
    M = R({ from: 0, to: 0 }),
    pe = d(() => (a.tableColspan !== void 0 ? a.tableColspan : 100));
  f === void 0 && (f = d(() => a.virtualScrollItemSize));
  const L = d(() => f.value + ';' + a.virtualScrollHorizontal),
    J = d(
      () => L.value + ';' + a.virtualScrollSliceRatioBefore + ';' + a.virtualScrollSliceRatioAfter,
    );
  (me(J, () => {
    j();
  }),
    me(L, G));
  function G() {
    oe(r, !0);
  }
  function he(t) {
    oe(t === void 0 ? r : t);
  }
  function Z(t, i) {
    const m = u();
    if (m == null || m.nodeType === 8) return;
    const A = Ke(
      m,
      c(),
      H.value,
      W.value,
      a.virtualScrollHorizontal,
      g.lang.rtl,
      a.virtualScrollStickySizeStart,
      a.virtualScrollStickySizeEnd,
    );
    (w !== A.scrollViewSize && j(A.scrollViewSize),
      P(
        m,
        A,
        Math.min(e.value - 1, Math.max(0, Number.parseInt(t, 10) || 0)),
        0,
        rt.includes(i) ? i : r !== -1 && t > r ? 'end' : 'start',
      ));
  }
  function Ae() {
    const t = u();
    if (t == null || t.nodeType === 8) return;
    const i = Ke(
        t,
        c(),
        H.value,
        W.value,
        a.virtualScrollHorizontal,
        g.lang.rtl,
        a.virtualScrollStickySizeStart,
        a.virtualScrollStickySizeEnd,
      ),
      m = e.value - 1,
      A = i.scrollMaxSize - i.offsetStart - i.offsetEnd - T.value;
    if (z === i.scrollStart) return;
    if (i.scrollMaxSize <= 0) {
      P(t, i, 0, 0);
      return;
    }
    (w !== i.scrollViewSize && j(i.scrollViewSize), ge(M.value.from));
    const _ = Math.floor(
      i.scrollMaxSize -
        Math.max(i.scrollViewSize, i.offsetEnd) -
        Math.min(k[m], i.scrollViewSize / 2),
    );
    if (_ > 0 && Math.ceil(i.scrollStart) >= _) {
      P(t, i, m, i.scrollMaxSize - i.offsetEnd - C.reduce(Se, 0));
      return;
    }
    let V = 0,
      h = i.scrollStart - i.offsetStart,
      F = h;
    if (h <= A && h + i.scrollViewSize >= q.value) ((h -= q.value), (V = M.value.from), (F = h));
    else for (let S = 0; h >= C[S] && V < m; S++) ((h -= C[S]), (V += $));
    for (; h > 0 && V < m; ) ((h -= k[V]), h > -i.scrollViewSize ? (V++, (F = h)) : (F = k[V] + h));
    P(t, i, V, F);
  }
  function P(t, i, m, A, _) {
    const V = typeof _ == 'string' && _.includes('-force'),
      h = V ? _.replace('-force', '') : _,
      F = h !== void 0 ? h : 'start';
    let S = Math.max(0, m - s.value[F]),
      N = S + s.value.total;
    (N > e.value && ((N = e.value), (S = Math.max(0, N - s.value.total))), (z = i.scrollStart));
    const X = S !== M.value.from || N !== M.value.to;
    if (!X && h === void 0) {
      be(m);
      return;
    }
    const { activeElement: ze } = document,
      U = D.value;
    (X &&
      U !== null &&
      U !== ze &&
      U.contains(ze) &&
      (U.addEventListener('focusout', qe),
      setTimeout(() => {
        U?.removeEventListener('focusout', qe);
      })),
      st(U, m - S));
    const Ie = h !== void 0 ? k.slice(S, m).reduce(Se, 0) : 0;
    if (X) {
      const ee = N >= M.value.from && S <= M.value.to ? M.value.to : N;
      ((M.value = { from: S, to: ee }),
        (q.value = xe(C, k, 0, S)),
        (T.value = xe(C, k, N, e.value)),
        requestAnimationFrame(() => {
          M.value.to !== N &&
            z === i.scrollStart &&
            ((M.value = { from: M.value.from, to: N }), (T.value = xe(C, k, N, e.value)));
        }));
    }
    requestAnimationFrame(() => {
      if (z !== i.scrollStart) return;
      X && ge(S);
      const ee = k.slice(S, m).reduce(Se, 0),
        le = ee + i.offsetStart + q.value,
        Me = le + k[m];
      let we = le + A;
      if (h !== void 0) {
        const Le = ee - Ie,
          Ve = i.scrollStart + Le;
        we =
          !V && Ve < le && Me < Ve + i.scrollViewSize
            ? Ve
            : h === 'end'
              ? Me - i.scrollViewSize
              : le - (h === 'start' ? 0 : Math.round((i.scrollViewSize - k[m]) / 2));
      }
      ((z = we), sl(t, we, a.virtualScrollHorizontal, g.lang.rtl), be(m));
    });
  }
  function ge(t) {
    const i = D.value;
    if (i) {
      const m = gl.call(
          i.children,
          (S) => S.classList && !S.classList.contains('q-virtual-scroll--skip'),
        ),
        A = m.length,
        _ = a.virtualScrollHorizontal
          ? (S) => S.getBoundingClientRect().width
          : (S) => S.offsetHeight;
      let V = t,
        h,
        F;
      for (let S = 0; S < A; ) {
        for (h = _(m[S]), S++; S < A && m[S].classList.contains('q-virtual-scroll--with-prev'); )
          ((h += _(m[S])), S++);
        ((F = h - k[V]), F !== 0 && ((k[V] += F), (C[Math.floor(V / $)] += F)), V++);
      }
    }
  }
  function qe() {
    D.value?.focus();
  }
  function oe(t, i) {
    const m = Number(f.value);
    (i || !Array.isArray(k)) && (k = []);
    const A = k.length;
    k.length = e.value;
    for (let V = e.value - 1; V >= A; V--) k[V] = m;
    const _ = Math.floor((e.value - 1) / $);
    C = [];
    for (let V = 0; V <= _; V++) {
      let h = 0;
      const F = Math.min((V + 1) * $, e.value);
      for (let S = V * $; S < F; S++) h += k[S];
      C.push(h);
    }
    ((r = -1),
      (z = void 0),
      (q.value = xe(C, k, 0, M.value.from)),
      (T.value = xe(C, k, M.value.to, e.value)),
      t >= 0
        ? (ge(M.value.from),
          Y(() => {
            Z(t);
          }))
        : ae());
  }
  function j(t) {
    if (t === void 0 && typeof window < 'u') {
      const h = u();
      h != null &&
        h.nodeType !== 8 &&
        (t = Ke(
          h,
          c(),
          H.value,
          W.value,
          a.virtualScrollHorizontal,
          g.lang.rtl,
          a.virtualScrollStickySizeStart,
          a.virtualScrollStickySizeEnd,
        ).scrollViewSize);
    }
    w = t;
    const i = Number.parseFloat(a.virtualScrollSliceRatioBefore) || 0,
      m = Number.parseFloat(a.virtualScrollSliceRatioAfter) || 0,
      A = 1 + i + m,
      _ = t === void 0 || t <= 0 ? 1 : Math.ceil(t / f.value),
      V = Math.max(
        1,
        _,
        Math.ceil((a.virtualScrollSliceSize > 0 ? a.virtualScrollSliceSize : 10) / A),
      );
    s.value = {
      total: Math.ceil(V * A),
      start: Math.ceil(V * i),
      center: Math.ceil(V * (0.5 + i)),
      end: Math.ceil(V * (1 + i)),
      view: _,
    };
  }
  function Ee(t, i) {
    const m = a.virtualScrollHorizontal ? 'width' : 'height',
      A = { ['--q-virtual-scroll-item-' + m]: f.value + 'px' };
    return [
      t === 'tbody'
        ? b(t, { class: 'q-virtual-scroll__padding', key: 'before', ref: H }, [
            b('tr', [b('td', { style: { [m]: `${q.value}px`, ...A }, colspan: pe.value })]),
          ])
        : b(t, {
            class: 'q-virtual-scroll__padding',
            key: 'before',
            ref: H,
            style: { [m]: `${q.value}px`, ...A },
          }),
      b(t, { class: 'q-virtual-scroll__content', key: 'content', ref: D, tabindex: -1 }, i.flat()),
      t === 'tbody'
        ? b(t, { class: 'q-virtual-scroll__padding', key: 'after', ref: W }, [
            b('tr', [b('td', { style: { [m]: `${T.value}px`, ...A }, colspan: pe.value })]),
          ])
        : b(t, {
            class: 'q-virtual-scroll__padding',
            key: 'after',
            ref: W,
            style: { [m]: `${T.value}px`, ...A },
          }),
    ];
  }
  function be(t) {
    r !== t &&
      (a.onVirtualScroll !== void 0 &&
        O('virtualScroll', {
          index: t,
          from: M.value.from,
          to: M.value.to - 1,
          direction: t < r ? 'decrease' : 'increase',
          ref: y,
        }),
      (r = t));
  }
  j();
  const ae = Nl(Ae, g.platform.is.ios ? 120 : 35);
  Kl(() => {
    j();
  });
  let ye = !1;
  return (
    $l(() => {
      ye = !0;
    }),
    jl(() => {
      if (!ye) return;
      const t = u();
      z !== void 0 && t !== void 0 && t !== null && t.nodeType !== 8
        ? sl(t, z, a.virtualScrollHorizontal, g.lang.rtl)
        : Z(r);
    }),
    hl(() => {
      ae.cancel();
    }),
    Object.assign(y, { scrollTo: Z, reset: G, refresh: he }),
    {
      virtualScrollSliceRange: M,
      virtualScrollSliceSizeComputed: s,
      setVirtualScrollSize: j,
      onVirtualScrollEvt: ae,
      localResetVirtualScroll: oe,
      padVirtualScroll: Ee,
      scrollTo: Z,
      reset: G,
      refresh: he,
    }
  );
}
const fl = (e) => ['add', 'add-unique', 'toggle'].includes(e),
  ft = '.*+?^${}()|[]\\',
  vt = Object.keys(Qe);
function $e(e, u) {
  if (typeof e == 'function') return e;
  const c = e !== void 0 ? e : u;
  return (f) => (f !== null && typeof f == 'object' && c in f ? f[c] : f);
}
const yt = je({
  name: 'QSelect',
  inheritAttrs: !1,
  props: {
    ...dl,
    ...Ul,
    ...Qe,
    modelValue: { required: !0 },
    multiple: Boolean,
    displayValue: [String, Number],
    displayValueHtml: Boolean,
    dropdownIcon: String,
    options: { type: Array, default: () => [] },
    optionValue: [Function, String],
    optionLabel: [Function, String],
    optionDisable: [Function, String],
    hideSelected: Boolean,
    hideDropdownIcon: Boolean,
    fillInput: Boolean,
    maxValues: [Number, String],
    optionsDense: Boolean,
    optionsDark: { type: Boolean, default: null },
    optionsSelectedClass: String,
    optionsHtml: Boolean,
    optionsCover: Boolean,
    menuShrink: Boolean,
    menuAnchor: String,
    menuSelf: String,
    menuOffset: Array,
    popupContentClass: String,
    popupContentStyle: [String, Array, Object],
    popupNoRouteDismiss: Boolean,
    useInput: Boolean,
    useChips: Boolean,
    newValueMode: { type: String, validator: fl },
    mapOptions: Boolean,
    emitValue: Boolean,
    disableTabSelection: Boolean,
    inputDebounce: { type: [Number, String], default: 500 },
    inputClass: [Array, String, Object],
    inputStyle: [Array, String, Object],
    tabindex: { type: [String, Number], default: 0 },
    autocomplete: String,
    transitionShow: {},
    transitionHide: {},
    transitionDuration: {},
    behavior: {
      type: String,
      validator: (e) => ['default', 'menu', 'dialog'].includes(e),
      default: 'default',
    },
    virtualScrollItemSize: dl.virtualScrollItemSize.type,
    onNewValue: Function,
    onFilter: Function,
  },
  emits: [
    ...vl,
    'add',
    'remove',
    'inputValue',
    'keyup',
    'keypress',
    'keydown',
    'popupShow',
    'popupHide',
    'filterAbort',
  ],
  setup(e, { slots: u, emit: c }) {
    const { proxy: f } = Ue(),
      { $q: B } = f,
      a = R(!1),
      O = R(!1),
      y = R(-1),
      g = R(''),
      z = R(!1),
      r = R(!1);
    let w = null,
      C = null,
      k,
      q,
      T,
      s = null,
      H,
      W,
      D,
      M;
    const pe = R(null),
      L = R(null),
      J = R(null),
      G = R(null),
      he = R(null),
      Z = Yl(e),
      Ae = lt(nl),
      P = d(() => (Array.isArray(e.options) ? e.options.length : 0)),
      ge = d(() =>
        e.virtualScrollItemSize === void 0 ? (e.optionsDense ? 24 : 48) : e.virtualScrollItemSize,
      ),
      {
        virtualScrollSliceRange: qe,
        virtualScrollSliceSizeComputed: oe,
        localResetVirtualScroll: j,
        padVirtualScroll: Ee,
        onVirtualScrollEvt: be,
        scrollTo: ae,
        setVirtualScrollSize: ye,
      } = dt({
        virtualScrollLength: P,
        getVirtualScrollTarget: Cl,
        getVirtualScrollEl: ll,
        virtualScrollItemSizeComputed: ge,
      }),
      t = Sl(),
      i = d(() => {
        const l = e.mapOptions && !e.multiple,
          n =
            e.modelValue !== void 0 && (e.modelValue !== null || l)
              ? e.multiple && Array.isArray(e.modelValue)
                ? e.modelValue
                : [e.modelValue]
              : [];
        if (e.mapOptions && Array.isArray(e.options)) {
          const o = e.mapOptions && k !== void 0 ? k : [],
            v = n.map((p) => Vl(p, o));
          return e.modelValue === null && l ? v.filter((p) => p !== null) : v;
        }
        return n;
      }),
      m = d(() => {
        const l = {};
        return (
          vt.forEach((n) => {
            const o = e[n];
            o !== void 0 && (l[n] = o);
          }),
          l
        );
      }),
      A = d(() => (e.optionsDark === null ? t.isDark.value : e.optionsDark)),
      _ = d(() => cl(i.value)),
      V = d(() => {
        let l = 'q-field__input q-placeholder col';
        return e.hideSelected || i.value.length === 0
          ? [l, e.inputClass]
          : ((l += ' q-field__input--padding'), e.inputClass === void 0 ? l : [l, e.inputClass]);
      }),
      h = d(
        () =>
          (e.virtualScrollHorizontal ? 'q-virtual-scroll--horizontal' : '') +
          (e.popupContentClass ? ' ' + e.popupContentClass : ''),
      ),
      F = d(() => P.value === 0),
      S = d(() => i.value.map((l) => K.value(l)).join(', ')),
      N = d(() => (e.displayValue !== void 0 ? e.displayValue : S.value)),
      X = d(() => (e.optionsHtml ? () => !0 : (l) => l?.html === !0)),
      ze = d(
        () =>
          e.displayValueHtml ||
          (e.displayValue === void 0 && (e.optionsHtml || i.value.some(X.value))),
      ),
      U = d(() => (t.focused.value ? e.tabindex : -1)),
      Ie = d(() => {
        const l = {
          tabindex: e.tabindex,
          role: 'combobox',
          'aria-label': e.label,
          'aria-readonly': e.readonly ? 'true' : 'false',
          'aria-autocomplete': e.useInput ? 'list' : 'none',
          'aria-expanded': a.value ? 'true' : 'false',
          'aria-controls': `${t.targetUid.value}_lb`,
        };
        return (
          y.value >= 0 && (l['aria-activedescendant'] = `${t.targetUid.value}_${y.value}`),
          l
        );
      }),
      ee = d(() => ({
        id: `${t.targetUid.value}_lb`,
        role: 'listbox',
        'aria-multiselectable': e.multiple ? 'true' : 'false',
      })),
      le = d(() =>
        i.value.map((l, n) => ({
          index: n,
          opt: l,
          html: X.value(l),
          selected: !0,
          removeAtIndex: wl,
          toggleOption: te,
          tabindex: U.value,
        })),
      ),
      Me = d(() => {
        if (P.value === 0) return [];
        const { from: l, to: n } = qe.value;
        return e.options.slice(l, n).map((o, v) => {
          const p = ue.value(o) === !0,
            x = He(o),
            E = l + v,
            I = {
              clickable: !0,
              active: x,
              activeClass: Ve.value,
              manualFocus: !0,
              focused: !1,
              disable: p,
              tabindex: -1,
              dense: e.optionsDense,
              dark: A.value,
              role: 'option',
              'aria-selected': x ? 'true' : 'false',
              id: `${t.targetUid.value}_${E}`,
              onClick: () => {
                te(o);
              },
            };
          return (
            p ||
              (y.value === E && (I.focused = !0),
              B.platform.is.desktop &&
                (I.onMousemove = () => {
                  a.value && ce(E);
                })),
            {
              index: E,
              opt: o,
              html: X.value(o),
              label: K.value(o),
              selected: I.active,
              focused: I.focused,
              toggleOption: te,
              setOptionIndex: ce,
              itemProps: I,
            }
          );
        });
      }),
      we = d(() => (e.dropdownIcon !== void 0 ? e.dropdownIcon : B.iconSet.arrow.dropdown)),
      Le = d(() => !e.optionsCover && !e.outlined && !e.standout && !e.borderless && !e.rounded),
      Ve = d(() =>
        e.optionsSelectedClass !== void 0
          ? e.optionsSelectedClass
          : e.color !== void 0
            ? `text-${e.color}`
            : '',
      ),
      Q = d(() => $e(e.optionValue, 'value')),
      K = d(() => $e(e.optionLabel, 'label')),
      ue = d(() => $e(e.optionDisable, 'disable')),
      Oe = d(() => i.value.map(Q.value)),
      yl = d(() => {
        const l = {
          onInput: nl,
          onChange: Ae,
          onKeydown: el,
          onKeyup: Ge,
          onKeypress: Ze,
          onFocus: Ye,
          onClick(n) {
            q && ve(n);
          },
        };
        return ((l.onCompositionstart = l.onCompositionupdate = l.onCompositionend = Ae), l);
      });
    (me(
      i,
      (l) => {
        ((k = l),
          e.useInput &&
            e.fillInput &&
            !e.multiple &&
            !t.innerLoading.value &&
            ((!O.value && !a.value) || !_.value) &&
            (T || fe(), (O.value || a.value) && re('')));
      },
      { immediate: !0 },
    ),
      me(() => e.fillInput, fe),
      me(a, De),
      me(P, Bl));
    function We(l) {
      return e.emitValue ? Q.value(l) : l;
    }
    function Te(l) {
      if (l !== -1 && l < i.value.length)
        if (e.multiple) {
          const n = [...e.modelValue];
          (c('remove', { index: l, value: n.splice(l, 1)[0] }), c('update:modelValue', n));
        } else c('update:modelValue', null);
    }
    function wl(l) {
      (Te(l), t.focus());
    }
    function Xe(l, n) {
      const o = We(l);
      if (!e.multiple) {
        (e.fillInput && Ce(K.value(l), !0, !0), c('update:modelValue', o));
        return;
      }
      if (i.value.length === 0) {
        (c('add', { index: 0, value: o }), c('update:modelValue', e.multiple ? [o] : o));
        return;
      }
      if ((n && He(l)) || (e.maxValues !== void 0 && e.modelValue.length >= e.maxValues)) return;
      const v = [...e.modelValue];
      (c('add', { index: v.length, value: o }), v.push(o), c('update:modelValue', v));
    }
    function te(l, n) {
      if (!t.editable.value || l === void 0 || ue.value(l) === !0) return;
      const o = Q.value(l);
      if (!e.multiple) {
        (n || (Ce(e.fillInput ? K.value(l) : '', !0, !0), ne()),
          L.value?.focus(),
          (i.value.length === 0 || !ke(Q.value(i.value[0]), o)) &&
            c('update:modelValue', e.emitValue ? o : l));
        return;
      }
      if (((!q || z.value) && t.focus(), Ye(), i.value.length === 0)) {
        const x = e.emitValue ? o : l;
        (c('add', { index: 0, value: x }), c('update:modelValue', e.multiple ? [x] : x));
        return;
      }
      const v = [...e.modelValue],
        p = Oe.value.findIndex((x) => ke(x, o));
      if (p !== -1) c('remove', { index: p, value: v.splice(p, 1)[0] });
      else {
        if (e.maxValues !== void 0 && v.length >= e.maxValues) return;
        const x = e.emitValue ? o : l;
        (c('add', { index: v.length, value: x }), v.push(x));
      }
      c('update:modelValue', v);
    }
    function ce(l) {
      if (!B.platform.is.desktop) return;
      const n = l !== -1 && l < P.value ? l : -1;
      y.value !== n && (y.value = n);
    }
    function _e(l = 1, n) {
      if (a.value) {
        let o = y.value;
        do o = rl(o + l, -1, P.value - 1);
        while (o !== -1 && o !== y.value && ue.value(e.options[o]) === !0);
        y.value !== o &&
          (ce(o),
          ae(o),
          !n && e.useInput && e.fillInput && Fe(o >= 0 ? K.value(e.options[o]) : H, !0));
      }
    }
    function Vl(l, n) {
      const o = (v) => ke(Q.value(v), l);
      return e.options.find(o) || n.find(o) || l;
    }
    function He(l) {
      const n = Q.value(l);
      return Oe.value.find((o) => ke(o, n)) !== void 0;
    }
    function Ye(l) {
      e.useInput &&
        L.value !== null &&
        (l === void 0 || (L.value === l.target && l.target.value === S.value)) &&
        L.value.select();
    }
    function Je(l) {
      (Jl(l, 27) && a.value && (ve(l), ne(), fe()), c('keyup', l));
    }
    function Ge(l) {
      const { value: n } = l.target;
      if (l.keyCode !== void 0) {
        Je(l);
        return;
      }
      if (
        ((l.target.value = ''),
        w !== null && (clearTimeout(w), (w = null)),
        C !== null && (clearTimeout(C), (C = null)),
        fe(),
        typeof n == 'string' && n.length !== 0)
      ) {
        const o = n.toLocaleLowerCase(),
          v = (x) => {
            const E = e.options.find((I) => String(x.value(I)).toLocaleLowerCase() === o);
            return E === void 0 ? !1 : (i.value.includes(E) ? ne() : te(E), !0);
          },
          p = (x) => {
            !v(Q) && !x && !v(K) && re(n, !0, () => p(!0));
          };
        p();
      } else t.clearValue(l);
    }
    function Ze(l) {
      c('keypress', l);
    }
    function el(l) {
      if ((c('keydown', l), Gl(l))) return;
      const n = g.value.length !== 0 && (e.newValueMode !== void 0 || e.onNewValue !== void 0),
        o = !l.shiftKey && !e.disableTabSelection && !e.multiple && (y.value !== -1 || n);
      if (l.keyCode === 27) {
        Ne(l);
        return;
      }
      if (l.keyCode === 9 && !o) {
        se();
        return;
      }
      if (l.target === void 0 || l.target.id !== t.targetUid.value || !t.editable.value) return;
      if (l.keyCode === 40 && !t.innerLoading.value && !a.value) {
        (ie(l), de());
        return;
      }
      if (
        l.keyCode === 8 &&
        (e.useChips || e.clearable) &&
        !e.hideSelected &&
        g.value.length === 0
      ) {
        e.multiple && Array.isArray(e.modelValue)
          ? Te(e.modelValue.length - 1)
          : !e.multiple && e.modelValue !== null && c('update:modelValue', null);
        return;
      }
      ((l.keyCode === 35 || l.keyCode === 36) &&
        (typeof g.value != 'string' || g.value.length === 0) &&
        (ie(l), (y.value = -1), _e(l.keyCode === 36 ? 1 : -1, e.multiple)),
        (l.keyCode === 33 || l.keyCode === 34) &&
          oe.value !== void 0 &&
          (ie(l),
          (y.value = Math.max(
            -1,
            Math.min(P.value, y.value + (l.keyCode === 33 ? -1 : 1) * oe.value.view),
          )),
          _e(l.keyCode === 33 ? 1 : -1, e.multiple)),
        (l.keyCode === 38 || l.keyCode === 40) &&
          (ie(l), _e(l.keyCode === 38 ? -1 : 1, e.multiple)));
      const v = P.value;
      if (
        ((D === void 0 || M < Date.now()) && (D = ''),
        v > 0 &&
          !e.useInput &&
          l.key !== void 0 &&
          l.key.length === 1 &&
          !l.altKey &&
          !l.ctrlKey &&
          !l.metaKey &&
          (l.keyCode !== 32 || D.length !== 0))
      ) {
        a.value || de(l);
        const p = l.key.toLocaleLowerCase(),
          x = D.length === 1 && D[0] === p;
        ((M = Date.now() + 1500), x || (ie(l), (D += p)));
        const E = new RegExp(
          '^' + [...D].map((Pe) => (ft.includes(Pe) ? '\\' + Pe : Pe)).join('.*'),
          'i',
        );
        let I = y.value;
        if (x || I < 0 || !E.test(K.value(e.options[I])))
          do I = rl(I + 1, -1, v - 1);
          while (
            I !== y.value &&
            (ue.value(e.options[I]) === !0 || !E.test(K.value(e.options[I])))
          );
        y.value !== I &&
          Y(() => {
            (ce(I), ae(I), I >= 0 && e.useInput && e.fillInput && Fe(K.value(e.options[I]), !0));
          });
        return;
      }
      if (
        !(
          l.keyCode !== 13 &&
          (l.keyCode !== 32 || e.useInput || D !== '') &&
          (l.keyCode !== 9 || !o)
        )
      ) {
        if ((l.keyCode !== 9 && ie(l), y.value !== -1 && y.value < v)) {
          te(e.options[y.value]);
          return;
        }
        if (n) {
          const p = (x, E) => {
            if (E) {
              if (!fl(E)) return;
            } else E = e.newValueMode;
            if ((Ce('', !e.multiple, !0), x == null)) return;
            ((E === 'toggle' ? te : Xe)(x, E === 'add-unique'),
              e.multiple || (L.value?.focus(), ne()));
          };
          if ((e.onNewValue !== void 0 ? c('newValue', g.value, p) : p(g.value), !e.multiple))
            return;
        }
        a.value ? se() : t.innerLoading.value || de();
      }
    }
    function ll() {
      return q
        ? he.value
        : J.value !== null && J.value.contentEl !== null
          ? J.value.contentEl
          : void 0;
    }
    function Cl() {
      return ll();
    }
    function kl() {
      return e.hideSelected
        ? []
        : u['selected-item'] !== void 0
          ? le.value.map((l) => u['selected-item'](l))
          : u.selected !== void 0
            ? [u.selected()].flat()
            : e.useChips
              ? le.value.map((l, n) =>
                  b(
                    ct,
                    {
                      key: 'option-' + n,
                      removable: t.editable.value && ue.value(l.opt) !== !0,
                      dense: !0,
                      textColor: e.color,
                      tabindex: U.value,
                      onRemove() {
                        l.removeAtIndex(n);
                      },
                    },
                    () =>
                      b('span', {
                        class: 'ellipsis',
                        [l.html ? 'innerHTML' : 'textContent']: K.value(l.opt),
                      }),
                  ),
                )
              : [
                  b('span', {
                    class: 'ellipsis',
                    [ze.value ? 'innerHTML' : 'textContent']: N.value,
                  }),
                ];
    }
    function tl() {
      if (F.value)
        return u['no-option'] !== void 0 ? u['no-option']({ inputValue: g.value }) : void 0;
      const l =
        u.option !== void 0
          ? u.option
          : (o) =>
              b(nt, { key: o.index, ...o.itemProps }, () =>
                b(tt, () =>
                  b(it, () => b('span', { [o.html ? 'innerHTML' : 'textContent']: o.label })),
                ),
              );
      let n = Ee('div', Me.value.map(l));
      return (
        u['before-options'] !== void 0 && (n = [u['before-options'](), ...n].flat()),
        et(u['after-options'], n)
      );
    }
    function xl(l, n) {
      const o = n ? { ...Ie.value, ...t.splitAttrs.attributes.value } : void 0,
        v = {
          ref: n ? L : void 0,
          key: 'i_t',
          class: V.value,
          style: e.inputStyle,
          value: g.value !== void 0 ? g.value : '',
          type: 'search',
          ...o,
          id: n ? t.targetUid.value : void 0,
          maxlength: e.maxlength,
          autocomplete: e.autocomplete,
          'data-autofocus': l === !0 || e.autofocus || void 0,
          disabled: e.disable,
          readonly: e.readonly,
          ...yl.value,
        };
      return (
        !l &&
          q &&
          (Array.isArray(v.class)
            ? (v.class = [...v.class, 'no-pointer-events'])
            : (v.class += ' no-pointer-events')),
        b('input', v)
      );
    }
    function nl(l) {
      (w !== null && (clearTimeout(w), (w = null)),
        C !== null && (clearTimeout(C), (C = null)),
        !l?.target?.qComposing &&
          (Fe(l.target.value || ''),
          (T = !0),
          (H = g.value),
          !t.focused.value && (!q || z.value) && t.focus(),
          e.onFilter !== void 0 &&
            (w = setTimeout(() => {
              ((w = null), re(g.value));
            }, e.inputDebounce))));
    }
    function Fe(l, n) {
      g.value !== l &&
        ((g.value = l),
        n || e.inputDebounce === 0 || e.inputDebounce === '0'
          ? c('inputValue', l)
          : (C = setTimeout(() => {
              ((C = null), c('inputValue', l));
            }, e.inputDebounce)));
    }
    function Ce(l, n, o) {
      ((T = o !== !0), e.useInput && (Fe(l, !0), (n || T) && (H = l), n || re(l)));
    }
    function re(l, n, o) {
      if (e.onFilter === void 0 || (!n && !t.focused.value)) return;
      (t.innerLoading.value ? c('filterAbort') : ((t.innerLoading.value = !0), (r.value = !0)),
        l !== '' &&
          !e.multiple &&
          i.value.length !== 0 &&
          !T &&
          l === K.value(i.value[0]) &&
          (l = ''));
      const v = setTimeout(() => {
        a.value && (a.value = !1);
      }, 10);
      (s !== null && clearTimeout(s),
        (s = v),
        c(
          'filter',
          l,
          (p, x) => {
            (n || t.focused.value) &&
              s === v &&
              (clearTimeout(s),
              typeof p == 'function' && p(),
              (r.value = !1),
              Y(() => {
                ((t.innerLoading.value = !1),
                  t.editable.value && (n ? a.value && ne() : a.value ? De(!0) : (a.value = !0)),
                  typeof x == 'function' &&
                    Y(() => {
                      x(f);
                    }),
                  typeof o == 'function' &&
                    Y(() => {
                      o(f);
                    }));
              }));
          },
          () => {
            (t.focused.value &&
              s === v &&
              (clearTimeout(s), (t.innerLoading.value = !1), (r.value = !1)),
              a.value && (a.value = !1));
          },
        ));
    }
    function pl() {
      return b(
        ot,
        {
          ref: J,
          class: h.value,
          style: e.popupContentStyle,
          modelValue: a.value,
          fit: !e.menuShrink,
          cover: e.optionsCover && !F.value && !e.useInput,
          anchor: e.menuAnchor,
          self: e.menuSelf,
          offset: e.menuOffset,
          dark: A.value,
          noParentEvent: !0,
          noRefocus: !0,
          noFocus: !0,
          noRouteDismiss: e.popupNoRouteDismiss,
          square: Le.value,
          transitionShow: e.transitionShow,
          transitionHide: e.transitionHide,
          transitionDuration: e.transitionDuration,
          separateClosePopup: !0,
          ...ee.value,
          onScrollPassive: be,
          onBeforeShow: ol,
          onBeforeHide: Al,
          onShow: ql,
        },
        tl,
      );
    }
    function Al(l) {
      (al(l), se());
    }
    function ql() {
      ye();
    }
    function zl(l) {
      (ve(l),
        L.value?.focus(),
        (z.value = !0),
        window.scrollTo(window.pageXOffset || window.scrollX || document.body.scrollLeft || 0, 0));
    }
    function Il(l) {
      (ve(l),
        Y(() => {
          z.value = !1;
        }));
    }
    function Ml() {
      const l = [
        b(
          at,
          {
            class: `col-auto ${t.fieldClass.value}`,
            ...m.value,
            for: t.targetUid.value,
            dark: A.value,
            square: !0,
            loading: r.value,
            itemAligned: !1,
            filled: !0,
            stackLabel: g.value.length !== 0,
            ...t.splitAttrs.listeners.value,
            onFocus: zl,
            onBlur: Il,
          },
          { ...u, rawControl: () => t.getControl(!0), before: void 0, after: void 0 },
        ),
      ];
      return (
        a.value &&
          l.push(
            b(
              'div',
              {
                ref: he,
                class: h.value + ' scroll',
                style: e.popupContentStyle,
                ...ee.value,
                onClick: Ne,
                onScrollPassive: be,
              },
              tl(),
            ),
          ),
        b(
          Zl,
          {
            ref: G,
            modelValue: O.value,
            position: e.useInput ? 'top' : void 0,
            transitionShow: W,
            transitionHide: e.transitionHide,
            transitionDuration: e.transitionDuration,
            noRouteDismiss: e.popupNoRouteDismiss,
            onBeforeShow: ol,
            onBeforeHide: Ol,
            onHide: _l,
            onShow: Fl,
          },
          () =>
            b(
              'div',
              {
                class:
                  'q-select__dialog' +
                  (A.value ? ' q-select__dialog--dark q-dark' : '') +
                  (z.value ? ' q-select__dialog--focused' : ''),
              },
              l,
            ),
        )
      );
    }
    function Ol(l) {
      (al(l),
        G.value !== null &&
          G.value.__updateRefocusTarget(
            t.rootRef.value.querySelector('.q-field__native > [tabindex]:last-child'),
          ),
        (t.focused.value = !1));
    }
    function _l(l) {
      (ne(), t.focused.value || c('blur', l), fe());
    }
    function Fl() {
      const l = document.activeElement;
      ((l === null || l.id !== t.targetUid.value) &&
        L.value !== null &&
        L.value !== l &&
        L.value.focus(),
        ye());
    }
    function se() {
      O.value ||
        ((y.value = -1),
        a.value && (a.value = !1),
        t.focused.value ||
          (s !== null && (clearTimeout(s), (s = null)),
          t.innerLoading.value && (c('filterAbort'), (t.innerLoading.value = !1), (r.value = !1))));
    }
    function de(l) {
      t.editable.value &&
        (q
          ? (t.onControlFocusin(l),
            (O.value = !0),
            Y(() => {
              t.focus();
            }))
          : t.focus(),
        e.onFilter !== void 0
          ? re(g.value)
          : (!F.value || u['no-option'] !== void 0) && (a.value = !0));
    }
    function ne() {
      ((O.value = !1), se());
    }
    function fe() {
      e.useInput &&
        Ce(
          (!e.multiple && e.fillInput && i.value.length !== 0 && K.value(i.value[0])) || '',
          !0,
          !0,
        );
    }
    function De(l) {
      let n = -1;
      if (l) {
        if (i.value.length !== 0) {
          const o = Q.value(i.value[0]);
          n = e.options.findIndex((v) => ke(Q.value(v), o));
        }
        j(n);
      }
      ce(n);
    }
    function Bl(l, n) {
      a.value &&
        !t.innerLoading.value &&
        (j(-1, !0),
        Y(() => {
          a.value && !t.innerLoading.value && (l > n ? j() : De(!0));
        }));
    }
    function il() {
      O.value || J.value?.updatePosition();
    }
    function ol(l) {
      (l !== void 0 && ve(l), c('popupShow', l), (t.hasPopupOpen = !0), t.onControlFocusin(l));
    }
    function al(l) {
      (l !== void 0 && ve(l), c('popupHide', l), (t.hasPopupOpen = !1), t.onControlFocusout(l));
    }
    function ul() {
      ((q =
        !B.platform.is.mobile && e.behavior !== 'dialog'
          ? !1
          : e.behavior !== 'menu' &&
            (e.useInput ? u['no-option'] !== void 0 || e.onFilter !== void 0 || !F.value : !0)),
        (W = B.platform.is.ios && q && e.useInput ? 'fade' : e.transitionShow));
    }
    return (
      Wl(ul),
      Xl(il),
      ul(),
      hl(() => {
        (w !== null && clearTimeout(w), C !== null && clearTimeout(C));
      }),
      Object.assign(f, {
        showPopup: de,
        hidePopup: ne,
        removeAtIndex: Te,
        add: Xe,
        toggleOption: te,
        getOptionIndex: () => y.value,
        setOptionIndex: ce,
        moveOptionSelection: _e,
        filter: re,
        updateMenuPosition: il,
        updateInputValue: Ce,
        isOptionSelected: He,
        getEmittingOptionValue: We,
        isOptionDisabled: (...l) => ue.value(...l) === !0,
        getOptionValue: (...l) => Q.value(...l),
        getOptionLabel: (...l) => K.value(...l),
      }),
      Object.assign(t, {
        innerValue: i,
        fieldClass: d(
          () =>
            `q-select q-field--auto-height q-select--with${e.useInput ? '' : 'out'}-input q-select--with${e.useChips ? '' : 'out'}-chips q-select--${e.multiple ? 'multiple' : 'single'}`,
        ),
        inputRef: pe,
        targetRef: L,
        hasValue: _,
        showPopup: de,
        floatingLabel: d(
          () =>
            (!e.hideSelected && _.value) ||
            typeof g.value == 'number' ||
            g.value.length !== 0 ||
            cl(e.displayValue),
        ),
        getControlChild: () => {
          if (t.editable.value && (O.value || !F.value || u['no-option'] !== void 0))
            return q ? Ml() : pl();
          t.hasPopupOpen && (t.hasPopupOpen = !1);
        },
        controlEvents: {
          onFocusin(l) {
            t.onControlFocusin(l);
          },
          onFocusout(l) {
            t.onControlFocusout(l, () => {
              (fe(), se());
            });
          },
          onClick(l) {
            if ((Ne(l), !q && a.value)) {
              (se(), L.value?.focus());
              return;
            }
            de(l);
          },
        },
        getControl: (l) => {
          const n = kl(),
            o = l === !0 || !O.value || !q;
          if (e.useInput) n.push(xl(l, o));
          else if (t.editable.value) {
            const p = o ? Ie.value : void 0;
            (n.push(
              b('input', {
                ref: o ? L : void 0,
                key: 'd_t',
                class: 'q-select__focus-target',
                id: o ? t.targetUid.value : void 0,
                value: N.value,
                readonly: !0,
                'data-autofocus': l === !0 || e.autofocus || void 0,
                ...p,
                onKeydown: el,
                onKeyup: Je,
                onKeypress: Ze,
              }),
            ),
              o &&
                typeof e.autocomplete == 'string' &&
                e.autocomplete.length !== 0 &&
                n.push(
                  b('input', {
                    class: 'q-select__autocomplete-input',
                    autocomplete: e.autocomplete,
                    tabindex: -1,
                    onKeyup: Ge,
                  }),
                ));
          }
          if (Z.value !== void 0 && !e.disable && Oe.value.length !== 0) {
            const p = Oe.value.map((x) => b('option', { value: x, selected: !0 }));
            n.push(b('select', { class: 'hidden', name: Z.value, multiple: e.multiple }, p));
          }
          const v = e.useInput || !o ? void 0 : t.splitAttrs.attributes.value;
          return b(
            'div',
            { class: 'q-field__native row items-center', ...v, ...t.splitAttrs.listeners.value },
            n,
          );
        },
        getInnerAppend: () =>
          !e.loading && !r.value && !e.hideDropdownIcon
            ? [
                b(Be, {
                  class: 'q-select__dropdown-icon' + (a.value ? ' rotate-180' : ''),
                  name: we.value,
                }),
              ]
            : null,
      }),
      ml(t)
    );
  },
});
export { ct as Q, at as a, yt as b, dt as c, bt as d, Re as r, dl as u };
