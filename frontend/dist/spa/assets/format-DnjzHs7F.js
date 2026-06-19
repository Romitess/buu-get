import {
  c as ae,
  C as se,
  s as ie,
  bs as le,
  D as ue,
  E as ce,
  bc as re,
  F as fe,
  G as de,
  bt as ve,
  w as M,
  bu as ge,
  bv as D,
  bw as he,
  ag as me,
  bx as be,
  n as Pe,
  h as A,
  a as Te,
  ai as Se,
  o as ye,
  g as Ce,
  r as R,
  f as c,
  by as ke,
  b7 as xe,
  bz as Be,
  M as Ee,
  bA as Oe,
  af as qe,
} from './index-CKSooU2k.js';
import {
  v as Fe,
  a as K,
  u as we,
  b as Me,
  d as De,
  e as Ae,
  r as z,
  s as Re,
  p as H,
} from './position-engine-Bv76xS6k.js';
const He = ae({
    name: 'QMenu',
    inheritAttrs: !1,
    props: {
      ...we,
      ...ce,
      ...ue,
      ...le,
      persistent: Boolean,
      autoClose: Boolean,
      separateClosePopup: Boolean,
      noEscDismiss: Boolean,
      noRouteDismiss: Boolean,
      noRefocus: Boolean,
      noFocus: Boolean,
      fit: Boolean,
      cover: Boolean,
      square: Boolean,
      anchor: { type: String, validator: K },
      self: { type: String, validator: K },
      offset: { type: Array, validator: Fe },
      scrollTarget: ie,
      touchPosition: Boolean,
      maxHeight: { type: String, default: null },
      maxWidth: { type: String, default: null },
    },
    emits: [...se, 'click', 'escapeKey'],
    setup(e, { slots: o, emit: n, attrs: l }) {
      let a = null,
        v,
        r,
        g;
      const S = Ce(),
        { proxy: h } = S,
        { $q: s } = h,
        i = R(null),
        u = R(!1),
        Q = c(() => !e.persistent && !e.noRouteDismiss),
        W = Ee(e, s),
        { registerTick: $, removeTick: G } = re(),
        { registerTimeout: y } = fe(),
        { transitionProps: U, transitionStyle: _ } = ke(e),
        { localScrollTarget: C, changeScrollEvent: j, unconfigureScrollTarget: L } = Me(e, F),
        { anchorEl: f, canShow: N } = De({ showing: u }),
        { hide: k } = de({
          showing: u,
          canShow: N,
          handleShow: Z,
          handleHide: p,
          hideOnRouteChange: Q,
          processOnMount: !0,
        }),
        { showPortal: x, hidePortal: B, renderPortal: J } = ve(S, i, te, 'menu'),
        m = {
          anchorEl: f,
          innerRef: i,
          onClickOutside(t) {
            if (!e.persistent && u.value)
              return (
                k(t),
                (t.type === 'touchstart' || t.target.classList.contains('q-dialog__backdrop')) &&
                  qe(t),
                !0
              );
          },
        },
        E = c(() => H(e.anchor || (e.cover ? 'center middle' : 'bottom start'), s.lang.rtl)),
        V = c(() => (e.cover ? E.value : H(e.self || 'top start', s.lang.rtl))),
        X = c(() => (e.square ? ' q-menu--square' : '') + (W.value ? ' q-menu--dark q-dark' : '')),
        Y = c(() => (e.autoClose ? { onClick: ee } : {})),
        O = c(() => u.value && !e.persistent);
      M(O, (t) => {
        t ? (ge(P), Ae(m)) : (D(P), z(m));
      });
      function b() {
        xe(() => {
          let t = i.value;
          t &&
            !t.contains(document.activeElement) &&
            ((t =
              t.querySelector('[autofocus][tabindex], [data-autofocus][tabindex]') ||
              t.querySelector('[autofocus] [tabindex], [data-autofocus] [tabindex]') ||
              t.querySelector('[autofocus], [data-autofocus]') ||
              t),
            t.focus({ preventScroll: !0 }));
        });
      }
      function Z(t) {
        if (
          ((a = e.noRefocus ? null : document.activeElement),
          he(w),
          x(),
          F(),
          (v = void 0),
          t !== void 0 && (e.touchPosition || e.contextMenu))
        ) {
          const T = me(t);
          if (T.left !== void 0) {
            const { top: oe, left: ne } = f.value.getBoundingClientRect();
            v = { left: T.left - ne, top: T.top - oe };
          }
        }
        (r === void 0 &&
          (r = M(
            () =>
              s.screen.width +
              '|' +
              s.screen.height +
              '|' +
              e.self +
              '|' +
              e.anchor +
              '|' +
              s.lang.rtl,
            d,
          )),
          e.noFocus || document.activeElement.blur(),
          $(() => {
            (d(), e.noFocus || b());
          }),
          y(() => {
            (s.platform.is.ios && ((g = e.autoClose), i.value.click()), d(), x(!0), n('show', t));
          }, e.transitionDuration));
      }
      function p(t) {
        (G(),
          B(),
          q(!0),
          a !== null &&
            (t === void 0 || !t.qClickOutside) &&
            ((
              (t?.type.indexOf('key') === 0
                ? a.closest('[tabindex]:not([tabindex^="-"])')
                : void 0) || a
            ).focus(),
            (a = null)),
          y(() => {
            (B(!0), n('hide', t));
          }, e.transitionDuration));
      }
      function q(t) {
        ((v = void 0),
          r !== void 0 && (r(), (r = void 0)),
          (t || u.value) && (be(w), L(), z(m), D(P)),
          t || (a = null));
      }
      function F() {
        (f.value !== null || e.scrollTarget !== void 0) &&
          ((C.value = Pe(f.value, e.scrollTarget)), j(C.value, d));
      }
      function ee(t) {
        g ? (g = !1) : (Be(h, t), n('click', t));
      }
      function w(t) {
        O.value && !e.noFocus && !Oe(i.value, t.target) && b();
      }
      function P(t) {
        e.noEscDismiss || (n('escapeKey'), k(t));
      }
      function d() {
        Re({
          targetEl: i.value,
          offset: e.offset,
          anchorEl: f.value,
          anchorOrigin: E.value,
          selfOrigin: V.value,
          absoluteOffset: v,
          fit: e.fit,
          cover: e.cover,
          maxHeight: e.maxHeight,
          maxWidth: e.maxWidth,
        });
      }
      function te() {
        return A(Se, U.value, () =>
          u.value
            ? A(
                'div',
                {
                  role: 'menu',
                  ...l,
                  ref: i,
                  tabindex: -1,
                  class: ['q-menu q-position-engine scroll' + X.value, l.class],
                  style: [l.style, _.value],
                  ...Y.value,
                },
                Te(o.default),
              )
            : null,
        );
      }
      return (
        ye(() => {
          q();
        }),
        Object.assign(h, { focus: b, updatePosition: d }),
        J
      );
    },
  }),
  I = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
function Ie(e, o = 1) {
  let n = 0;
  for (; Number.parseInt(e, 10) >= 1024 && n < I.length - 1; ) ((e /= 1024), ++n);
  return `${e.toFixed(o)}${I[n]}`;
}
function Qe(e) {
  return e.at(0).toUpperCase() + e.slice(1);
}
function We(e, o, n) {
  return n <= o ? o : Math.min(n, Math.max(o, e));
}
function $e(e, o, n) {
  if (n <= o) return o;
  const l = n - o + 1;
  let a = o + ((e - o) % l);
  return (a < o && (a = l + a), a === 0 ? 0 : a);
}
function Ge(e, o = 2, n = '0') {
  return e == null ? e : String(e).padStart(o, n);
}
export { He as Q, We as b, Qe as c, Ie as h, $e as n, Ge as p };
