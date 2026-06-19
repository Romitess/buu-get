import { a2 as o, Q as s, R as l, S as t, V as r, a8 as n } from './index-CKSooU2k.js';
const a = {},
  c = { class: 'fullscreen bg-blue text-white text-center q-pa-md flex flex-center' };
function d(i, e) {
  return (
    s(),
    l('div', c, [
      t('div', null, [
        e[0] || (e[0] = t('div', { style: { 'font-size': '30vh' } }, '404', -1)),
        e[1] ||
          (e[1] = t(
            'div',
            { class: 'text-h2', style: { opacity: '0.4' } },
            'Oops. Nothing here...',
            -1,
          )),
        r(n, {
          class: 'q-mt-xl',
          color: 'white',
          'text-color': 'blue',
          unelevated: '',
          to: '/',
          label: 'Go Home',
          'no-caps': '',
        }),
      ]),
    ])
  );
}
const x = o(a, [['render', d]]);
export { x as default };
