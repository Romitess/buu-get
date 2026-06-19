import {
  aa as D,
  ab as y,
  ac as m,
  ad as C,
  v as P,
  ae as h,
  ag as b,
  aS as q,
  aI as g,
  ah as S,
  af as X,
} from './index-CKSooU2k.js';
import { g as w, s as _ } from './touch-CAyG4izs.js';
import { c as Y } from './position-engine-Bv76xS6k.js';
function E(l, i, s) {
  const u = b(l);
  let e,
    t = u.left - i.event.x,
    n = u.top - i.event.y,
    r = Math.abs(t),
    a = Math.abs(n);
  const o = i.direction;
  o.horizontal && !o.vertical
    ? (e = t < 0 ? 'left' : 'right')
    : !o.horizontal && o.vertical
      ? (e = n < 0 ? 'up' : 'down')
      : o.up && n < 0
        ? ((e = 'up'),
          r > a && (o.left && t < 0 ? (e = 'left') : o.right && t > 0 && (e = 'right')))
        : o.down && n > 0
          ? ((e = 'down'),
            r > a && (o.left && t < 0 ? (e = 'left') : o.right && t > 0 && (e = 'right')))
          : o.left && t < 0
            ? ((e = 'left'),
              r < a && (o.up && n < 0 ? (e = 'up') : o.down && n > 0 && (e = 'down')))
            : o.right &&
              t > 0 &&
              ((e = 'right'),
              r < a && (o.up && n < 0 ? (e = 'up') : o.down && n > 0 && (e = 'down')));
  let v = !1;
  if (e === void 0 && !s) {
    if (i.event.isFirst || i.event.lastDir === void 0) return {};
    ((e = i.event.lastDir),
      (v = !0),
      e === 'left' || e === 'right'
        ? ((u.left -= t), (r = 0), (t = 0))
        : ((u.top -= n), (a = 0), (n = 0)));
  }
  return {
    synthetic: v,
    payload: {
      evt: l,
      touch: i.event.mouse !== !0,
      mouse: i.event.mouse === !0,
      position: u,
      direction: e,
      isFirst: i.event.isFirst,
      isFinal: s === !0,
      duration: Date.now() - i.event.time,
      distance: { x: r, y: a },
      offset: { x: t, y: n },
      delta: { x: u.left - i.event.lastX, y: u.top - i.event.lastY },
    },
  };
}
function M() {
  document.body.classList.remove('no-pointer-events--children');
}
let F = 0;
const T = D({
  name: 'touch-pan',
  beforeMount(l, { value: i, modifiers: s }) {
    if (!s.mouse && !m.has.touch) return;
    function u(t, n) {
      s.mouse && n ? X(t) : (s.stop && g(t), s.prevent && q(t));
    }
    const e = {
      uid: 'qvtp_' + F++,
      handler: i,
      modifiers: s,
      direction: w(s),
      noop: P,
      mouseStart(t) {
        _(t, e) &&
          S(t) &&
          (h(e, 'temp', [
            [document, 'mousemove', 'move', 'notPassiveCapture'],
            [document, 'mouseup', 'end', 'passiveCapture'],
          ]),
          e.start(t, !0));
      },
      touchStart(t) {
        if (_(t, e)) {
          const n = t.target;
          (h(e, 'temp', [
            [n, 'touchmove', 'move', 'notPassiveCapture'],
            [n, 'touchcancel', 'end', 'passiveCapture'],
            [n, 'touchend', 'end', 'passiveCapture'],
          ]),
            e.start(t));
        }
      },
      start(t, n) {
        if ((m.is.firefox && C(l, !0), (e.lastEvt = t), n || s.stop)) {
          if (!e.direction.all && (!n || (!e.modifiers.mouseAllDir && !e.modifiers.mousealldir))) {
            const o = t.type.includes('mouse')
              ? new MouseEvent(t.type, t)
              : new TouchEvent(t.type, t);
            (t.defaultPrevented && q(o),
              t.cancelBubble && g(o),
              Object.assign(o, {
                qKeyEvent: t.qKeyEvent,
                qClickOutside: t.qClickOutside,
                qAnchorHandled: t.qAnchorHandled,
                qClonedBy: t.qClonedBy === void 0 ? [e.uid] : t.qClonedBy.concat(e.uid),
              }),
              (e.initialEvent = { target: t.target, event: o }));
          }
          g(t);
        }
        const { left: r, top: a } = b(t);
        e.event = {
          x: r,
          y: a,
          time: Date.now(),
          mouse: n === !0,
          detected: !1,
          isFirst: !0,
          isFinal: !1,
          lastX: r,
          lastY: a,
        };
      },
      move(t) {
        if (e.event === void 0) return;
        const n = b(t),
          r = n.left - e.event.x,
          a = n.top - e.event.y;
        if (r === 0 && a === 0) return;
        e.lastEvt = t;
        const o = e.event.mouse === !0,
          v = () => {
            u(t, o);
            let d;
            (!s.preserveCursor &&
              !s.preservecursor &&
              ((d = document.documentElement.style.cursor || ''),
              (document.documentElement.style.cursor = 'grabbing')),
              o && document.body.classList.add('no-pointer-events--children'),
              document.body.classList.add('non-selectable'),
              Y(),
              (e.styleCleanup = (p) => {
                ((e.styleCleanup = void 0),
                  d !== void 0 && (document.documentElement.style.cursor = d),
                  document.body.classList.remove('non-selectable'),
                  o
                    ? p !== void 0
                      ? setTimeout(() => {
                          (M(), p());
                        }, 50)
                      : M()
                    : p !== void 0 && p());
              }));
          };
        if (e.event.detected) {
          e.event.isFirst || u(t, e.event.mouse);
          const { payload: d, synthetic: p } = E(t, e, !1);
          d !== void 0 &&
            (e.handler(d) === !1
              ? e.end(t)
              : (e.styleCleanup === void 0 && e.event.isFirst && v(),
                (e.event.lastX = d.position.left),
                (e.event.lastY = d.position.top),
                (e.event.lastDir = p ? void 0 : d.direction),
                (e.event.isFirst = !1)));
          return;
        }
        if (e.direction.all || (o && (e.modifiers.mouseAllDir || e.modifiers.mousealldir))) {
          (v(), (e.event.detected = !0), e.move(t));
          return;
        }
        const c = Math.abs(r),
          f = Math.abs(a);
        c !== f &&
          ((e.direction.horizontal && c > f) ||
          (e.direction.vertical && c < f) ||
          (e.direction.up && c < f && a < 0) ||
          (e.direction.down && c < f && a > 0) ||
          (e.direction.left && c > f && r < 0) ||
          (e.direction.right && c > f && r > 0)
            ? ((e.event.detected = !0), e.move(t))
            : e.end(t, !0));
      },
      end(t, n) {
        if (e.event !== void 0) {
          if ((y(e, 'temp'), m.is.firefox && C(l, !1), n))
            (e.styleCleanup?.(),
              !e.event.detected &&
                e.initialEvent !== void 0 &&
                e.initialEvent.target.dispatchEvent(e.initialEvent.event));
          else if (e.event.detected) {
            e.event.isFirst && e.handler(E(t === void 0 ? e.lastEvt : t, e).payload);
            const { payload: r } = E(t === void 0 ? e.lastEvt : t, e, !0),
              a = () => {
                e.handler(r);
              };
            e.styleCleanup !== void 0 ? e.styleCleanup(a) : a();
          }
          ((e.event = void 0), (e.initialEvent = void 0), (e.lastEvt = void 0));
        }
      },
    };
    if (((l.__qtouchpan = e), s.mouse)) {
      const t = s.mouseCapture || s.mousecapture ? 'Capture' : '';
      h(e, 'main', [[l, 'mousedown', 'mouseStart', `passive${t}`]]);
    }
    m.has.touch &&
      h(e, 'main', [
        [l, 'touchstart', 'touchStart', `passive${s.capture ? 'Capture' : ''}`],
        [l, 'touchmove', 'noop', 'notPassiveCapture'],
      ]);
  },
  updated(l, i) {
    const s = l.__qtouchpan;
    s !== void 0 &&
      (i.oldValue !== i.value && (typeof value != 'function' && s.end(), (s.handler = i.value)),
      (s.direction = w(i.modifiers)));
  },
  beforeUnmount(l) {
    const i = l.__qtouchpan;
    i !== void 0 &&
      (i.event !== void 0 && i.end(),
      y(i, 'main'),
      y(i, 'temp'),
      m.is.firefox && C(l, !1),
      i.styleCleanup?.(),
      delete l.__qtouchpan);
  },
});
export { T };
