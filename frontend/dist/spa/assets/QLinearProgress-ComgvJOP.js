import {
  c as _,
  bI as k,
  D as S,
  g as h,
  M as C,
  h as t,
  m as x,
  f as a,
  bJ as B,
} from './index-CKSooU2k.js';
const w = { xs: 2, sm: 4, md: 6, lg: 10, xl: 14 };
function c(e, l, r) {
  return {
    transform: l
      ? `translateX(${r.lang.rtl ? '-' : ''}100%) scale3d(${-e},1,1)`
      : `scale3d(${e},1,1)`,
  };
}
const D = _({
  name: 'QLinearProgress',
  props: {
    ...S,
    ...k,
    value: { type: Number, default: 0 },
    buffer: Number,
    color: String,
    trackColor: String,
    reverse: Boolean,
    stripe: Boolean,
    indeterminate: Boolean,
    query: Boolean,
    rounded: Boolean,
    animationSpeed: { type: [String, Number], default: 2100 },
    instantFeedback: Boolean,
  },
  setup(e, { slots: l }) {
    const { proxy: r } = h(),
      d = C(e, r.$q),
      o = B(e, w),
      s = a(() => e.indeterminate || e.query),
      i = a(() => e.reverse !== e.query),
      v = a(() => ({
        ...(o.value !== null ? o.value : {}),
        '--q-linear-progress-speed': `${e.animationSpeed}ms`,
      })),
      m = a(
        () =>
          'q-linear-progress' +
          (e.color !== void 0 ? ` text-${e.color}` : '') +
          (e.reverse || e.query ? ' q-linear-progress--reverse' : '') +
          (e.rounded ? ' rounded-borders' : ''),
      ),
      g = a(() => c(e.buffer !== void 0 ? e.buffer : 1, i.value, r.$q)),
      n = a(() => `with${e.instantFeedback ? 'out' : ''}-transition`),
      f = a(
        () =>
          `q-linear-progress__track absolute-full q-linear-progress__track--${n.value} q-linear-progress__track--${d.value ? 'dark' : 'light'}` +
          (e.trackColor !== void 0 ? ` bg-${e.trackColor}` : ''),
      ),
      q = a(() => c(s.value ? 1 : e.value, i.value, r.$q)),
      $ = a(
        () =>
          `q-linear-progress__model absolute-full q-linear-progress__model--${n.value} q-linear-progress__model--${s.value ? 'in' : ''}determinate`,
      ),
      b = a(() => ({ width: `${e.value * 100}%` })),
      y = a(
        () =>
          `q-linear-progress__stripe absolute-${e.reverse ? 'right' : 'left'} q-linear-progress__stripe--${n.value}`,
      );
    return () => {
      const u = [
        t('div', { class: f.value, style: g.value }),
        t('div', { class: $.value, style: q.value }),
      ];
      return (
        e.stripe && !s.value && u.push(t('div', { class: y.value, style: b.value })),
        t(
          'div',
          {
            class: m.value,
            style: v.value,
            role: 'progressbar',
            'aria-valuemin': 0,
            'aria-valuemax': 1,
            'aria-valuenow': e.indeterminate ? void 0 : e.value,
          },
          x(l.default, u),
        )
      );
    };
  },
});
export { D as Q };
