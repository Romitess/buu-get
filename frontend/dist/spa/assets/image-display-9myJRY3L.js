import {
  O as r,
  bg as c,
  Q as d,
  R as m,
  at as u,
  S as n,
  a3 as p,
  X as e,
  f,
  a2 as g,
} from './index-CKSooU2k.js';
import { u as h } from './use-image-url-Bi9bxevq.js';
import { d as _ } from './user-image-BTNlQ5Ur.js';
const y = ['src', 'alt'],
  b = r({
    __name: 'image-display',
    props: {
      imagePath: {},
      alt: { default: 'Image' },
      width: { default: '100%' },
      height: { default: 'auto' },
      objectFit: { default: 'cover' },
      borderRadius: { default: '8px' },
      cacheBust: { type: Boolean, default: !1 },
    },
    setup(t) {
      c((l) => ({ ee4508c6: l.objectFit }));
      const a = t,
        { displayUrl: o, isImageAvailable: s } = h(
          () => a.imagePath,
          () => a.cacheBust,
        ),
        i = f(() => ({ width: a.width, height: a.height, borderRadius: a.borderRadius }));
      return (l, I) => (
        d(),
        m(
          'div',
          { class: 'image-display-container', style: u({ ...i.value }) },
          [
            n(
              'img',
              {
                src: e(s) ? e(o) : e(_),
                alt: t.alt,
                class: p(['image', { 'default-user-avatar': !e(s) }]),
              },
              null,
              10,
              y,
            ),
          ],
          4,
        )
      );
    },
  }),
  R = g(b, [['__scopeId', 'data-v-638a7e8c']]);
export { R as I };
