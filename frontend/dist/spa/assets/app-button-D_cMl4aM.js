import {
  O as e,
  Q as n,
  _ as u,
  a8 as d,
  ao as i,
  aB as r,
  W as t,
  aC as o,
  a2 as c,
} from './index-CKSooU2k.js';
const f = e({
    __name: 'app-button',
    props: {
      icon: {},
      label: {},
      color: { default: 'primary' },
      flat: { type: Boolean, default: !1 },
      outline: { type: Boolean, default: !1 },
      round: { type: Boolean, default: !1 },
      pill: { type: Boolean, default: !1 },
    },
    setup(a) {
      return (l, s) => (
        n(),
        u(
          d,
          i(l.$attrs, {
            color: ['primary', 'secondary', 'buu-gray-dark'].includes(a.color) ? void 0 : a.color,
            unelevated: !a.flat && !a.outline,
            flat: a.flat,
            outline: a.outline,
            round: a.round,
            class: [
              'app-button',
              {
                'app-button--brand': (!a.color || a.color === 'primary') && !a.flat && !a.outline,
                'app-button--secondary': a.color === 'secondary' && !a.flat && !a.outline,
                'app-button--full': a.color === 'full',
                'app-button--dark': a.color === 'buu-gray-dark',
                'app-button--flat': a.flat,
                'app-button--round': a.round,
                'app-button--pill': a.pill,
              },
            ],
            icon: a.icon,
            label: a.label,
          }),
          r({ default: t(() => [o(l.$slots, 'default', {}, void 0, !0)]), _: 2 }, [
            l.$slots.loading
              ? { name: 'loading', fn: t(() => [o(l.$slots, 'loading', {}, void 0, !0)]), key: '0' }
              : void 0,
          ]),
          1040,
          ['color', 'unelevated', 'flat', 'outline', 'round', 'class', 'icon', 'label'],
        )
      );
    },
  }),
  y = c(f, [['__scopeId', 'data-v-776d580d']]);
export { y as A };
