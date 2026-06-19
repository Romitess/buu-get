import {
  O as d,
  aA as t,
  Q as n,
  _ as c,
  av as m,
  a3 as u,
  W as p,
  V as h,
  $ as i,
  aD as r,
  a2 as f,
} from './index-CKSooU2k.js';
const V = d({
    __name: 'search-bar',
    props: r(
      { fullWidth: { type: Boolean }, placeholder: {} },
      { modelValue: {}, modelModifiers: {} },
    ),
    emits: r(['search'], ['update:modelValue']),
    setup(a) {
      const o = t(a, 'modelValue');
      return (s, e) => (
        n(),
        c(
          m,
          {
            modelValue: o.value,
            'onUpdate:modelValue': [
              e[0] || (e[0] = (l) => (o.value = l)),
              e[1] || (e[1] = (l) => s.$emit('search', l)),
            ],
            outlined: '',
            rounded: '',
            dense: '',
            placeholder: a.placeholder || s.$t('components.searchBar.placeholder'),
            'bg-color': 'grey-1',
            class: u(['search-bar', { 'full-width': a.fullWidth }]),
          },
          { append: p(() => [h(i, { name: 'search' })]), _: 1 },
          8,
          ['modelValue', 'placeholder', 'class'],
        )
      );
    },
  }),
  v = f(V, [['__scopeId', 'data-v-85e38e95']]);
export { v as S };
