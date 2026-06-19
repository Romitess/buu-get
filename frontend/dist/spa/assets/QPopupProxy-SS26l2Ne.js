import {
  c as P,
  g as b,
  r as p,
  w as x,
  aO as y,
  h as Q,
  f as h,
  au as C,
} from './index-CKSooU2k.js';
import { Q as j } from './format-DnjzHs7F.js';
import { u as k, d as M } from './position-engine-Bv76xS6k.js';
const E = P({
  name: 'QPopupProxy',
  props: { ...k, breakpoint: { type: [String, Number], default: 450 } },
  emits: ['show', 'hide'],
  setup(a, { slots: f, emit: c, attrs: g }) {
    const { proxy: u } = b(),
      { $q: i } = u,
      n = p(!1),
      t = p(null),
      l = h(() => Number.parseInt(a.breakpoint, 10)),
      { canShow: m } = M({ showing: n, avoidEmit: !0 });
    function r() {
      return i.screen.width < l.value || i.screen.height < l.value ? 'dialog' : 'menu';
    }
    const o = p(r()),
      v = h(() => (o.value === 'menu' ? { maxHeight: '99vh' } : {}));
    x(
      () => r(),
      (e) => {
        n.value || (o.value = e);
      },
    );
    function d(e) {
      ((n.value = !0), c('show', e));
    }
    function w(e) {
      ((n.value = !1), (o.value = r()), c('hide', e));
    }
    return (
      Object.assign(u, {
        show(e) {
          m(e) && t.value.show(e);
        },
        hide(e) {
          t.value.hide(e);
        },
        toggle(e) {
          t.value.toggle(e);
        },
      }),
      y(u, 'currentComponent', () => ({ type: o.value, ref: t.value })),
      () => {
        const e = { ref: t, ...v.value, ...g, onShow: d, onHide: w };
        let s;
        return (
          o.value === 'dialog'
            ? (s = C)
            : ((s = j),
              Object.assign(e, {
                target: a.target,
                contextMenu: a.contextMenu,
                noParentEvent: !0,
                separateClosePopup: !0,
              })),
          Q(s, e, f.default)
        );
      }
    );
  },
});
export { E as Q };
