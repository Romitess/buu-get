import {
  f as v,
  c as ia,
  D as ua,
  aK as sa,
  g as da,
  r as C,
  w as U,
  I as Fe,
  h as u,
  ai as K,
  a as va,
  aT as ca,
  aU as fa,
  a8 as k,
  M as ma,
  aV as ha,
} from './index-CKSooU2k.js';
import { u as ya } from './use-render-cache-2mw4_QYe.js';
import { t as ga, _ as ba, f as _a, j as be, a as Ie, g as Da } from './date-DmslTAtO.js';
import { p as I } from './format-DnjzHs7F.js';
const xa = ['gregorian', 'persian'],
  Ne = {
    mask: { type: String },
    locale: Object,
    calendar: { type: String, validator: (n) => xa.includes(n), default: 'gregorian' },
    landscape: Boolean,
    color: String,
    textColor: String,
    square: Boolean,
    flat: Boolean,
    bordered: Boolean,
    readonly: Boolean,
    disable: Boolean,
  },
  wa = ['update:modelValue'];
function V(n) {
  return n.year + '/' + I(n.month) + '/' + I(n.day);
}
function Ma(n, L) {
  const M = v(() => !n.disable && !n.readonly),
    W = v(() => (M.value ? 0 : -1)),
    m = v(() => {
      const h = [];
      return (
        n.color !== void 0 && h.push(`bg-${n.color}`),
        n.textColor !== void 0 && h.push(`text-${n.textColor}`),
        h.join(' ')
      );
    });
  function ne() {
    return n.locale !== void 0 ? { ...L.lang.date, ...n.locale } : L.lang.date;
  }
  function D(h) {
    const N = new Date(),
      O = h ? null : 0;
    if (n.calendar === 'persian') {
      const B = ga(N);
      return { year: B.jy, month: B.jm, day: B.jd };
    }
    return {
      year: N.getFullYear(),
      month: N.getMonth() + 1,
      day: N.getDate(),
      hour: O,
      minute: O,
      second: O,
      millisecond: O,
    };
  }
  return { editable: M, tabindex: W, headerClass: m, getLocale: ne, getCurrentDate: D };
}
const H = 20,
  qa = ['Calendar', 'Years', 'Months'],
  Be = (n) => qa.includes(n),
  Ca = /^-?[\d]+\/[0-1]\d$/,
  _e = (n) => Ca.test(n),
  z = ' — ';
function S(n) {
  return n.year + '/' + I(n.month);
}
function F(n) {
  return { year: n.year, month: n.month, day: n.day };
}
const Sa = ia({
  name: 'QDate',
  props: {
    ...Ne,
    ...sa,
    ...ua,
    modelValue: {
      required: !0,
      validator: (n) => typeof n == 'string' || Array.isArray(n) || Object(n) === n || n === null,
    },
    multiple: Boolean,
    range: Boolean,
    title: String,
    subtitle: String,
    mask: { ...Ne.mask, default: 'YYYY/MM/DD' },
    defaultYearMonth: { type: String, validator: _e },
    yearsInMonthView: Boolean,
    events: [Array, Function],
    eventColor: [String, Function],
    emitImmediately: Boolean,
    options: [Array, Function],
    navigationMinYearMonth: { type: String, validator: _e },
    navigationMaxYearMonth: { type: String, validator: _e },
    noUnset: Boolean,
    firstDayOfWeek: [String, Number],
    todayBtn: Boolean,
    minimal: Boolean,
    defaultView: { type: String, default: 'Calendar', validator: Be },
  },
  emits: [...wa, 'rangeStart', 'rangeEnd', 'navigation'],
  setup(n, { slots: L, emit: M }) {
    const { proxy: W } = da(),
      { $q: m } = W,
      ne = ma(n, m),
      { getCache: D } = ya(),
      { tabindex: h, headerClass: N, getLocale: O, getCurrentDate: B } = Ma(n, m);
    let le;
    const $e = ha(n),
      Re = ca($e),
      oe = C(null),
      j = C(He()),
      f = C(O()),
      Ee = v(() => He()),
      Ae = v(() => O()),
      q = v(() => B()),
      i = C(Ye(j.value, f.value)),
      _ = C(n.defaultView),
      De = v(() => (m.lang.rtl ? 'right' : 'left')),
      G = C(De.value),
      re = C(De.value),
      ie = i.value.year,
      X = C(ie - (ie % H) - (ie < 0 ? H : 0)),
      b = C(null),
      ze = v(() => {
        const e = n.landscape ? 'landscape' : 'portrait';
        return (
          `q-date q-date--${e} q-date--${e}-${n.minimal ? 'minimal' : 'standard'}` +
          (ne.value ? ' q-date--dark q-dark' : '') +
          (n.bordered ? ' q-date--bordered' : '') +
          (n.square ? ' q-date--square no-border-radius' : '') +
          (n.flat ? ' q-date--flat no-shadow' : '') +
          (n.disable ? ' disabled' : n.readonly ? ' q-date--readonly' : '')
        );
      }),
      T = v(() => n.color || 'primary'),
      $ = v(() => n.textColor || 'white'),
      Z = v(() => n.emitImmediately && !n.multiple && !n.range),
      ue = v(() =>
        Array.isArray(n.modelValue)
          ? n.modelValue
          : n.modelValue !== null && n.modelValue !== void 0
            ? [n.modelValue]
            : [],
      ),
      w = v(() =>
        ue.value
          .filter((e) => typeof e == 'string')
          .map((e) => fe(e, j.value, f.value))
          .filter(
            (e) => e.dateHash !== null && e.day !== null && e.month !== null && e.year !== null,
          ),
      ),
      R = v(() => {
        const e = (a) => fe(a, j.value, f.value);
        return ue.value
          .filter((a) => fa(a) && a.from !== void 0 && a.to !== void 0)
          .map((a) => ({ from: e(a.from), to: e(a.to) }))
          .filter(
            (a) =>
              a.from.dateHash !== null && a.to.dateHash !== null && a.from.dateHash < a.to.dateHash,
          );
      }),
      p = v(() =>
        n.calendar !== 'persian'
          ? (e) => new Date(e.year, e.month - 1, e.day)
          : (e) => {
              const a = Ie(e.year, e.month, e.day);
              return new Date(a.gy, a.gm - 1, a.gd);
            },
      ),
      se = v(() =>
        n.calendar === 'persian'
          ? V
          : (e, a, t) =>
              _a(
                new Date(e.year, e.month - 1, e.day, e.hour, e.minute, e.second, e.millisecond),
                a === void 0 ? j.value : a,
                t === void 0 ? f.value : t,
                e.year,
                e.timezoneOffset,
              ),
      ),
      J = v(
        () =>
          w.value.length + R.value.reduce((e, a) => e + 1 + Da(p.value(a.to), p.value(a.from)), 0),
      ),
      xe = v(() => {
        if (n.title !== void 0 && n.title !== null && n.title.length !== 0) return n.title;
        if (b.value !== null) {
          const t = b.value.init,
            l = p.value(t);
          return (
            f.value.daysShort[l.getDay()] +
            ', ' +
            f.value.monthsShort[t.month - 1] +
            ' ' +
            t.day +
            z +
            '?'
          );
        }
        if (J.value === 0) return z;
        if (J.value > 1) return `${J.value} ${f.value.pluralDay}`;
        const e = w.value[0],
          a = p.value(e);
        return Number.isNaN(a.valueOf())
          ? z
          : f.value.headerTitle !== void 0
            ? f.value.headerTitle(a, e)
            : f.value.daysShort[a.getDay()] + ', ' + f.value.monthsShort[e.month - 1] + ' ' + e.day;
      }),
      We = v(
        () =>
          [...w.value, ...R.value.map((a) => a.from)].sort(
            (a, t) => a.year - t.year || a.month - t.month,
          )[0],
      ),
      Je = v(
        () =>
          [...w.value, ...R.value.map((a) => a.to)].sort(
            (a, t) => t.year - a.year || t.month - a.month,
          )[0],
      ),
      we = v(() => {
        if (n.subtitle !== void 0 && n.subtitle !== null && n.subtitle.length !== 0)
          return n.subtitle;
        if (J.value === 0) return z;
        if (J.value > 1) {
          const e = We.value,
            a = Je.value,
            t = f.value.monthsShort;
          return (
            t[e.month - 1] +
            (e.year !== a.year
              ? ' ' + e.year + z + t[a.month - 1] + ' '
              : e.month !== a.month
                ? z + t[a.month - 1]
                : '') +
            ' ' +
            a.year
          );
        }
        return w.value[0].year;
      }),
      ee = v(() => {
        const e = [m.iconSet.datetime.arrowLeft, m.iconSet.datetime.arrowRight];
        return m.lang.rtl ? e.reverse() : e;
      }),
      Me = v(() =>
        n.firstDayOfWeek !== void 0 ? Number(n.firstDayOfWeek) : f.value.firstDayOfWeek,
      ),
      Pe = v(() => {
        const e = f.value.daysShort,
          a = Me.value;
        return a > 0 ? [...e.slice(a, 7), ...e.slice(0, a)] : e;
      }),
      Y = v(() => {
        const e = i.value;
        return n.calendar !== 'persian'
          ? new Date(e.year, e.month, 0).getDate()
          : be(e.year, e.month);
      }),
      Qe = v(() => (typeof n.eventColor == 'function' ? n.eventColor : () => n.eventColor)),
      y = v(() => {
        if (n.navigationMinYearMonth === void 0) return null;
        const e = n.navigationMinYearMonth.split('/');
        return { year: Number.parseInt(e[0], 10), month: Number.parseInt(e[1], 10) };
      }),
      g = v(() => {
        if (n.navigationMaxYearMonth === void 0) return null;
        const e = n.navigationMaxYearMonth.split('/');
        return { year: Number.parseInt(e[0], 10), month: Number.parseInt(e[1], 10) };
      }),
      de = v(() => {
        const e = { month: { prev: !0, next: !0 }, year: { prev: !0, next: !0 } };
        return (
          y.value !== null &&
            y.value.year >= i.value.year &&
            ((e.year.prev = !1),
            y.value.year === i.value.year && y.value.month >= i.value.month && (e.month.prev = !1)),
          g.value !== null &&
            g.value.year <= i.value.year &&
            ((e.year.next = !1),
            g.value.year === i.value.year && g.value.month <= i.value.month && (e.month.next = !1)),
          e
        );
      }),
      ae = v(() => {
        const e = {};
        return (
          w.value.forEach((a) => {
            const t = S(a);
            (e[t] === void 0 && (e[t] = []), e[t].push(a.day));
          }),
          e
        );
      }),
      qe = v(() => {
        const e = {};
        return (
          R.value.forEach((a) => {
            const t = S(a.from),
              l = S(a.to);
            if (
              (e[t] === void 0 && (e[t] = []),
              e[t].push({ from: a.from.day, to: t === l ? a.to.day : void 0, range: a }),
              t < l)
            ) {
              let o;
              const { year: d, month: r } = a.from,
                s = r < 12 ? { year: d, month: r + 1 } : { year: d + 1, month: 1 };
              for (; (o = S(s)) <= l; )
                (e[o] === void 0 && (e[o] = []),
                  e[o].push({ from: void 0, to: o === l ? a.to.day : void 0, range: a }),
                  s.month++,
                  s.month > 12 && (s.year++, (s.month = 1)));
            }
          }),
          e
        );
      }),
      P = v(() => {
        if (b.value === null) return;
        const { init: e, initHash: a, final: t, finalHash: l } = b.value,
          [o, d] = a <= l ? [e, t] : [t, e],
          r = S(o),
          s = S(d);
        if (r !== x.value && s !== x.value) return;
        const c = {};
        return (
          r === x.value ? ((c.from = o.day), (c.includeFrom = !0)) : (c.from = 1),
          s === x.value ? ((c.to = d.day), (c.includeTo = !0)) : (c.to = Y.value),
          c
        );
      }),
      x = v(() => S(i.value)),
      Ue = v(() => {
        const e = {};
        if (n.options === void 0) {
          for (let t = 1; t <= Y.value; t++) e[t] = !0;
          return e;
        }
        const a = typeof n.options == 'function' ? n.options : (t) => n.options.includes(t);
        for (let t = 1; t <= Y.value; t++) {
          const l = x.value + '/' + I(t);
          e[t] = a(l);
        }
        return e;
      }),
      Ke = v(() => {
        const e = {};
        if (n.events === void 0) for (let a = 1; a <= Y.value; a++) e[a] = !1;
        else {
          const a = typeof n.events == 'function' ? n.events : (t) => n.events.includes(t);
          for (let t = 1; t <= Y.value; t++) {
            const l = x.value + '/' + I(t);
            e[t] = a(l) && Qe.value(l);
          }
        }
        return e;
      }),
      Le = v(() => {
        let e, a;
        const { year: t, month: l } = i.value;
        if (n.calendar !== 'persian')
          ((e = new Date(t, l - 1, 1)), (a = new Date(t, l - 1, 0).getDate()));
        else {
          const o = Ie(t, l, 1);
          e = new Date(o.gy, o.gm - 1, o.gd);
          let d = l - 1,
            r = t;
          (d === 0 && ((d = 12), r--), (a = be(r, d)));
        }
        return { days: e.getDay() - Me.value - 1, endDay: a };
      }),
      Ce = v(() => {
        const e = [],
          { days: a, endDay: t } = Le.value,
          l = a < 0 ? a + 7 : a;
        if (l < 6) for (let r = t - l; r <= t; r++) e.push({ i: r, fill: !0 });
        const o = e.length;
        for (let r = 1; r <= Y.value; r++) {
          const s = { i: r, event: Ke.value[r], classes: [] };
          (Ue.value[r] && ((s.in = !0), (s.flat = !0)), e.push(s));
        }
        if (
          (ae.value[x.value] !== void 0 &&
            ae.value[x.value].forEach((r) => {
              const s = o + r - 1;
              Object.assign(e[s], {
                selected: !0,
                unelevated: !0,
                flat: !1,
                color: T.value,
                textColor: $.value,
              });
            }),
          qe.value[x.value] !== void 0 &&
            qe.value[x.value].forEach((r) => {
              if (r.from !== void 0) {
                const s = o + r.from - 1,
                  c = o + (r.to || Y.value) - 1;
                for (let Q = s; Q <= c; Q++)
                  Object.assign(e[Q], {
                    range: r.range,
                    unelevated: !0,
                    color: T.value,
                    textColor: $.value,
                  });
                (Object.assign(e[s], { rangeFrom: !0, flat: !1 }),
                  r.to !== void 0 && Object.assign(e[c], { rangeTo: !0, flat: !1 }));
              } else if (r.to !== void 0) {
                const s = o + r.to - 1;
                for (let c = o; c <= s; c++)
                  Object.assign(e[c], {
                    range: r.range,
                    unelevated: !0,
                    color: T.value,
                    textColor: $.value,
                  });
                Object.assign(e[s], { flat: !1, rangeTo: !0 });
              } else {
                const s = o + Y.value - 1;
                for (let c = o; c <= s; c++)
                  Object.assign(e[c], {
                    range: r.range,
                    unelevated: !0,
                    color: T.value,
                    textColor: $.value,
                  });
              }
            }),
          P.value !== void 0)
        ) {
          const r = o + P.value.from - 1,
            s = o + P.value.to - 1;
          for (let c = r; c <= s; c++) ((e[c].color = T.value), (e[c].editRange = !0));
          (P.value.includeFrom && (e[r].editRangeFrom = !0),
            P.value.includeTo && (e[s].editRangeTo = !0));
        }
        i.value.year === q.value.year &&
          i.value.month === q.value.month &&
          (e[o + q.value.day - 1].today = !0);
        const d = e.length % 7;
        if (d > 0) {
          const r = 7 - d;
          for (let s = 1; s <= r; s++) e.push({ i: s, fill: !0 });
        }
        return (
          e.forEach((r) => {
            let s = 'q-date__calendar-item ';
            (r.fill
              ? (s += 'q-date__calendar-item--fill')
              : ((s += `q-date__calendar-item--${r.in ? 'in' : 'out'}`),
                r.range !== void 0 &&
                  (s += ` q-date__range${r.rangeTo ? '-to' : r.rangeFrom ? '-from' : ''}`),
                r.editRange &&
                  (s += ` q-date__edit-range${r.editRangeFrom ? '-from' : ''}${r.editRangeTo ? '-to' : ''}`),
                (r.range !== void 0 || r.editRange) && (s += ` text-${r.color}`)),
              (r.classes = s));
          }),
          e
        );
      }),
      Ge = v(() => (n.disable ? { 'aria-disabled': 'true' } : {}));
    (U(
      () => n.modelValue,
      (e) => {
        if (le === JSON.stringify(e)) le = 0;
        else {
          const a = Ye(j.value, f.value);
          E(a.year, a.month, a);
        }
      },
    ),
      U(_, () => {
        oe.value !== null && W.$el.contains(document.activeElement) && oe.value.focus();
      }),
      U(
        () => i.value.year + '|' + i.value.month,
        () => {
          M('navigation', { year: i.value.year, month: i.value.month });
        },
      ),
      U(Ee, (e) => {
        (Te(e, f.value, 'mask'), (j.value = e));
      }),
      U(Ae, (e) => {
        (Te(j.value, e, 'locale'), (f.value = e));
      }));
    function ve(e) {
      le = JSON.stringify(e);
    }
    function ke() {
      const { year: e, month: a, day: t } = q.value,
        l = { ...i.value, year: e, month: a, day: t },
        o = ae.value[S(l)];
      ((o === void 0 || !o.includes(l.day)) && he(l), ce(l.year, l.month));
    }
    function Xe(e) {
      Be(e) && (_.value = e);
    }
    function Ze(e, a) {
      ['month', 'year'].includes(e) && (e === 'month' ? Se : me)(a ? -1 : 1);
    }
    function ce(e, a) {
      ((_.value = 'Calendar'), E(e, a));
    }
    function pe(e, a) {
      if (!n.range || !e) {
        b.value = null;
        return;
      }
      const t = { ...i.value, ...e },
        l = a !== void 0 ? { ...i.value, ...a } : t;
      ((b.value = { init: t, initHash: V(t), final: l, finalHash: V(l) }), ce(t.year, t.month));
    }
    function He() {
      return n.calendar === 'persian' ? 'YYYY/MM/DD' : n.mask;
    }
    function fe(e, a, t) {
      return ba(e, a, t, n.calendar, { hour: 0, minute: 0, second: 0, millisecond: 0 });
    }
    function Ye(e, a) {
      const t = Array.isArray(n.modelValue) ? n.modelValue : n.modelValue ? [n.modelValue] : [];
      if (t.length === 0) return Ve();
      const l = t.at(-1),
        o = fe(l.from !== void 0 ? l.from : l, e, a);
      return o.dateHash === null ? Ve() : o;
    }
    function Ve() {
      let e, a;
      if (n.defaultYearMonth !== void 0) {
        const t = n.defaultYearMonth.split('/');
        ((e = Number.parseInt(t[0], 10)), (a = Number.parseInt(t[1], 10)));
      } else {
        const t = q.value !== void 0 ? q.value : B();
        ((e = t.year), (a = t.month));
      }
      return {
        year: e,
        month: a,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        dateHash: e + '/' + I(a) + '/01',
      };
    }
    function Se(e) {
      let a = i.value.year,
        t = Number(i.value.month) + e;
      (t === 13 ? ((t = 1), a++) : t === 0 && ((t = 12), a--), E(a, t), Z.value && te('month'));
    }
    function me(e) {
      const a = Number(i.value.year) + e;
      (E(a, i.value.month), Z.value && te('year'));
    }
    function ea(e) {
      (E(e, i.value.month),
        (_.value = n.defaultView === 'Years' ? 'Months' : 'Calendar'),
        Z.value && te('year'));
    }
    function aa(e) {
      (E(i.value.year, e), (_.value = 'Calendar'), Z.value && te('month'));
    }
    function ta(e, a) {
      (ae.value[a]?.includes(e.day) === !0 ? ye : he)(e);
    }
    function E(e, a, t) {
      if (
        (y.value !== null &&
          e <= y.value.year &&
          ((a < y.value.month || e < y.value.year) && (a = y.value.month), (e = y.value.year)),
        g.value !== null &&
          e >= g.value.year &&
          ((a > g.value.month || e > g.value.year) && (a = g.value.month), (e = g.value.year)),
        t !== void 0)
      ) {
        const { hour: o, minute: d, second: r, millisecond: s, timezoneOffset: c, timeHash: Q } = t;
        Object.assign(i.value, {
          hour: o,
          minute: d,
          second: r,
          millisecond: s,
          timezoneOffset: c,
          timeHash: Q,
        });
      }
      const l = e + '/' + I(a) + '/01';
      l !== i.value.dateHash &&
        ((G.value = i.value.dateHash < l == (m.lang.rtl !== !0) ? 'left' : 'right'),
        e !== i.value.year && (re.value = G.value),
        Fe(() => {
          ((X.value = e - (e % H) - (e < 0 ? H : 0)),
            Object.assign(i.value, { year: e, month: a, day: 1, dateHash: l }));
        }));
    }
    function Oe(e, a, t) {
      const l = e !== null && e.length === 1 && !n.multiple ? e[0] : e,
        { reason: o, details: d } = je(a, t);
      (ve(l), M('update:modelValue', l, o, d));
    }
    function te(e) {
      const a =
        w.value[0] !== void 0 && w.value[0].dateHash !== null ? { ...w.value[0] } : { ...i.value };
      Fe(() => {
        ((a.year = i.value.year), (a.month = i.value.month));
        const t =
          n.calendar !== 'persian' ? new Date(a.year, a.month, 0).getDate() : be(a.year, a.month);
        a.day = Math.min(Math.max(1, a.day), t);
        const l = A(a),
          { details: o } = je('', a);
        (ve(l), M('update:modelValue', l, e, o));
      });
    }
    function je(e, a) {
      return a.from !== void 0
        ? { reason: `${e}-range`, details: { ...F(a.target), from: F(a.from), to: F(a.to) } }
        : { reason: `${e}-day`, details: F(a) };
    }
    function A(e, a, t) {
      return e.from !== void 0
        ? { from: se.value(e.from, a, t), to: se.value(e.to, a, t) }
        : se.value(e, a, t);
    }
    function he(e) {
      let a;
      if (n.multiple)
        if (e.from !== void 0) {
          const t = V(e.from),
            l = V(e.to),
            o = w.value.filter((r) => r.dateHash < t || r.dateHash > l),
            d = R.value.filter(({ from: r, to: s }) => s.dateHash < t || r.dateHash > l);
          a = [...o, ...d, e].map((r) => A(r));
        } else a = [...ue.value, A(e)];
      else a = A(e);
      Oe(a, 'add', e);
    }
    function ye(e) {
      if (n.noUnset) return;
      let a = null;
      if (n.multiple && Array.isArray(n.modelValue)) {
        const t = A(e);
        ((a =
          e.from !== void 0
            ? n.modelValue.filter((l) =>
                l.from !== void 0 ? l.from !== t.from && l.to !== t.to : !0,
              )
            : n.modelValue.filter((l) => l !== t)),
          a.length === 0 && (a = null));
      }
      Oe(a, 'remove', e);
    }
    function Te(e, a, t) {
      const l = [...w.value, ...R.value]
          .map((d) => A(d, e, a))
          .filter((d) =>
            d.from !== void 0
              ? d.from.dateHash !== null && d.to.dateHash !== null
              : d.dateHash !== null,
          ),
        o = (n.multiple ? l : l[0]) || null;
      (ve(o), M('update:modelValue', o, t));
    }
    function na() {
      if (!n.minimal)
        return u('div', { class: 'q-date__header ' + N.value }, [
          u('div', { class: 'relative-position' }, [
            u(K, { name: 'q-transition--fade' }, () =>
              u(
                'div',
                {
                  key: 'h-yr-' + we.value,
                  class:
                    'q-date__header-subtitle q-date__header-link ' +
                    (_.value === 'Years' ? 'q-date__header-link--active' : 'cursor-pointer'),
                  tabindex: h.value,
                  ...D('vY', {
                    onClick() {
                      _.value = 'Years';
                    },
                    onKeyup(e) {
                      e.keyCode === 13 && (_.value = 'Years');
                    },
                  }),
                },
                [we.value],
              ),
            ),
          ]),
          u('div', { class: 'q-date__header-title relative-position flex no-wrap' }, [
            u('div', { class: 'relative-position col' }, [
              u(K, { name: 'q-transition--fade' }, () =>
                u(
                  'div',
                  {
                    key: 'h-sub' + xe.value,
                    class:
                      'q-date__header-title-label q-date__header-link ' +
                      (_.value === 'Calendar' ? 'q-date__header-link--active' : 'cursor-pointer'),
                    tabindex: h.value,
                    ...D('vC', {
                      onClick() {
                        _.value = 'Calendar';
                      },
                      onKeyup(e) {
                        e.keyCode === 13 && (_.value = 'Calendar');
                      },
                    }),
                  },
                  [xe.value],
                ),
              ),
            ]),
            n.todayBtn
              ? u(k, {
                  class: 'q-date__header-today self-start',
                  icon: m.iconSet.datetime.today,
                  'aria-label': m.lang.date.today,
                  flat: !0,
                  size: 'sm',
                  round: !0,
                  tabindex: h.value,
                  onClick: ke,
                })
              : null,
          ]),
        ]);
    }
    function ge({ label: e, type: a, key: t, dir: l, goTo: o, boundaries: d, cls: r }) {
      return [
        u('div', { class: 'row items-center q-date__arrow' }, [
          u(k, {
            round: !0,
            dense: !0,
            size: 'sm',
            flat: !0,
            icon: ee.value[0],
            'aria-label': a === 'Years' ? m.lang.date.prevYear : m.lang.date.prevMonth,
            tabindex: h.value,
            disable: !d.prev,
            ...D('go-#' + a, {
              onClick() {
                o(-1);
              },
            }),
          }),
        ]),
        u('div', { class: 'relative-position overflow-hidden flex flex-center' + r }, [
          u(K, { name: 'q-transition--jump-' + l }, () =>
            u('div', { key: t }, [
              u(k, {
                flat: !0,
                dense: !0,
                noCaps: !0,
                label: e,
                tabindex: h.value,
                ...D('view#' + a, {
                  onClick: () => {
                    _.value = a;
                  },
                }),
              }),
            ]),
          ),
        ]),
        u('div', { class: 'row items-center q-date__arrow' }, [
          u(k, {
            round: !0,
            dense: !0,
            size: 'sm',
            flat: !0,
            icon: ee.value[1],
            'aria-label': a === 'Years' ? m.lang.date.nextYear : m.lang.date.nextMonth,
            tabindex: h.value,
            disable: !d.next,
            ...D('go+#' + a, {
              onClick() {
                o(1);
              },
            }),
          }),
        ]),
      ];
    }
    const la = {
      Calendar: () => [
        u('div', { key: 'calendar-view', class: 'q-date__view q-date__calendar' }, [
          u('div', { class: 'q-date__navigation row items-center no-wrap' }, [
            ...ge({
              label: f.value.months[i.value.month - 1],
              type: 'Months',
              key: i.value.month,
              dir: G.value,
              goTo: Se,
              boundaries: de.value.month,
              cls: ' col',
            }),
            ...ge({
              label: i.value.year,
              type: 'Years',
              key: i.value.year,
              dir: re.value,
              goTo: me,
              boundaries: de.value.year,
              cls: '',
            }),
          ]),
          u(
            'div',
            { class: 'q-date__calendar-weekdays row items-center no-wrap' },
            Pe.value.map((e) => u('div', { class: 'q-date__calendar-item' }, [u('div', e)])),
          ),
          u('div', { class: 'q-date__calendar-days-container relative-position overflow-hidden' }, [
            u(K, { name: 'q-transition--slide-' + G.value }, () =>
              u(
                'div',
                { key: x.value, class: 'q-date__calendar-days fit' },
                Ce.value.map((e) =>
                  u('div', { class: e.classes }, [
                    e.in
                      ? u(
                          k,
                          {
                            class: e.today ? 'q-date__today' : '',
                            dense: !0,
                            flat: e.flat,
                            unelevated: e.unelevated,
                            color: e.color,
                            textColor: e.textColor,
                            label: e.i,
                            tabindex: h.value,
                            ...D('day#' + e.i, {
                              onClick: () => {
                                oa(e.i);
                              },
                              onMouseover: () => {
                                ra(e.i);
                              },
                            }),
                          },
                          e.event ? () => u('div', { class: 'q-date__event bg-' + e.event }) : null,
                        )
                      : u('div', String(e.i)),
                  ]),
                ),
              ),
            ),
          ]),
        ]),
      ],
      Months() {
        const e = i.value.year === q.value.year,
          a = (l) =>
            (y.value !== null && i.value.year === y.value.year && y.value.month > l) ||
            (g.value !== null && i.value.year === g.value.year && g.value.month < l),
          t = f.value.monthsShort.map((l, o) => {
            const d = i.value.month === o + 1;
            return u('div', { class: 'q-date__months-item flex flex-center' }, [
              u(k, {
                class: e && q.value.month === o + 1 ? 'q-date__today' : null,
                flat: !d,
                label: l,
                unelevated: d,
                color: d ? T.value : null,
                textColor: d ? $.value : null,
                tabindex: h.value,
                disable: a(o + 1),
                ...D('month#' + o, {
                  onClick: () => {
                    aa(o + 1);
                  },
                }),
              }),
            ]);
          });
        return (
          n.yearsInMonthView &&
            t.unshift(
              u('div', { class: 'row no-wrap full-width' }, [
                ge({
                  label: i.value.year,
                  type: 'Years',
                  key: i.value.year,
                  dir: re.value,
                  goTo: me,
                  boundaries: de.value.year,
                  cls: ' col',
                }),
              ]),
            ),
          u('div', { key: 'months-view', class: 'q-date__view q-date__months flex flex-center' }, t)
        );
      },
      Years() {
        const e = X.value,
          a = e + H,
          t = [],
          l = (o) =>
            (y.value !== null && y.value.year > o) || (g.value !== null && g.value.year < o);
        for (let o = e; o <= a; o++) {
          const d = i.value.year === o;
          t.push(
            u('div', { class: 'q-date__years-item flex flex-center' }, [
              u(k, {
                key: 'yr' + o,
                class: q.value.year === o ? 'q-date__today' : null,
                flat: !d,
                label: o,
                dense: !0,
                unelevated: d,
                color: d ? T.value : null,
                textColor: d ? $.value : null,
                tabindex: h.value,
                disable: l(o),
                ...D('yr#' + o, {
                  onClick: () => {
                    ea(o);
                  },
                }),
              }),
            ]),
          );
        }
        return u('div', { class: 'q-date__view q-date__years flex flex-center' }, [
          u('div', { class: 'col-auto' }, [
            u(k, {
              round: !0,
              dense: !0,
              flat: !0,
              icon: ee.value[0],
              'aria-label': m.lang.date.prevRangeYears(H),
              tabindex: h.value,
              disable: l(e),
              ...D('y-', {
                onClick: () => {
                  X.value -= H;
                },
              }),
            }),
          ]),
          u('div', { class: 'q-date__years-content col self-stretch row items-center' }, t),
          u('div', { class: 'col-auto' }, [
            u(k, {
              round: !0,
              dense: !0,
              flat: !0,
              icon: ee.value[1],
              'aria-label': m.lang.date.nextRangeYears(H),
              tabindex: h.value,
              disable: l(a),
              ...D('y+', {
                onClick: () => {
                  X.value += H;
                },
              }),
            }),
          ]),
        ]);
      },
    };
    function oa(e) {
      const a = { ...i.value, day: e };
      if (!n.range) {
        ta(a, x.value);
        return;
      }
      if (b.value === null) {
        const t = Ce.value.find((o) => !o.fill && o.i === e);
        if (!n.noUnset && t.range !== void 0) {
          ye({ target: a, from: t.range.from, to: t.range.to });
          return;
        }
        if (t.selected) {
          ye(a);
          return;
        }
        const l = V(a);
        ((b.value = { init: a, initHash: l, final: a, finalHash: l }), M('rangeStart', F(a)));
      } else {
        const t = b.value.initHash,
          l = V(a),
          o = t <= l ? { from: b.value.init, to: a } : { from: a, to: b.value.init };
        ((b.value = null),
          he(t === l ? a : { target: a, ...o }),
          M('rangeEnd', { from: F(o.from), to: F(o.to) }));
      }
    }
    function ra(e) {
      if (b.value !== null) {
        const a = { ...i.value, day: e };
        Object.assign(b.value, { final: a, finalHash: V(a) });
      }
    }
    return (
      Object.assign(W, {
        setToday: ke,
        setView: Xe,
        offsetCalendar: Ze,
        setCalendarTo: ce,
        setEditingRange: pe,
      }),
      () => {
        const e = [
            u('div', { class: 'q-date__content col relative-position' }, [
              u(K, { name: 'q-transition--fade' }, la[_.value]),
            ]),
          ],
          a = va(L.default);
        return (
          a !== void 0 && e.push(u('div', { class: 'q-date__actions' }, a)),
          n.name !== void 0 && !n.disable && Re(e, 'push'),
          u('div', { class: ze.value, ...Ge.value }, [
            na(),
            u('div', { ref: oe, class: 'q-date__main col column', tabindex: -1 }, e),
          ])
        );
      }
    );
  },
});
export { Sa as Q };
