import { d as J, Q as h } from './QTable-B4W-6HCk.js';
import {
  c as H,
  h as W,
  a as G,
  f as d,
  O as K,
  r as X,
  w as C,
  Q as y,
  R as _,
  V as i,
  aB as Y,
  W as l,
  aC as N,
  b2 as k,
  b3 as Z,
  S as b,
  T as u,
  a8 as w,
  _ as Q,
  a0 as R,
  ao as D,
  a6 as ee,
  a7 as te,
  a2 as oe,
} from './index-CKSooU2k.js';
import { b as ae } from './QSelect-CcXwe87O.js';
import { Q as ne } from './QSpinnerDots-Dwh4MvNX.js';
import { Q as se } from './QInnerLoading-CAwPoqSH.js';
const L = H({
    name: 'QTr',
    props: { props: Object, noHover: Boolean },
    setup(r, { slots: P }) {
      const s = d(
        () =>
          'q-tr' +
          (r.props === void 0 || r.props.header ? '' : ' ' + r.props.__trClass) +
          (r.noHover ? ' q-tr--no-hover' : ''),
      );
      return () => W('tr', { style: r.props?.__trStyle, class: s.value }, G(P.default));
    },
  }),
  re = { class: 'base-table-wrapper full-width' },
  ie = {
    class: 'base-table-bottom row items-center justify-end full-width q-gutter-x-md text-grey-8',
  },
  le = { class: 'row items-center q-gutter-x-sm' },
  ue = { class: 'row items-center no-wrap' },
  de = K({
    __name: 'base-table',
    props: {
      columns: {},
      rows: {},
      loading: { type: Boolean },
      pagination: {},
      emptyLabel: { default: '' },
      hidePagination: { type: Boolean },
    },
    emits: ['request'],
    setup(r, { emit: P }) {
      const s = r,
        V = P,
        f = (e, t, o) => {
          e && (e[t] = o);
        },
        p = (() => {
          try {
            const e = `base-table-sort:${window.location.pathname}:${s.columns.map((o) => o.name).join('_')}`,
              t = sessionStorage.getItem(e);
            if (t) {
              const o = JSON.parse(t);
              if (o && typeof o == 'object') return { sortBy: o.sortBy, descending: o.descending };
            }
          } catch {}
          return null;
        })();
      s.pagination &&
        p &&
        (f(s.pagination, 'sortBy', p.sortBy), f(s.pagination, 'descending', p.descending));
      const a = X({
        page: s.pagination?.page ?? 1,
        rowsPerPage: s.pagination?.rowsPerPage ?? 10,
        sortBy: s.pagination?.sortBy ?? p?.sortBy ?? null,
        descending: s.pagination?.descending ?? p?.descending ?? !1,
        rowsNumber: s.pagination?.rowsNumber ?? 0,
      });
      C(
        () => [a.value.sortBy, a.value.descending],
        (e) => {
          const t = e[0],
            o = e[1];
          try {
            const n = `base-table-sort:${window.location.pathname}:${s.columns.map((m) => m.name).join('_')}`;
            sessionStorage.setItem(n, JSON.stringify({ sortBy: t, descending: o }));
          } catch {}
          s.pagination &&
            (s.pagination.sortBy !== t && f(s.pagination, 'sortBy', t),
            s.pagination.descending !== o && f(s.pagination, 'descending', o));
        },
      );
      const O = new Set(['tools', 'actions', 'action']),
        v = d(() => s.columns.map((e) => ({ ...e, sortable: e.sortable ?? !O.has(e.name) }))),
        x = d(() => {
          const e = ['createdAt', 'CREATED_AT', 'updatedAt', 'UPDATED_AT', 'id', 'index'];
          for (const t of e) {
            const o = v.value.find((n) => n.sortable && n.name === t);
            if (o) return o;
          }
        });
      C(
        () => s.pagination,
        (e) => {
          e &&
            (a.value = {
              ...a.value,
              ...e,
              sortBy: e.sortBy ?? a.value.sortBy ?? null,
              descending: e.descending ?? a.value.descending ?? !1,
              rowsNumber: e.rowsNumber ?? a.value.rowsNumber ?? 0,
            });
        },
        { deep: !0 },
      );
      const S = (e, t) => (typeof t.field == 'function' ? t.field(e) : e[t.field]),
        A = (e, t) => {
          if (e === t) return 0;
          if (e == null) return 1;
          if (t == null) return -1;
          if (typeof e == 'number' && typeof t == 'number') return e - t;
          if (e instanceof Date && t instanceof Date) return e.getTime() - t.getTime();
          const o = (n) =>
            typeof n == 'string' ||
            typeof n == 'number' ||
            typeof n == 'boolean' ||
            typeof n == 'bigint'
              ? String(n)
              : JSON.stringify(n) || '';
          return o(e).localeCompare(o(t), 'th', { numeric: !0, sensitivity: 'base' });
        },
        q = d(() => {
          const e = s.rows ?? [],
            t = a.value.sortBy ?? x.value?.name;
          if (!t) return e;
          const o = v.value.find((B) => B.name === t);
          if (!o?.sortable) return e;
          const n = a.value.sortBy === null,
            m = o.name !== 'index',
            U = (n ? m : a.value.descending) ? -1 : 1;
          return [...e].sort((B, F) => A(S(B, o), S(F, o)) * U);
        }),
        z = d(() => {
          const e = q.value;
          if (e.length === 0) return [{ __empty: !0 }];
          const t = a.value.page || 1,
            o = a.value.rowsPerPage || e.length,
            n = (t - 1) * o;
          return e.slice(n, n + o);
        }),
        T = d(() => a.value.page <= 1),
        $ = d(() => {
          const e = a.value.rowsNumber ?? 0,
            t = Math.ceil(e / a.value.rowsPerPage) || 1;
          return a.value.page >= t;
        }),
        c = (e) => {
          const t = { ...a.value, ...e.pagination, rowsNumber: a.value.rowsNumber ?? 0 };
          ((a.value = t), V('request', { ...e, pagination: g(t.page) }));
        },
        g = (e) => {
          const { rowsPerPage: t, sortBy: o, descending: n, rowsNumber: m } = a.value;
          return {
            page: e,
            rowsPerPage: t,
            descending: n ?? !1,
            rowsNumber: m ?? 0,
            ...(o ? { sortBy: o } : {}),
          };
        },
        E = () => {
          c({ pagination: g(1) });
        },
        I = () => {
          c({ pagination: g(a.value.page - 1) });
        },
        j = () => {
          c({ pagination: g(a.value.page + 1) });
        },
        M = () => {
          const e = a.value.rowsNumber ?? 0,
            t = Math.ceil(e / a.value.rowsPerPage) || 1;
          c({ pagination: g(t) });
        };
      return (e, t) => (
        y(),
        _('div', re, [
          i(
            J,
            {
              flat: '',
              rows: z.value,
              columns: v.value,
              loading: r.loading,
              pagination: a.value,
              'onUpdate:pagination': t[6] || (t[6] = (o) => (a.value = o)),
              'rows-per-page-options': [],
              'hide-bottom': r.hidePagination,
              'always-paginated': '',
              onRequest: c,
              class: 'base-table',
            },
            Y(
              {
                body: l((o) => [
                  o.row.__empty
                    ? (y(),
                      Q(
                        L,
                        { key: 0 },
                        {
                          default: l(() => [
                            i(
                              h,
                              {
                                colspan: v.value.length,
                                class: 'base-table-empty-cell text-center text-grey-8',
                              },
                              {
                                default: l(() => [
                                  R(u(r.emptyLabel || e.$t('components.baseTable.emptyLabel')), 1),
                                ]),
                                _: 1,
                              },
                              8,
                              ['colspan'],
                            ),
                          ]),
                          _: 1,
                        },
                      ))
                    : N(
                        e.$slots,
                        'body',
                        k(D({ key: 1 }, o)),
                        () => [
                          i(
                            L,
                            { props: o },
                            {
                              default: l(() => [
                                (y(!0),
                                _(
                                  ee,
                                  null,
                                  te(
                                    o.cols,
                                    (n) => (
                                      y(),
                                      Q(
                                        h,
                                        { key: n.name, props: o },
                                        {
                                          default: l(() => [
                                            N(
                                              e.$slots,
                                              `body-cell-${n.name}`,
                                              D(
                                                { ref_for: !0 },
                                                { row: o.row, col: n, value: n.value },
                                              ),
                                              () => [R(u(n.value), 1)],
                                              !0,
                                            ),
                                          ]),
                                          _: 2,
                                        },
                                        1032,
                                        ['props'],
                                      )
                                    ),
                                  ),
                                  128,
                                )),
                              ]),
                              _: 2,
                            },
                            1032,
                            ['props'],
                          ),
                        ],
                        !0,
                      ),
                ]),
                bottom: l(() => [
                  b('div', ie, [
                    b('div', le, [
                      b('span', null, u(e.$t('components.baseTable.rowsPerPage')), 1),
                      i(
                        ae,
                        {
                          modelValue: a.value.rowsPerPage,
                          'onUpdate:modelValue': [
                            t[0] || (t[0] = (o) => (a.value.rowsPerPage = o)),
                            t[1] ||
                              (t[1] = (o) => {
                                ((a.value.rowsPerPage = o), c({ pagination: g(1) }));
                              }),
                          ],
                          options: [10, 25, 50],
                          dense: '',
                          outlined: '',
                          'options-dense': '',
                          class: 'pagination-select',
                        },
                        null,
                        8,
                        ['modelValue'],
                      ),
                    ]),
                    b(
                      'div',
                      null,
                      u(e.$t('components.baseTable.showing')) +
                        ' ' +
                        u(
                          (a.value.rowsNumber || 0) === 0
                            ? 0
                            : a.value.rowsPerPage * (a.value.page - 1) + 1,
                        ) +
                        ' ' +
                        u(e.$t('components.baseTable.to')) +
                        ' ' +
                        u(Math.min(a.value.rowsPerPage * a.value.page, a.value.rowsNumber || 0)) +
                        ' ' +
                        u(e.$t('components.baseTable.ofItems', { total: a.value.rowsNumber || 0 })),
                      1,
                    ),
                    b('div', ue, [
                      i(
                        w,
                        {
                          icon: 'first_page',
                          round: '',
                          dense: '',
                          flat: '',
                          size: 'sm',
                          disable: T.value,
                          onClick: t[2] || (t[2] = (o) => E()),
                        },
                        null,
                        8,
                        ['disable'],
                      ),
                      i(
                        w,
                        {
                          icon: 'chevron_left',
                          round: '',
                          dense: '',
                          flat: '',
                          size: 'sm',
                          disable: T.value,
                          onClick: t[3] || (t[3] = (o) => I()),
                        },
                        null,
                        8,
                        ['disable'],
                      ),
                      i(
                        w,
                        {
                          icon: 'chevron_right',
                          round: '',
                          dense: '',
                          flat: '',
                          size: 'sm',
                          disable: $.value,
                          onClick: t[4] || (t[4] = (o) => j()),
                        },
                        null,
                        8,
                        ['disable'],
                      ),
                      i(
                        w,
                        {
                          icon: 'last_page',
                          round: '',
                          dense: '',
                          flat: '',
                          size: 'sm',
                          disable: $.value,
                          onClick: t[5] || (t[5] = (o) => M()),
                        },
                        null,
                        8,
                        ['disable'],
                      ),
                    ]),
                  ]),
                ]),
                loading: l(() => [
                  i(
                    se,
                    { showing: '', color: 'primary' },
                    { default: l(() => [i(ne, { size: '50px', color: 'primary' })]), _: 1 },
                  ),
                ]),
                _: 2,
              },
              [
                e.$slots.header
                  ? {
                      name: 'header',
                      fn: l((o) => [N(e.$slots, 'header', k(Z(o)), void 0, !0)]),
                      key: '0',
                    }
                  : void 0,
              ],
            ),
            1032,
            ['rows', 'columns', 'loading', 'pagination', 'hide-bottom'],
          ),
        ])
      );
    },
  }),
  ve = oe(de, [['__scopeId', 'data-v-1ec1a169']]);
export { ve as B, L as Q };
