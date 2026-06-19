import { Q as J } from './QPage-CM3LWBRo.js';
import { u as K } from './use-quasar-DaOT29F-.js';
import { A as X, a as Z } from './app-breadcrumbs-C0oZOPYe.js';
import {
  O as S,
  B as ee,
  w as D,
  Q as _,
  _ as C,
  an as P,
  W as d,
  V as s,
  S as r,
  T as m,
  X as n,
  a8 as j,
  am as B,
  a2 as $,
  bI as te,
  c as ae,
  g as oe,
  h as V,
  bK as re,
  bJ as le,
  f as u,
  at as I,
  $ as ne,
  R as z,
  a6 as W,
  U as Y,
  a0 as M,
  r as y,
  t as se,
  a7 as ie,
} from './index-CKSooU2k.js';
import { u as q } from './vue-i18n-Bebkm_iB.js';
import { A as O } from './app-select-DSldWHEY.js';
import { b as de } from './format-DnjzHs7F.js';
import { x as T } from './vue3-apexcharts-BQn37Kx1.js';
import { d as ce, Q as N } from './QTable-B4W-6HCk.js';
import { Q as ue } from './QTooltip-BUG2ohUJ.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './position-engine-Bv76xS6k.js';
import './QList-fArhXj97.js';
import './QLinearProgress-ComgvJOP.js';
const me = { class: 'row items-end q-col-gutter-md filter-grid' },
  pe = { class: 'col-12 col-md' },
  he = { class: 'custom-label q-mb-xs' },
  ve = { class: 'col-12 col-md' },
  be = { class: 'custom-label q-mb-xs' },
  fe = { class: 'col-12 col-md' },
  ge = { class: 'custom-label q-mb-xs' },
  _e = { class: 'col-12 col-md' },
  xe = { class: 'custom-label q-mb-xs' },
  ye = { class: 'col-12 col-md' },
  we = { class: 'custom-label q-mb-xs' },
  ke = { class: 'col-12 col-md' },
  Ce = { class: 'custom-label q-mb-xs' },
  Re = { class: 'col-12 col-md-auto' },
  Se = S({
    __name: 'exam-report-filter',
    props: { filter: {}, yearOptions: {}, monthOptions: {}, roundOptions: {} },
    emits: ['filter-change'],
    setup(e, { emit: a }) {
      const { t } = q(),
        p = e,
        b = a,
        o = ee({ ...p.filter });
      D(
        () => p.filter,
        (f) => {
          Object.assign(o, f);
        },
        { deep: !0 },
      );
      const c = () => {
        b('filter-change', { ...o });
      };
      return (f, i) => (
        _(),
        C(
          P,
          { flat: '', bordered: '', class: 'exam-report-filter q-mb-lg' },
          {
            default: d(() => [
              s(B, null, {
                default: d(() => [
                  r('div', me, [
                    r('div', pe, [
                      r('div', he, m(n(t)('admin.examReport.filter.fromYear')), 1),
                      s(
                        O,
                        {
                          modelValue: o.fromYear,
                          'onUpdate:modelValue': i[0] || (i[0] = (l) => (o.fromYear = l)),
                          options: e.yearOptions,
                          outlined: '',
                          dense: '',
                          'emit-value': '',
                          'map-options': '',
                          clearable: '',
                          'bg-color': 'white',
                          'dropdown-icon': 'keyboard_arrow_down',
                          class: 'custom-input',
                          'hide-bottom-space': '',
                          placeholder: n(t)('admin.examReport.filter.placeholders.year'),
                        },
                        null,
                        8,
                        ['modelValue', 'options', 'placeholder'],
                      ),
                    ]),
                    r('div', ve, [
                      r('div', be, m(n(t)('admin.examReport.filter.fromMonth')), 1),
                      s(
                        O,
                        {
                          modelValue: o.fromMonth,
                          'onUpdate:modelValue': i[1] || (i[1] = (l) => (o.fromMonth = l)),
                          options: e.monthOptions,
                          outlined: '',
                          dense: '',
                          'emit-value': '',
                          'map-options': '',
                          clearable: '',
                          'bg-color': 'white',
                          'dropdown-icon': 'keyboard_arrow_down',
                          class: 'custom-input',
                          'hide-bottom-space': '',
                          placeholder: n(t)('admin.examReport.filter.placeholders.month'),
                        },
                        null,
                        8,
                        ['modelValue', 'options', 'placeholder'],
                      ),
                    ]),
                    r('div', fe, [
                      r('div', ge, m(n(t)('admin.examReport.filter.fromRound')), 1),
                      s(
                        O,
                        {
                          modelValue: o.fromRound,
                          'onUpdate:modelValue': i[2] || (i[2] = (l) => (o.fromRound = l)),
                          options: e.roundOptions,
                          outlined: '',
                          dense: '',
                          'emit-value': '',
                          'map-options': '',
                          clearable: '',
                          'bg-color': 'white',
                          'dropdown-icon': 'keyboard_arrow_down',
                          class: 'custom-input',
                          'hide-bottom-space': '',
                          placeholder: n(t)('admin.examReport.filter.placeholders.round'),
                        },
                        null,
                        8,
                        ['modelValue', 'options', 'placeholder'],
                      ),
                    ]),
                    i[6] ||
                      (i[6] = r(
                        'div',
                        { class: 'col-auto column justify-center range-separator' },
                        '-',
                        -1,
                      )),
                    r('div', _e, [
                      r('div', xe, m(n(t)('admin.examReport.filter.toYear')), 1),
                      s(
                        O,
                        {
                          modelValue: o.toYear,
                          'onUpdate:modelValue': i[3] || (i[3] = (l) => (o.toYear = l)),
                          options: e.yearOptions,
                          outlined: '',
                          dense: '',
                          'emit-value': '',
                          'map-options': '',
                          clearable: '',
                          'bg-color': 'white',
                          'dropdown-icon': 'keyboard_arrow_down',
                          class: 'custom-input',
                          'hide-bottom-space': '',
                          placeholder: n(t)('admin.examReport.filter.placeholders.year'),
                        },
                        null,
                        8,
                        ['modelValue', 'options', 'placeholder'],
                      ),
                    ]),
                    r('div', ye, [
                      r('div', we, m(n(t)('admin.examReport.filter.toMonth')), 1),
                      s(
                        O,
                        {
                          modelValue: o.toMonth,
                          'onUpdate:modelValue': i[4] || (i[4] = (l) => (o.toMonth = l)),
                          options: e.monthOptions,
                          outlined: '',
                          dense: '',
                          'emit-value': '',
                          'map-options': '',
                          clearable: '',
                          'bg-color': 'white',
                          'dropdown-icon': 'keyboard_arrow_down',
                          class: 'custom-input',
                          'hide-bottom-space': '',
                          placeholder: n(t)('admin.examReport.filter.placeholders.month'),
                        },
                        null,
                        8,
                        ['modelValue', 'options', 'placeholder'],
                      ),
                    ]),
                    r('div', ke, [
                      r('div', Ce, m(n(t)('admin.examReport.filter.toRound')), 1),
                      s(
                        O,
                        {
                          modelValue: o.toRound,
                          'onUpdate:modelValue': i[5] || (i[5] = (l) => (o.toRound = l)),
                          options: e.roundOptions,
                          outlined: '',
                          dense: '',
                          'emit-value': '',
                          'map-options': '',
                          clearable: '',
                          'bg-color': 'white',
                          'dropdown-icon': 'keyboard_arrow_down',
                          class: 'custom-input',
                          'hide-bottom-space': '',
                          placeholder: n(t)('admin.examReport.filter.placeholders.round'),
                        },
                        null,
                        8,
                        ['modelValue', 'options', 'placeholder'],
                      ),
                    ]),
                    r('div', Re, [
                      s(
                        j,
                        {
                          unelevated: '',
                          'no-caps': '',
                          color: 'primary',
                          icon: 'filter_alt',
                          class: 'filter-btn full-width',
                          label: n(t)('admin.examReport.filter.apply'),
                          onClick: c,
                        },
                        null,
                        8,
                        ['label'],
                      ),
                    ]),
                  ]),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  $e = $(Se, [['__scopeId', 'data-v-13e7f6dc']]),
  Ve = {
    ...te,
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    color: String,
    centerColor: String,
    trackColor: String,
    fontSize: String,
    rounded: Boolean,
    thickness: { type: Number, default: 0.2, validator: (e) => e >= 0 && e <= 1 },
    angle: { type: Number, default: 0 },
    showValue: Boolean,
    reverse: Boolean,
    instantFeedback: Boolean,
  },
  L = 50,
  H = 2 * L,
  G = H * Math.PI,
  Oe = Math.round(G * 1e3) / 1e3,
  Pe = ae({
    name: 'QCircularProgress',
    props: {
      ...Ve,
      value: { type: Number, default: 0 },
      animationSpeed: { type: [String, Number], default: 600 },
      indeterminate: Boolean,
    },
    setup(e, { slots: a }) {
      const {
          proxy: { $q: t },
        } = oe(),
        p = le(e),
        b = u(() => {
          const v = (t.lang.rtl ? -1 : 1) * e.angle;
          return {
            transform:
              e.reverse !== (t.lang.rtl === !0)
                ? `scale3d(-1, 1, 1) rotate3d(0, 0, 1, ${-90 - v}deg)`
                : `rotate3d(0, 0, 1, ${v - 90}deg)`,
          };
        }),
        o = u(() =>
          !e.instantFeedback && !e.indeterminate
            ? {
                transition: `stroke-dashoffset ${e.animationSpeed}ms ease 0s, stroke ${e.animationSpeed}ms ease`,
              }
            : '',
        ),
        c = u(() => H / (1 - e.thickness / 2)),
        f = u(() => `${c.value / 2} ${c.value / 2} ${c.value} ${c.value}`),
        i = u(() => de(e.value, e.min, e.max)),
        l = u(() => e.max - e.min),
        x = u(() => (e.thickness / 2) * c.value),
        R = u(() => {
          const v = (e.max - i.value) / l.value,
            k = e.rounded && i.value < e.max && v < 0.25 ? (x.value / 2) * (1 - v / 0.25) : 0;
          return G * v + k;
        });
      function w({ thickness: v, offset: k, color: F, cls: A, rounded: h }) {
        return V('circle', {
          class: 'q-circular-progress__' + A + (F !== void 0 ? ` text-${F}` : ''),
          style: o.value,
          fill: 'transparent',
          stroke: 'currentColor',
          'stroke-width': v,
          'stroke-dasharray': Oe,
          'stroke-dashoffset': k,
          'stroke-linecap': h,
          cx: c.value,
          cy: c.value,
          r: L,
        });
      }
      return () => {
        const v = [];
        (e.centerColor !== void 0 &&
          e.centerColor !== 'transparent' &&
          v.push(
            V('circle', {
              class: `q-circular-progress__center text-${e.centerColor}`,
              fill: 'currentColor',
              r: L - x.value / 2,
              cx: c.value,
              cy: c.value,
            }),
          ),
          e.trackColor !== void 0 &&
            e.trackColor !== 'transparent' &&
            v.push(w({ cls: 'track', thickness: x.value, offset: 0, color: e.trackColor })),
          v.push(
            w({
              cls: 'circle',
              thickness: x.value,
              offset: R.value,
              color: e.color,
              rounded: e.rounded ? 'round' : void 0,
            }),
          ));
        const k = [
          V(
            'svg',
            {
              class: 'q-circular-progress__svg',
              style: b.value,
              viewBox: f.value,
              'aria-hidden': 'true',
            },
            v,
          ),
        ];
        return (
          e.showValue &&
            k.push(
              V(
                'div',
                {
                  class: 'q-circular-progress__text absolute-full row flex-center content-center',
                  style: { fontSize: e.fontSize },
                },
                a.default !== void 0 ? a.default() : [V('div', i.value)],
              ),
            ),
          V(
            'div',
            {
              class: `q-circular-progress q-circular-progress--${e.indeterminate ? 'in' : ''}determinate`,
              style: p.value,
              role: 'progressbar',
              'aria-valuemin': e.min,
              'aria-valuemax': e.max,
              'aria-valuenow': e.indeterminate ? void 0 : i.value,
            },
            re(a.internal, k),
          )
        );
      };
    },
  }),
  g = (e, a = '#000000') =>
    typeof window > 'u' || typeof document > 'u'
      ? a
      : getComputedStyle(document.documentElement).getPropertyValue(e).trim() || a,
  Be = { class: 'col column justify-between' },
  qe = { class: 'stat-card__label' },
  Fe = { class: 'stat-card__value' },
  ze = { class: 'stat-card__trend row items-center' },
  Ae = { class: 'stat-card__compare' },
  Qe = { key: 0, class: 'col-auto column justify-center items-center stat-card__visual' },
  Me = { class: 'stat-card__donut-value' },
  Ne = { key: 0, class: 'stat-card__visual-caption' },
  Te = S({
    __name: 'exam-report-stat-card',
    props: { card: {} },
    setup(e) {
      const a = e,
        t = u(() => g(a.card.iconColorVar)),
        p = u(() => ({ backgroundColor: g(a.card.iconBgVar) })),
        b = u(() => a.card.value.toLocaleString('en-US')),
        o = u(() =>
          g(a.card.trend === 'down' ? '--exam-report-trend-down' : '--exam-report-trend-up'),
        ),
        c = u(() => (a.card.trend === 'up' ? '▲' : a.card.trend === 'down' ? '▼' : '—')),
        f = u(() => (a.card.key === 'absent' ? 'negative' : 'positive')),
        i = u(() => [{ name: a.card.label, data: a.card.sparkline ?? [] }]),
        l = u(() => ({
          chart: { type: 'area', sparkline: { enabled: !0 } },
          stroke: { curve: 'smooth', width: 2 },
          fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
          colors: [g('--exam-report-stat-score')],
          tooltip: { enabled: !1 },
        }));
      return (x, R) => (
        _(),
        C(
          P,
          { flat: '', bordered: '', class: 'stat-card' },
          {
            default: d(() => [
              s(
                B,
                { class: 'stat-card__body row no-wrap items-stretch' },
                {
                  default: d(() => [
                    r('div', Be, [
                      r(
                        'div',
                        { class: 'stat-card__icon-box', style: I(p.value) },
                        [
                          s(
                            ne,
                            { name: e.card.icon, size: '24px', style: I({ color: t.value }) },
                            null,
                            8,
                            ['name', 'style'],
                          ),
                        ],
                        4,
                      ),
                      r('div', qe, m(e.card.label), 1),
                      r('div', Fe, m(b.value), 1),
                      r('div', ze, [
                        r(
                          'span',
                          { class: 'stat-card__change', style: I({ color: o.value }) },
                          m(c.value) + ' ' + m(e.card.changePercent) + '% ',
                          5,
                        ),
                        r('span', Ae, m(e.card.comparePrevious), 1),
                      ]),
                    ]),
                    e.card.visual !== 'none'
                      ? (_(),
                        z('div', Qe, [
                          e.card.visual === 'donut'
                            ? (_(),
                              z(
                                W,
                                { key: 0 },
                                [
                                  s(
                                    Pe,
                                    {
                                      value: e.card.donutPercent ?? 0,
                                      size: '60px',
                                      thickness: 0.18,
                                      color: f.value,
                                      'track-color': 'grey-3',
                                      'show-value': '',
                                      class: 'stat-card__donut',
                                    },
                                    {
                                      default: d(() => [
                                        r('span', Me, m(e.card.donutPercent ?? 0) + '%', 1),
                                      ]),
                                      _: 1,
                                    },
                                    8,
                                    ['value', 'color'],
                                  ),
                                  e.card.donutCaption
                                    ? (_(), z('div', Ne, m(e.card.donutCaption), 1))
                                    : Y('', !0),
                                ],
                                64,
                              ))
                            : e.card.visual === 'sparkline'
                              ? (_(),
                                C(
                                  n(T),
                                  {
                                    key: 1,
                                    type: 'area',
                                    height: '48',
                                    width: '80',
                                    options: l.value,
                                    series: i.value,
                                  },
                                  null,
                                  8,
                                  ['options', 'series'],
                                ))
                              : Y('', !0),
                        ]))
                      : Y('', !0),
                  ]),
                  _: 1,
                },
              ),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  Ee = $(Te, [['__scopeId', 'data-v-1f555a0b']]),
  Ie = { class: 'chart-card__title' },
  Ye = S({
    __name: 'exam-attendance-bar-chart',
    props: { data: {} },
    setup(e) {
      const { t: a } = q(),
        t = e,
        p = u(() => [
          { name: a('admin.examReport.charts.attended'), data: t.data.attended },
          { name: a('admin.examReport.charts.absent'), data: t.data.absent },
        ]),
        b = u(() => ({
          chart: { type: 'bar', toolbar: { show: !1 }, fontFamily: 'inherit' },
          colors: [g('--exam-report-chart-attend'), g('--exam-report-chart-absent')],
          plotOptions: {
            bar: { columnWidth: '55%', borderRadius: 4, dataLabels: { position: 'top' } },
          },
          dataLabels: {
            enabled: !0,
            offsetY: -18,
            style: { fontSize: '10px', colors: [g('--text-secondary')] },
          },
          grid: { borderColor: g('--border-color'), strokeDashArray: 4 },
          xaxis: { categories: t.data.categories },
          yaxis: { max: 500, tickAmount: 5 },
          legend: { position: 'bottom', horizontalAlign: 'center' },
          tooltip: { shared: !0, intersect: !1 },
        }));
      return (o, c) => (
        _(),
        C(
          P,
          { flat: '', bordered: '', class: 'chart-card' },
          {
            default: d(() => [
              s(B, null, {
                default: d(() => [
                  r('div', Ie, m(n(a)('admin.examReport.charts.attendanceTitle')), 1),
                  s(
                    n(T),
                    { type: 'bar', height: '320', options: b.value, series: p.value },
                    null,
                    8,
                    ['options', 'series'],
                  ),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  Le = $(Ye, [['__scopeId', 'data-v-7ac1c54a']]),
  Ue = { class: 'chart-card__title' },
  De = S({
    __name: 'exam-registration-trend-chart',
    props: { data: {} },
    setup(e) {
      const { t: a } = q(),
        t = e,
        p = u(() => [{ name: a('admin.examReport.charts.registered'), data: t.data.registered }]),
        b = u(() => ({
          chart: {
            type: 'line',
            toolbar: { show: !1 },
            fontFamily: 'inherit',
            dropShadow: {
              enabled: !0,
              top: 6,
              left: 0,
              blur: 6,
              opacity: 0.25,
              color: g('--exam-report-chart-line'),
            },
          },
          colors: [g('--exam-report-chart-line')],
          stroke: { curve: 'smooth', width: 3 },
          markers: { size: 4 },
          dataLabels: {
            enabled: !0,
            style: { fontSize: '10px', colors: [g('--text-secondary')] },
            background: { enabled: !1 },
            offsetY: -6,
          },
          grid: { borderColor: g('--border-color'), strokeDashArray: 4 },
          xaxis: { categories: t.data.categories },
          yaxis: { max: 600, tickAmount: 6 },
          legend: { position: 'bottom', horizontalAlign: 'center' },
        }));
      return (o, c) => (
        _(),
        C(
          P,
          { flat: '', bordered: '', class: 'chart-card' },
          {
            default: d(() => [
              s(B, null, {
                default: d(() => [
                  r('div', Ue, m(n(a)('admin.examReport.charts.trendTitle')), 1),
                  s(
                    n(T),
                    { type: 'line', height: '320', options: b.value, series: p.value },
                    null,
                    8,
                    ['options', 'series'],
                  ),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  je = $(De, [['__scopeId', 'data-v-0629bfa5']]),
  We = { class: 'chart-card__title' },
  He = S({
    __name: 'exam-score-summary-chart',
    props: { data: {} },
    setup(e) {
      const { t: a } = q(),
        t = e,
        p = u(() => t.data.series.map((o) => ({ name: o.name, data: o.data }))),
        b = u(() => ({
          chart: { type: 'bar', stacked: !0, toolbar: { show: !1 }, fontFamily: 'inherit' },
          colors: t.data.series.map((o) => g(o.colorVar)),
          plotOptions: { bar: { horizontal: !0, barHeight: '60%', borderRadius: 2 } },
          dataLabels: {
            enabled: !0,
            style: { fontSize: '10px', colors: [g('--text-on-primary')] },
          },
          grid: { borderColor: g('--border-color'), strokeDashArray: 4 },
          xaxis: {
            categories: t.data.years,
            title: { text: a('admin.examReport.charts.peopleUnit') },
          },
          legend: { position: 'bottom', horizontalAlign: 'center' },
          tooltip: { shared: !0, intersect: !1 },
        }));
      return (o, c) => (
        _(),
        C(
          P,
          { flat: '', bordered: '', class: 'chart-card' },
          {
            default: d(() => [
              s(B, null, {
                default: d(() => [
                  r('div', We, m(n(a)('admin.examReport.charts.scoreSummaryTitle')), 1),
                  s(
                    n(T),
                    { type: 'bar', height: '320', options: b.value, series: p.value },
                    null,
                    8,
                    ['options', 'series'],
                  ),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  Ge = $(He, [['__scopeId', 'data-v-f5fc9224']]),
  Je = { class: 'rounds-card__title' },
  Ke = { class: 'full-width text-center text-grey-6 q-pa-md' },
  Xe = S({
    __name: 'exam-rounds-table',
    props: { rows: {}, loading: { type: Boolean } },
    emits: ['view-registrants'],
    setup(e, { emit: a }) {
      const { t } = q(),
        p = a,
        b = { rowsPerPage: 6 },
        o = (f) => (f === null ? '-' : f.toLocaleString('en-US')),
        c = u(() => [
          {
            name: 'round',
            label: t('admin.examReport.table.columns.round'),
            field: 'round',
            align: 'left',
          },
          {
            name: 'date',
            label: t('admin.examReport.table.columns.date'),
            field: 'date',
            align: 'left',
          },
          {
            name: 'registered',
            label: t('admin.examReport.table.columns.registered'),
            field: 'registered',
            align: 'center',
          },
          {
            name: 'attended',
            label: t('admin.examReport.table.columns.attended'),
            field: 'attended',
            align: 'center',
          },
          {
            name: 'absent',
            label: t('admin.examReport.table.columns.absent'),
            field: 'absent',
            align: 'center',
          },
          {
            name: 'tools',
            label: t('admin.examReport.table.columns.tools'),
            field: 'round',
            align: 'center',
          },
        ]);
      return (f, i) => (
        _(),
        C(
          P,
          { flat: '', bordered: '', class: 'rounds-card' },
          {
            default: d(() => [
              s(B, null, {
                default: d(() => [
                  r('div', Je, m(n(t)('admin.examReport.table.title')), 1),
                  s(
                    ce,
                    {
                      flat: '',
                      rows: e.rows,
                      columns: c.value,
                      'row-key': 'round',
                      loading: e.loading,
                      pagination: b,
                      'rows-per-page-options': [6, 10, 20],
                      class: 'rounds-table',
                    },
                    {
                      'body-cell-registered': d((l) => [
                        s(
                          N,
                          { props: l },
                          { default: d(() => [M(m(o(l.row.registered)), 1)]), _: 2 },
                          1032,
                          ['props'],
                        ),
                      ]),
                      'body-cell-attended': d((l) => [
                        s(
                          N,
                          { props: l },
                          { default: d(() => [M(m(o(l.row.attended)), 1)]), _: 2 },
                          1032,
                          ['props'],
                        ),
                      ]),
                      'body-cell-absent': d((l) => [
                        s(
                          N,
                          { props: l },
                          { default: d(() => [M(m(o(l.row.absent)), 1)]), _: 2 },
                          1032,
                          ['props'],
                        ),
                      ]),
                      'body-cell-tools': d((l) => [
                        s(
                          N,
                          { props: l },
                          {
                            default: d(() => [
                              s(
                                j,
                                {
                                  flat: '',
                                  round: '',
                                  dense: '',
                                  color: 'primary',
                                  icon: 'people_outline',
                                  disable: l.row.registered === null,
                                  onClick: (x) => p('view-registrants', l.row),
                                },
                                {
                                  default: d(() => [
                                    s(ue, null, {
                                      default: d(() => [
                                        M(m(n(t)('admin.examReport.table.viewRegistrants')), 1),
                                      ]),
                                      _: 1,
                                    }),
                                  ]),
                                  _: 1,
                                },
                                8,
                                ['disable', 'onClick'],
                              ),
                            ]),
                            _: 2,
                          },
                          1032,
                          ['props'],
                        ),
                      ]),
                      'no-data': d(() => [
                        r('div', Ke, m(n(t)('admin.examReport.table.emptyLabel')), 1),
                      ]),
                      _: 1,
                    },
                    8,
                    ['rows', 'columns', 'loading'],
                  ),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  Ze = $(Xe, [['__scopeId', 'data-v-6726d096']]),
  E = (e, a = 300) => new Promise((t) => setTimeout(() => t(e), a)),
  et = () =>
    E([
      { label: '2569', value: '2569' },
      { label: '2568', value: '2568' },
      { label: '2567', value: '2567' },
      { label: '2566', value: '2566' },
      { label: '2565', value: '2565' },
    ]),
  tt = () =>
    E([
      { label: 'มกราคม', value: '01' },
      { label: 'กุมภาพันธ์', value: '02' },
      { label: 'มีนาคม', value: '03' },
      { label: 'เมษายน', value: '04' },
      { label: 'พฤษภาคม', value: '05' },
      { label: 'มิถุนายน', value: '06' },
      { label: 'กรกฎาคม', value: '07' },
      { label: 'สิงหาคม', value: '08' },
      { label: 'กันยายน', value: '09' },
      { label: 'ตุลาคม', value: '10' },
      { label: 'พฤศจิกายน', value: '11' },
      { label: 'ธันวาคม', value: '12' },
    ]),
  at = () =>
    E([
      { label: '1/2026', value: '1/2026' },
      { label: '2/2026', value: '2/2026' },
      { label: '3/2026', value: '3/2026' },
      { label: '4/2026', value: '4/2026' },
      { label: '5/2026', value: '5/2026' },
      { label: '6/2026', value: '6/2026' },
    ]),
  ot = (e) =>
    E({
      statCards: [
        {
          key: 'applicant',
          icon: 'people',
          iconColorVar: '--exam-report-stat-applicant',
          iconBgVar: '--exam-report-stat-applicant-bg',
          label: 'จำนวนผู้สมัคร',
          value: 12540,
          unit: 'คน',
          trend: 'up',
          changePercent: 12,
          comparePrevious: 'จากปีที่แล้ว (11,200 คน)',
          visual: 'none',
        },
        {
          key: 'attended',
          icon: 'check_circle',
          iconColorVar: '--exam-report-stat-attended',
          iconBgVar: '--exam-report-stat-attended-bg',
          label: 'ผู้เข้าสอบ',
          value: 11230,
          unit: 'คน',
          trend: 'up',
          changePercent: 8,
          comparePrevious: 'จากปีที่แล้ว (10,400 คน)',
          visual: 'donut',
          donutPercent: 89,
          donutCaption: 'อัตราการเข้าสอบ',
        },
        {
          key: 'absent',
          icon: 'block',
          iconColorVar: '--exam-report-stat-absent',
          iconBgVar: '--exam-report-stat-absent-bg',
          label: 'ขาดสอบ',
          value: 1310,
          unit: 'คน',
          trend: 'up',
          changePercent: 12,
          comparePrevious: 'จากปีที่แล้ว (1,170 คน)',
          visual: 'donut',
          donutPercent: 11,
          donutCaption: 'อัตราการขาดสอบ',
        },
        {
          key: 'averageScore',
          icon: 'bar_chart',
          iconColorVar: '--exam-report-stat-score',
          iconBgVar: '--exam-report-stat-score-bg',
          label: 'คะแนนเฉลี่ย',
          value: 635,
          unit: 'คะแนน',
          trend: 'up',
          changePercent: 7,
          comparePrevious: 'จากปีที่แล้ว (593 คะแนน)',
          visual: 'sparkline',
          sparkline: [560, 580, 575, 600, 610, 620, 635],
        },
      ],
      attendanceChart: {
        categories: ['2022', '2023', '2024', '2025', '2026'],
        attended: [300, 420, 334, 350, 299],
        absent: [20, 30, 16, 6, 1],
      },
      trendChart: {
        categories: ['2022', '2023', '2024', '2025', '2026'],
        registered: [200, 450, 500, 500, 600],
      },
      rounds: [
        { round: '1/2026', date: '15 พ.ย. 2568', registered: 320, attended: 290, absent: 30 },
        { round: '2/2026', date: '24 ม.ค. 2569', registered: 310, attended: 300, absent: 10 },
        { round: '3/2026', date: '7 มี.ค. 2569', registered: 290, attended: 250, absent: 40 },
        { round: '4/2026', date: '16 พ.ค. 2569', registered: 315, attended: 280, absent: 35 },
        { round: '5/2026', date: '11 ก.ค. 2569', registered: 310, attended: null, absent: null },
        { round: '6/2026', date: '12 ก.ย. 2569', registered: null, attended: null, absent: null },
      ],
      scoreSummaryChart: {
        years: ['2565', '2566', '2567', '2568', '2569'],
        series: [
          { name: '40-49', colorVar: '--exam-report-score-40', data: [177, 152, 155, 166, 199] },
          { name: '50-59', colorVar: '--exam-report-score-50', data: [66, 67, 52, 66, 45] },
          { name: '60-69', colorVar: '--exam-report-score-60', data: [111, 91, 99, 122, 144] },
          { name: '70-79', colorVar: '--exam-report-score-70', data: [80, 90, 70, 50, 120] },
          { name: '80-100', colorVar: '--exam-report-score-80', data: [40, 50, 38, 100, 54] },
        ],
      },
    });
function rt() {
  const { t: e } = q(),
    a = y(!1),
    t = y(null),
    p = y([]),
    b = y({ categories: [], attended: [], absent: [] }),
    o = y({ categories: [], registered: [] }),
    c = y([]),
    f = y({ years: [], series: [] }),
    i = y([]),
    l = y([]),
    x = y([]),
    R = () => ({
      fromYear: '',
      fromMonth: '',
      fromRound: '',
      toYear: '',
      toMonth: '',
      toRound: '',
    }),
    w = y(R()),
    v = async () => {
      ((a.value = !0), (t.value = null));
      try {
        const h = await ot(w.value);
        ((p.value = h.statCards),
          (b.value = h.attendanceChart),
          (o.value = h.trendChart),
          (c.value = h.rounds),
          (f.value = h.scoreSummaryChart));
      } catch {
        ((t.value = e('admin.examReport.notifications.loadError')), (p.value = []), (c.value = []));
      } finally {
        a.value = !1;
      }
    };
  return {
    isLoading: a,
    error: t,
    statCards: p,
    attendanceChart: b,
    trendChart: o,
    rounds: c,
    scoreSummaryChart: f,
    yearOptions: i,
    monthOptions: l,
    roundOptions: x,
    filter: w,
    fetchData: v,
    loadFilterOptions: async () => {
      try {
        const [h, U, Q] = await Promise.all([et(), tt(), at()]);
        ((i.value = h), (l.value = U), (x.value = Q));
      } catch {
        ((i.value = []), (l.value = []), (x.value = []));
      }
    },
    applyFilter: (h) => {
      ((w.value = { ...h }), v());
    },
    resetFilter: () => {
      ((w.value = R()), v());
    },
  };
}
const lt = { class: 'row q-col-gutter-md q-mb-md' },
  nt = { class: 'row q-col-gutter-md q-mb-md' },
  st = { class: 'col-12 col-lg-6' },
  it = { class: 'col-12 col-lg-6' },
  dt = { class: 'row q-col-gutter-md' },
  ct = { class: 'col-12 col-lg-6' },
  ut = { class: 'col-12 col-lg-6' },
  mt = S({
    __name: 'exam-report-page',
    setup(e) {
      const a = K(),
        {
          isLoading: t,
          error: p,
          statCards: b,
          attendanceChart: o,
          trendChart: c,
          rounds: f,
          scoreSummaryChart: i,
          yearOptions: l,
          monthOptions: x,
          roundOptions: R,
          filter: w,
          fetchData: v,
          loadFilterOptions: k,
          applyFilter: F,
        } = rt();
      D(p, (h) => {
        h && a.notify({ type: 'negative', message: h, position: 'top' });
      });
      const A = (h) => {
        a.notify({ type: 'info', message: `${h.round} — ${h.date}`, position: 'top' });
      };
      return (
        se(() => {
          (k(), v());
        }),
        (h, U) => (
          _(),
          C(
            J,
            { class: 'page-container exam-report-page' },
            {
              default: d(() => [
                s(X),
                s(
                  Z,
                  {
                    title: h.$t('admin.examReport.pageTitle'),
                    subtitle: h.$t('admin.examReport.pageSubtitle'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                s(
                  $e,
                  {
                    filter: n(w),
                    'year-options': n(l),
                    'month-options': n(x),
                    'round-options': n(R),
                    onFilterChange: n(F),
                  },
                  null,
                  8,
                  ['filter', 'year-options', 'month-options', 'round-options', 'onFilterChange'],
                ),
                r('div', lt, [
                  (_(!0),
                  z(
                    W,
                    null,
                    ie(
                      n(b),
                      (Q) => (
                        _(),
                        z('div', { key: Q.key, class: 'col-12 col-sm-6 col-lg-3' }, [
                          s(Ee, { card: Q }, null, 8, ['card']),
                        ])
                      ),
                    ),
                    128,
                  )),
                ]),
                r('div', nt, [
                  r('div', st, [s(Le, { data: n(o) }, null, 8, ['data'])]),
                  r('div', it, [
                    s(Ze, { rows: n(f), loading: n(t), onViewRegistrants: A }, null, 8, [
                      'rows',
                      'loading',
                    ]),
                  ]),
                ]),
                r('div', dt, [
                  r('div', ct, [s(je, { data: n(c) }, null, 8, ['data'])]),
                  r('div', ut, [s(Ge, { data: n(i) }, null, 8, ['data'])]),
                ]),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  }),
  Ot = $(mt, [['__scopeId', 'data-v-1d7a8381']]);
export { Ot as default };
