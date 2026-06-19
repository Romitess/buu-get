import { c as u, D as v, g as b, h as e, a as o, f as r, M as q } from './index-CKSooU2k.js';
const f = u({
  name: 'QBanner',
  props: { ...v, inlineActions: Boolean, dense: Boolean, rounded: Boolean },
  setup(n, { slots: a }) {
    const {
        proxy: { $q: c },
      } = b(),
      i = q(n, c),
      d = r(
        () =>
          'q-banner row items-center' +
          (n.dense ? ' q-banner--dense' : '') +
          (i.value ? ' q-banner--dark q-dark' : '') +
          (n.rounded ? ' rounded-borders' : ''),
      ),
      l = r(
        () =>
          `q-banner__actions row items-center justify-end col-${n.inlineActions ? 'auto' : 'all'}`,
      );
    return () => {
      const s = [
          e('div', { class: 'q-banner__avatar col-auto row items-center self-start' }, o(a.avatar)),
          e('div', { class: 'q-banner__content col text-body2' }, o(a.default)),
        ],
        t = o(a.action);
      return (
        t !== void 0 && s.push(e('div', { class: l.value }, t)),
        e(
          'div',
          {
            class: d.value + (!n.inlineActions && t !== void 0 ? ' q-banner--top-padding' : ''),
            role: 'alert',
          },
          s,
        )
      );
    };
  },
});
export { f as Q };
