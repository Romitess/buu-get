import { c as r, D as d, M as i, h as c, a as u, g, f as t } from './index-CKSooU2k.js';
const q = ['ul', 'ol'],
  p = r({
    name: 'QList',
    props: {
      ...d,
      bordered: Boolean,
      dense: Boolean,
      separator: Boolean,
      padding: Boolean,
      tag: { type: String, default: 'div' },
    },
    setup(e, { slots: a }) {
      const s = g(),
        o = i(e, s.proxy.$q),
        l = t(() => (q.includes(e.tag) ? null : 'list')),
        n = t(
          () =>
            'q-list' +
            (e.bordered ? ' q-list--bordered' : '') +
            (e.dense ? ' q-list--dense' : '') +
            (e.separator ? ' q-list--separator' : '') +
            (o.value ? ' q-list--dark' : '') +
            (e.padding ? ' q-list--padding' : ''),
        );
      return () => c(e.tag, { class: n.value, role: l.value }, u(a.default));
    },
  });
export { p as Q };
