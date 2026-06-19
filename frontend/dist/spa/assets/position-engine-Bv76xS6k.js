import {
  bB as I,
  g as K,
  aS as A,
  ae as k,
  I as N,
  ba as Q,
  w as W,
  t as X,
  o as P,
  r as j,
  ab as Y,
  q as S,
  bC as $,
  ac as D,
  z as U,
} from './index-CKSooU2k.js';
function G() {
  if (window.getSelection !== void 0) {
    const t = window.getSelection();
    t.empty !== void 0
      ? t.empty()
      : t.removeAllRanges !== void 0 &&
        (t.removeAllRanges(), I.is.mobile || t.addRange(document.createRange()));
  } else document.selection !== void 0 && document.selection.empty();
}
const J = { target: { type: [Boolean, String, Element], default: !0 }, noParentEvent: Boolean },
  it = { ...J, contextMenu: Boolean };
function ot({ showing: t, avoidEmit: l, configureAnchorEl: n }) {
  const { props: e, proxy: a, emit: u } = K(),
    o = j(null);
  let c = null;
  function d(i) {
    return o.value === null ? !1 : i === void 0 || i.touches === void 0 || i.touches.length <= 1;
  }
  const s = {};
  n === void 0 &&
    (Object.assign(s, {
      hide(i) {
        a.hide(i);
      },
      toggle(i) {
        (a.toggle(i), (i.qAnchorHandled = !0));
      },
      toggleKey(i) {
        Q(i, 13) && s.toggle(i);
      },
      contextClick(i) {
        (a.hide(i),
          A(i),
          N(() => {
            (a.show(i), (i.qAnchorHandled = !0));
          }));
      },
      prevent: A,
      mobileTouch(i) {
        if ((s.mobileCleanup(i), !d(i))) return;
        (a.hide(i), o.value.classList.add('non-selectable'));
        const r = i.target;
        (k(s, 'anchor', [
          [r, 'touchmove', 'mobileCleanup', 'passive'],
          [r, 'touchend', 'mobileCleanup', 'passive'],
          [r, 'touchcancel', 'mobileCleanup', 'passive'],
          [o.value, 'contextmenu', 'prevent', 'notPassive'],
        ]),
          (c = setTimeout(() => {
            ((c = null), a.show(i), (i.qAnchorHandled = !0));
          }, 300)));
      },
      mobileCleanup(i) {
        (o.value.classList.remove('non-selectable'),
          c !== null && (clearTimeout(c), (c = null)),
          t.value && i !== void 0 && G());
      },
    }),
    (n = function (r = e.contextMenu) {
      if (e.noParentEvent || o.value === null) return;
      const E = r
        ? a.$q.platform.is.mobile
          ? [[o.value, 'touchstart', 'mobileTouch', 'passive']]
          : [
              [o.value, 'mousedown', 'hide', 'passive'],
              [o.value, 'contextmenu', 'contextClick', 'notPassive'],
            ]
        : [
            [o.value, 'click', 'toggle', 'passive'],
            [o.value, 'keyup', 'toggleKey', 'passive'],
          ];
      k(s, 'anchor', E);
    }));
  function f() {
    Y(s, 'anchor');
  }
  function y(i) {
    for (o.value = i; o.value.classList.contains('q-anchor--skip'); ) o.value = o.value.parentNode;
    n();
  }
  function p() {
    if (e.target === !1 || e.target === '' || a.$el.parentNode === null) o.value = null;
    else if (e.target === !0) y(a.$el.parentNode);
    else {
      let i = e.target;
      if (typeof e.target == 'string')
        try {
          i = document.querySelector(e.target);
        } catch {
          i = void 0;
        }
      i != null
        ? ((o.value = i.$el || i), n())
        : ((o.value = null), console.error(`Anchor: target "${e.target}" not found`));
    }
  }
  return (
    W(
      () => e.contextMenu,
      (i) => {
        o.value !== null && (f(), n(i));
      },
    ),
    W(
      () => e.target,
      () => {
        (o.value !== null && f(), p());
      },
    ),
    W(
      () => e.noParentEvent,
      (i) => {
        o.value !== null && (i ? f() : n());
      },
    ),
    X(() => {
      (p(), !l && e.modelValue && o.value === null && u('update:modelValue', !1));
    }),
    P(() => {
      (c !== null && clearTimeout(c), f());
    }),
    { anchorEl: o, canShow: d, anchorEvents: s }
  );
}
function at(t, l) {
  const n = j(null);
  let e;
  function a(c, d) {
    const s = `${d !== void 0 ? 'add' : 'remove'}EventListener`,
      f = d !== void 0 ? d : e;
    (c !== window && c[s]('scroll', f, S.passive), window[s]('scroll', f, S.passive), (e = d));
  }
  function u() {
    n.value !== null && (a(n.value), (n.value = null));
  }
  const o = W(
    () => t.noParentEvent,
    () => {
      n.value !== null && (u(), l());
    },
  );
  return (P(o), { localScrollTarget: n, unconfigureScrollTarget: u, changeScrollEvent: a });
}
const { notPassiveCapture: M } = S,
  g = [];
function T(t) {
  const l = t.target;
  if (l === void 0 || l.nodeType === 8 || l.classList.contains('no-pointer-events')) return;
  let n = $.length - 1;
  for (; n >= 0; ) {
    const e = $[n].$;
    if (e.type.name === 'QTooltip') {
      n--;
      continue;
    }
    if (e.type.name !== 'QDialog') break;
    if (!e.props.seamless) return;
    n--;
  }
  for (let e = g.length - 1; e >= 0; e--) {
    const a = g[e];
    if (
      (a.anchorEl.value === null || !a.anchorEl.value.contains(l)) &&
      (l === document.body || (a.innerRef.value !== null && !a.innerRef.value.contains(l)))
    )
      ((t.qClickOutside = !0), a.onClickOutside(t));
    else return;
  }
}
function st(t) {
  (g.push(t),
    g.length === 1 &&
      (document.addEventListener('mousedown', T, M),
      document.addEventListener('touchstart', T, M)));
}
function rt(t) {
  const l = g.indexOf(t);
  l !== -1 &&
    (g.splice(l, 1),
    g.length === 0 &&
      (document.removeEventListener('mousedown', T, M),
      document.removeEventListener('touchstart', T, M)));
}
let q, B;
const Z = ['top', 'center', 'bottom'],
  _ = ['left', 'middle', 'right', 'start', 'end'];
function ut(t) {
  const l = t.split(' ');
  return l.length !== 2
    ? !1
    : Z.includes(l[0])
      ? _.includes(l[1])
        ? !0
        : (console.error('Anchor/Self position must end with one of left/middle/right/start/end'),
          !1)
      : (console.error('Anchor/Self position must start with one of top/center/bottom'), !1);
}
function ct(t) {
  return t ? !(t.length !== 2 || typeof t[0] != 'number' || typeof t[1] != 'number') : !0;
}
const z = { 'start#ltr': 'left', 'start#rtl': 'right', 'end#ltr': 'right', 'end#rtl': 'left' };
['left', 'middle', 'right'].forEach((t) => {
  ((z[`${t}#ltr`] = t), (z[`${t}#rtl`] = t));
});
function dt(t, l) {
  const n = t.split(' ');
  return { vertical: n[0], horizontal: z[`${n[1]}#${l ? 'rtl' : 'ltr'}`] };
}
function O(t, l) {
  let { top: n, left: e, right: a, bottom: u, width: o, height: c } = t.getBoundingClientRect();
  return (
    l !== void 0 && ((n -= l[1]), (e -= l[0]), (u += l[1]), (a += l[0]), (o += l[0]), (c += l[1])),
    {
      top: n,
      bottom: u,
      height: c,
      left: e,
      right: a,
      width: o,
      middle: e + (a - e) / 2,
      center: n + (u - n) / 2,
    }
  );
}
function tt(t, l, n) {
  let { top: e, left: a } = t.getBoundingClientRect();
  return (
    (e += l.top),
    (a += l.left),
    n !== void 0 && ((e += n[1]), (a += n[0])),
    { top: e, bottom: e + 1, height: 1, left: a, right: a + 1, width: 1, middle: a, center: e }
  );
}
function et(t, l) {
  return { top: 0, center: l / 2, bottom: l, left: 0, middle: t / 2, right: t };
}
function R(t, l, n, e) {
  return { top: t[n.vertical] - l[e.vertical], left: t[n.horizontal] - l[e.horizontal] };
}
function lt(t, l = 0) {
  if (t.targetEl === null || t.anchorEl === null || l > 5) return;
  if (t.targetEl.offsetHeight === 0 || t.targetEl.offsetWidth === 0) {
    setTimeout(() => {
      lt(t, l + 1);
    }, 10);
    return;
  }
  const {
    targetEl: n,
    offset: e,
    anchorEl: a,
    anchorOrigin: u,
    selfOrigin: o,
    absoluteOffset: c,
    fit: d,
    cover: s,
    maxHeight: f,
    maxWidth: y,
  } = t;
  if (D.is.ios && window.visualViewport !== void 0) {
    const H = document.body.style,
      { offsetLeft: b, offsetTop: v } = window.visualViewport;
    (b !== q && (H.setProperty('--q-pe-left', b + 'px'), (q = b)),
      v !== B && (H.setProperty('--q-pe-top', v + 'px'), (B = v)));
  }
  const { scrollLeft: p, scrollTop: i } = n,
    r = c === void 0 ? O(a, s ? [0, 0] : e) : tt(a, c, e);
  Object.assign(n.style, {
    top: 0,
    left: 0,
    minWidth: null,
    minHeight: null,
    maxWidth: y,
    maxHeight: f,
    visibility: 'visible',
  });
  const { offsetWidth: E, offsetHeight: C } = n,
    { elWidth: V, elHeight: F } =
      d || s
        ? { elWidth: Math.max(r.width, E), elHeight: s ? Math.max(r.height, C) : C }
        : { elWidth: E, elHeight: C };
  let m = { maxWidth: y, maxHeight: f };
  ((d || s) && ((m.minWidth = r.width + 'px'), s && (m.minHeight = r.height + 'px')),
    Object.assign(n.style, m));
  const x = et(V, F);
  let h = R(r, x, u, o);
  if (c === void 0 || e === void 0) L(h, r, x, u, o);
  else {
    const { top: H, left: b } = h;
    L(h, r, x, u, o);
    let v = !1;
    if (h.top !== H) {
      v = !0;
      const w = 2 * e[1];
      ((r.center = r.top -= w), (r.bottom -= w + 2));
    }
    if (h.left !== b) {
      v = !0;
      const w = 2 * e[0];
      ((r.middle = r.left -= w), (r.right -= w + 2));
    }
    v && ((h = R(r, x, u, o)), L(h, r, x, u, o));
  }
  ((m = { top: h.top + 'px', left: h.left + 'px' }),
    h.maxHeight !== void 0 &&
      ((m.maxHeight = h.maxHeight + 'px'), r.height > h.maxHeight && (m.minHeight = m.maxHeight)),
    h.maxWidth !== void 0 &&
      ((m.maxWidth = h.maxWidth + 'px'), r.width > h.maxWidth && (m.minWidth = m.maxWidth)),
    Object.assign(n.style, m),
    n.scrollTop !== i && (n.scrollTop = i),
    n.scrollLeft !== p && (n.scrollLeft = p));
}
function L(t, l, n, e, a) {
  const u = n.bottom,
    o = n.right,
    c = U(),
    d = window.innerHeight - c,
    s = document.body.clientWidth;
  if (t.top < 0 || t.top + u > d)
    if (a.vertical === 'center')
      ((t.top = l[e.vertical] > d / 2 ? Math.max(0, d - u) : 0), (t.maxHeight = Math.min(u, d)));
    else if (l[e.vertical] > d / 2) {
      const f = Math.min(
        d,
        e.vertical === 'center' ? l.center : e.vertical === a.vertical ? l.bottom : l.top,
      );
      ((t.maxHeight = Math.min(u, f)), (t.top = Math.max(0, f - u)));
    } else
      ((t.top = Math.max(
        0,
        e.vertical === 'center' ? l.center : e.vertical === a.vertical ? l.top : l.bottom,
      )),
        (t.maxHeight = Math.min(u, d - t.top)));
  if (t.left < 0 || t.left + o > s)
    if (((t.maxWidth = Math.min(o, s)), a.horizontal === 'middle'))
      t.left = l[e.horizontal] > s / 2 ? Math.max(0, s - o) : 0;
    else if (l[e.horizontal] > s / 2) {
      const f = Math.min(
        s,
        e.horizontal === 'middle' ? l.middle : e.horizontal === a.horizontal ? l.right : l.left,
      );
      ((t.maxWidth = Math.min(o, f)), (t.left = Math.max(0, f - t.maxWidth)));
    } else
      ((t.left = Math.max(
        0,
        e.horizontal === 'middle' ? l.middle : e.horizontal === a.horizontal ? l.left : l.right,
      )),
        (t.maxWidth = Math.min(o, s - t.left)));
}
export {
  ut as a,
  at as b,
  G as c,
  ot as d,
  st as e,
  J as f,
  dt as p,
  rt as r,
  lt as s,
  it as u,
  ct as v,
};
