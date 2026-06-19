import {
  c as f,
  h as o,
  a as E,
  f as n,
  bp as L,
  D as S,
  g as I,
  bq as K,
  r as m,
  ba as Q,
  af as R,
  br as w,
  M as A,
} from './index-CKSooU2k.js';
const $ = f({
    name: 'QItemSection',
    props: { avatar: Boolean, thumbnail: Boolean, side: Boolean, top: Boolean, noWrap: Boolean },
    setup(e, { slots: s }) {
      const u = n(
        () =>
          `q-item__section column q-item__section--${e.avatar || e.side || e.thumbnail ? 'side' : 'main'}` +
          (e.top ? ' q-item__section--top justify-start' : ' justify-center') +
          (e.avatar ? ' q-item__section--avatar' : '') +
          (e.thumbnail ? ' q-item__section--thumbnail' : '') +
          (e.noWrap ? ' q-item__section--nowrap' : ''),
      );
      return () => o('div', { class: u.value }, E(s.default));
    },
  }),
  j = f({
    name: 'QItem',
    props: {
      ...S,
      ...L,
      tag: { type: String, default: 'div' },
      active: { type: Boolean, default: null },
      clickable: Boolean,
      dense: Boolean,
      insetLevel: Number,
      tabindex: [String, Number],
      focused: Boolean,
      manualFocus: Boolean,
    },
    emits: ['click', 'keyup'],
    setup(e, { slots: s, emit: u }) {
      const {
          proxy: { $q: c },
        } = I(),
        b = A(e, c),
        { hasLink: v, linkAttrs: q, linkClass: k, linkTag: y, navigateOnClick: g } = K(),
        l = m(null),
        i = m(null),
        r = n(() => e.clickable || v.value || e.tag === 'label'),
        a = n(() => !e.disable && r.value),
        h = n(
          () =>
            'q-item q-item-type row no-wrap' +
            (e.dense ? ' q-item--dense' : '') +
            (b.value ? ' q-item--dark' : '') +
            (v.value && e.active === null
              ? k.value
              : e.active
                ? ` q-item--active${e.activeClass !== void 0 ? ` ${e.activeClass}` : ''}`
                : '') +
            (e.disable ? ' disabled' : '') +
            (a.value
              ? ' q-item--clickable q-link cursor-pointer ' +
                (e.manualFocus ? 'q-manual-focusable' : 'q-focusable q-hoverable') +
                (e.focused ? ' q-manual-focusable--focused' : '')
              : ''),
        ),
        _ = n(() =>
          e.insetLevel === void 0
            ? null
            : { ['padding' + (c.lang.rtl ? 'Right' : 'Left')]: 16 + e.insetLevel * 56 + 'px' },
        );
      function B(t) {
        a.value &&
          (i.value !== null &&
            !t.qAvoidFocus &&
            (!t.qKeyEvent && document.activeElement === l.value
              ? i.value.focus()
              : document.activeElement === i.value && l.value.focus()),
          g(t));
      }
      function C(t) {
        if (a.value && Q(t, [13, 32])) {
          (R(t), (t.qKeyEvent = !0));
          const d = new MouseEvent('click', t);
          ((d.qKeyEvent = !0), l.value.dispatchEvent(d));
        }
        u('keyup', t);
      }
      function x() {
        const t = w(s.default, []);
        return (
          a.value && t.unshift(o('div', { class: 'q-focus-helper', tabindex: -1, ref: i })),
          t
        );
      }
      return () => {
        const t = {
          ref: l,
          class: h.value,
          style: _.value,
          role: 'listitem',
          onClick: B,
          onKeyup: C,
        };
        return (
          a.value
            ? ((t.tabindex = e.tabindex || '0'), Object.assign(t, q.value))
            : r.value && (t['aria-disabled'] = 'true'),
          o(y.value, t, x())
        );
      };
    },
  });
export { j as Q, $ as a };
