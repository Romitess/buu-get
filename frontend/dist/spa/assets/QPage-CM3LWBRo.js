import {
  c as u,
  g as h,
  i as s,
  e as n,
  l as p,
  j as d,
  h as f,
  a as y,
  f as r,
} from './index-CKSooU2k.js';
const C = u({
  name: 'QPage',
  props: { padding: Boolean, styleFn: Function },
  setup(a, { slots: i }) {
    const {
        proxy: { $q: o },
      } = h(),
      e = s(p, n);
    if (e === n) return (console.error('QPage needs to be a deep child of QLayout'), n);
    if (s(d, n) === n) return (console.error('QPage needs to be child of QPageContainer'), n);
    const c = r(() => {
        const t = (e.header.space ? e.header.size : 0) + (e.footer.space ? e.footer.size : 0);
        if (typeof a.styleFn == 'function') {
          const g = e.isContainer.value ? e.containerHeight.value : o.screen.height;
          return a.styleFn(t, g);
        }
        return {
          minHeight: e.isContainer.value
            ? e.containerHeight.value - t + 'px'
            : o.screen.height === 0
              ? t !== 0
                ? `calc(100vh - ${t}px)`
                : '100vh'
              : o.screen.height - t + 'px',
        };
      }),
      l = r(() => `q-page${a.padding ? ' q-layout-padding' : ''}`);
    return () => f('main', { class: l.value, style: c.value }, y(i.default));
  },
});
export { C as Q };
