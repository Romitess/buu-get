import {
  O as x,
  Q as u,
  R as v,
  S as _,
  T as h,
  U as y,
  a2 as C,
  c as q,
  bp as z,
  bq as A,
  h as d,
  $ as f,
  m as E,
  f as b,
  bR as V,
  aj as w,
  a as N,
  bS as R,
  a4 as P,
  _ as p,
  W as g,
  a6 as I,
  a7 as L,
  a3 as k,
  V as O,
} from './index-CKSooU2k.js';
const j = { class: 'q-mb-lg page-header' },
  T = { class: 'text-h5 text-weight-bold text-dark q-mb-md page-title-size' },
  D = { key: 0, class: 'text-grey-7 subtitle-text-size' },
  F = x({
    __name: 'app-page-header',
    props: { title: {}, subtitle: {} },
    setup(e) {
      return (s, n) => (
        u(),
        v('div', j, [
          _('div', T, h(e.title), 1),
          e.subtitle ? (u(), v('div', D, h(e.subtitle), 1)) : y('', !0),
        ])
      );
    },
  }),
  K = C(F, [['__scopeId', 'data-v-43da6b68']]),
  H = q({
    name: 'QBreadcrumbsEl',
    props: { ...z, label: String, icon: String, tag: { type: String, default: 'span' } },
    emits: ['click'],
    setup(e, { slots: s }) {
      const { linkTag: n, linkAttrs: l, linkClass: c, navigateOnClick: t } = A(),
        a = b(() => ({
          class:
            'q-breadcrumbs__el q-link flex inline items-center relative-position ' +
            (e.disable ? 'q-breadcrumbs__el--disable' : 'q-link--focusable' + c.value),
          ...l.value,
          onClick: t,
        })),
        i = b(
          () =>
            'q-breadcrumbs__el-icon' +
            (e.label !== void 0 ? ' q-breadcrumbs__el-icon--with-label' : ''),
        );
      return () => {
        const r = [];
        return (
          e.icon !== void 0 && r.push(d(f, { class: i.value, name: e.icon })),
          e.label !== void 0 && r.push(e.label),
          d(n.value, { ...a.value }, E(s.default, r))
        );
      };
    },
  }),
  M = ['', !0],
  U = q({
    name: 'QBreadcrumbs',
    props: {
      ...V,
      separator: { type: String, default: '/' },
      separatorColor: String,
      activeColor: { type: String, default: 'primary' },
      gutter: {
        type: String,
        validator: (e) => ['none', 'xs', 'sm', 'md', 'lg', 'xl'].includes(e),
        default: 'sm',
      },
    },
    setup(e, { slots: s }) {
      const n = R(e),
        l = b(
          () => `flex items-center ${n.value}${e.gutter === 'none' ? '' : ` q-gutter-${e.gutter}`}`,
        ),
        c = b(() => (e.separatorColor ? ` text-${e.separatorColor}` : '')),
        t = b(() => ` text-${e.activeColor}`);
      return () => {
        if (s.default === void 0) return;
        const a = w(N(s.default));
        if (a.length === 0) return;
        let i = 1;
        const r = [],
          S = a.filter((o) => o.type?.name === 'QBreadcrumbsEl').length,
          B = s.separator !== void 0 ? s.separator : () => e.separator;
        return (
          a.forEach((o) => {
            if (o.type?.name === 'QBreadcrumbsEl') {
              const m = i < S,
                $ = o.props !== null && M.includes(o.props.disable),
                Q = (m ? '' : ' q-breadcrumbs--last') + (!$ && m ? t.value : '');
              (i++,
                r.push(d('div', { class: `flex items-center${Q}` }, [o])),
                m && r.push(d('div', { class: 'q-breadcrumbs__separator' + c.value }, B())));
            } else r.push(o);
          }),
          d('div', { class: 'q-breadcrumbs' }, [d('div', { class: l.value }, r)])
        );
      };
    },
  }),
  W = { class: 'breadcrumb-label' },
  G = x({
    __name: 'app-breadcrumbs',
    setup(e) {
      const s = P(),
        n = b(() => {
          const l = s.meta.breadcrumb;
          return l
            ? l.map((c, t) => {
                let a = c.to;
                return (
                  a &&
                    (a = Object.keys(s.params).reduce(
                      (i, r) => i.replace(`:${r}`, String(s.params[r])),
                      a,
                    )),
                  { label: c.label, icon: c.icon, to: t === l.length - 1 ? void 0 : a }
                );
              })
            : [];
        });
      return (l, c) => (
        u(),
        p(
          U,
          { class: 'text-grey-6 q-mb-lg', 'active-color': 'black', style: { 'font-size': '15px' } },
          {
            separator: g(() => [O(f, { size: '1.2em', name: 'chevron_right', color: 'grey-5' })]),
            default: g(() => [
              (u(!0),
              v(
                I,
                null,
                L(
                  n.value,
                  (t, a) => (
                    u(),
                    p(
                      H,
                      {
                        key: a,
                        to: t.to,
                        class: k([a === n.value.length - 1 ? 'text-black' : 'text-grey-6']),
                      },
                      {
                        default: g(() => [
                          _(
                            'div',
                            {
                              class: k([
                                'row items-center no-wrap breadcrumb-content',
                                { 'active-item': a === n.value.length - 1 },
                              ]),
                            },
                            [
                              t.icon
                                ? (u(),
                                  p(
                                    f,
                                    { key: 0, name: t.icon, size: '18px', class: 'q-mr-sm' },
                                    null,
                                    8,
                                    ['name'],
                                  ))
                                : y('', !0),
                              _('span', W, h(l.$te(t.label) ? l.$t(t.label) : t.label), 1),
                            ],
                            2,
                          ),
                        ]),
                        _: 2,
                      },
                      1032,
                      ['to', 'class'],
                    )
                  ),
                ),
                128,
              )),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  X = C(G, [['__scopeId', 'data-v-db611811']]);
export { X as A, K as a };
