import {
  bD as ft,
  w as V,
  bE as Fe,
  bk as Me,
  t as De,
  o as Ve,
  g as U,
  r as N,
  c as I,
  h as r,
  a as z,
  f,
  br as bt,
  $ as Le,
  D as Ee,
  M as je,
  s as gt,
  n as mt,
  q as xe,
  b6 as St,
  b5 as yt,
  m as ht,
  aU as wt,
  al as ge,
  bF as Te,
  I as Ae,
  bG as _t,
  ar as be,
  aO as Q,
  a8 as ee,
  Z as Ct,
} from './index-CKSooU2k.js';
import { Q as Pt } from './QList-fArhXj97.js';
import { u as qt, c as Rt, b as kt, d as $e } from './QSelect-CcXwe87O.js';
import { Q as Ft } from './QLinearProgress-ComgvJOP.js';
let H = 0;
const xt = { fullscreen: Boolean, noRouteFullscreenExit: Boolean },
  Tt = ['update:fullscreen', 'fullscreen'];
function Bt() {
  const e = U(),
    { props: l, emit: n, proxy: u } = e;
  let o, v;
  const i = N(!1);
  (ft(e) &&
    V(
      () => u.$route.fullPath,
      () => {
        l.noRouteFullscreenExit || S();
      },
    ),
    V(
      () => l.fullscreen,
      (a) => {
        i.value !== a && d();
      },
    ),
    V(i, (a) => {
      (n('update:fullscreen', a), n('fullscreen', a));
    }));
  function d() {
    i.value ? S() : c();
  }
  function c() {
    i.value ||
      ((i.value = !0),
      u.$el.replaceWith(v),
      document.body.append(u.$el),
      H++,
      H === 1 && document.body.classList.add('q-body--fullscreen-mixin'),
      (o = { handler: S }),
      Fe.add(o));
  }
  function S() {
    i.value &&
      (o !== void 0 && (Fe.remove(o), (o = void 0)),
      v.replaceWith(u.$el),
      (i.value = !1),
      (H = Math.max(0, H - 1)),
      H === 0 &&
        (document.body.classList.remove('q-body--fullscreen-mixin'),
        u.$el.scrollIntoView !== void 0 &&
          setTimeout(() => {
            u.$el.scrollIntoView();
          })));
  }
  return (
    Me(() => {
      v = document.createElement('span');
    }),
    De(() => {
      l.fullscreen && c();
    }),
    Ve(S),
    Object.assign(u, { toggleFullscreen: d, setFullscreen: c, exitFullscreen: S }),
    { inFullscreen: i, toggleFullscreen: d }
  );
}
const nl = I({
    name: 'QTd',
    props: { props: Object, autoWidth: Boolean, noHover: Boolean },
    setup(e, { slots: l }) {
      const n = U(),
        u = f(
          () =>
            'q-td' +
            (e.autoWidth ? ' q-table--col-auto-width' : '') +
            (e.noHover ? ' q-td--no-hover' : '') +
            ' ',
        );
      return () => {
        if (e.props === void 0) return r('td', { class: u.value }, z(l.default));
        const o = n.vnode.key,
          v = (e.props.colsMap !== void 0 ? e.props.colsMap[o] : null) || e.props.col;
        if (v === void 0) return;
        const { row: i } = e.props;
        return r('td', { class: u.value + v.__tdClass(i), style: v.__tdStyle(i) }, z(l.default));
      };
    },
  }),
  Ot = I({
    name: 'QTh',
    props: { props: Object, autoWidth: Boolean },
    emits: ['click'],
    setup(e, { slots: l, emit: n }) {
      const u = U(),
        {
          proxy: { $q: o },
        } = u,
        v = (i) => {
          n('click', i);
        };
      return () => {
        if (e.props === void 0)
          return r(
            'th',
            { class: e.autoWidth ? 'q-table--col-auto-width' : '', onClick: v },
            z(l.default),
          );
        let i, d;
        const c = u.vnode.key;
        if (c) {
          if (((i = e.props.colsMap[c]), i === void 0)) return;
        } else i = e.props.col;
        if (i.sortable) {
          const a = i.align === 'right' ? 'unshift' : 'push';
          ((d = bt(l.default, [])),
            d[a](r(Le, { class: i.__iconClass, name: o.iconSet.table.arrowUp })));
        } else d = z(l.default);
        const S = {
          class: i.__thClass + (e.autoWidth ? ' q-table--col-auto-width' : ''),
          style: i.headerStyle,
          onClick: (a) => {
            (i.sortable && e.props.sort(i), v(a));
          },
        };
        return r('th', S, d);
      };
    },
  }),
  Mt = ['horizontal', 'vertical', 'cell', 'none'],
  Dt = I({
    name: 'QMarkupTable',
    props: {
      ...Ee,
      dense: Boolean,
      flat: Boolean,
      bordered: Boolean,
      square: Boolean,
      wrapCells: Boolean,
      separator: { type: String, default: 'horizontal', validator: (e) => Mt.includes(e) },
    },
    setup(e, { slots: l }) {
      const n = U(),
        u = je(e, n.proxy.$q),
        o = f(
          () =>
            `q-markup-table q-table__container q-table__card q-table--${e.separator}-separator` +
            (u.value ? ' q-table--dark q-table__card--dark q-dark' : '') +
            (e.dense ? ' q-table--dense' : '') +
            (e.flat ? ' q-table--flat' : '') +
            (e.bordered ? ' q-table--bordered' : '') +
            (e.square ? ' q-table--square' : '') +
            (e.wrapCells ? '' : ' q-table--no-wrap'),
        );
      return () => r('div', { class: o.value }, [r('table', { class: 'q-table' }, z(l.default))]);
    },
  });
function Ne(e, l) {
  return r('div', e, [r('table', { class: 'q-table' }, l)]);
}
const Vt = { list: Pt, table: Dt },
  Lt = ['list', 'table', '__qtable'],
  Et = I({
    name: 'QVirtualScroll',
    props: {
      ...qt,
      type: { type: String, default: 'list', validator: (e) => Lt.includes(e) },
      items: { type: Array, default: () => [] },
      itemsFn: Function,
      itemsSize: Number,
      scrollTarget: gt,
    },
    setup(e, { slots: l, attrs: n }) {
      let u;
      const o = N(null),
        v = f(() =>
          e.itemsSize >= 0 && e.itemsFn !== void 0
            ? Number.parseInt(e.itemsSize, 10)
            : Array.isArray(e.items)
              ? e.items.length
              : 0,
        ),
        {
          virtualScrollSliceRange: i,
          localResetVirtualScroll: d,
          padVirtualScroll: c,
          onVirtualScrollEvt: S,
        } = Rt({ virtualScrollLength: v, getVirtualScrollTarget: R, getVirtualScrollEl: C }),
        a = f(() => {
          if (v.value === 0) return [];
          const B = (O, F) => ({ index: i.value.from + F, item: O });
          return e.itemsFn === void 0
            ? e.items.slice(i.value.from, i.value.to).map(B)
            : e.itemsFn(i.value.from, i.value.to - i.value.from).map(B);
        }),
        y = f(
          () =>
            'q-virtual-scroll q-virtual-scroll' +
            (e.virtualScrollHorizontal ? '--horizontal' : '--vertical') +
            (e.scrollTarget !== void 0 ? '' : ' scroll'),
        ),
        _ = f(() => (e.scrollTarget !== void 0 ? {} : { tabindex: 0 }));
      (V(v, () => {
        d();
      }),
        V(
          () => e.scrollTarget,
          () => {
            (h(), w());
          },
        ));
      function C() {
        return o.value.$el || o.value;
      }
      function R() {
        return u;
      }
      function w() {
        ((u = mt(C(), e.scrollTarget)), u.addEventListener('scroll', S, xe.passive));
      }
      function h() {
        u !== void 0 && (u.removeEventListener('scroll', S, xe.passive), (u = void 0));
      }
      function T() {
        let B = c(e.type === 'list' ? 'div' : 'tbody', a.value.map(l.default));
        return (l.before !== void 0 && (B = l.before().concat(B)), ht(l.after, B));
      }
      return (
        Me(() => {
          d();
        }),
        De(() => {
          w();
        }),
        St(() => {
          w();
        }),
        yt(() => {
          h();
        }),
        Ve(() => {
          h();
        }),
        () => {
          if (l.default === void 0) {
            console.error('QVirtualScroll: default scoped slot is required for rendering');
            return;
          }
          return e.type === '__qtable'
            ? Ne({ ref: o, class: 'q-table__middle ' + y.value }, T())
            : r(Vt[e.type], { ...n, ref: o, class: [n.class, y.value], ..._.value }, T);
        }
      );
    },
  });
function jt(e, l) {
  return new Date(e) - new Date(l);
}
const At = {
  sortMethod: Function,
  binaryStateSort: Boolean,
  columnSortOrder: { type: String, validator: (e) => e === 'ad' || e === 'da', default: 'ad' },
};
function $t(e, l, n, u) {
  const o = f(() => {
      const { sortBy: d } = l.value;
      return (d && n.value.find((c) => c.name === d)) || null;
    }),
    v = f(() =>
      e.sortMethod !== void 0
        ? e.sortMethod
        : (d, c, S) => {
            const a = n.value.find((C) => C.name === c);
            if (a === void 0 || a.field === void 0) return d;
            const y = S ? -1 : 1,
              _ = typeof a.field == 'function' ? (C) => a.field(C) : (C) => C[a.field];
            return d.sort((C, R) => {
              let w = _(C),
                h = _(R);
              return a.rawSort !== void 0
                ? a.rawSort(w, h, C, R) * y
                : w == null
                  ? -1 * y
                  : h == null
                    ? Number(y)
                    : a.sort !== void 0
                      ? a.sort(w, h, C, R) * y
                      : ge(w) && ge(h)
                        ? (w - h) * y
                        : Te(w) && Te(h)
                          ? jt(w, h) * y
                          : typeof w == 'boolean' && typeof h == 'boolean'
                            ? (w - h) * y
                            : (([w, h] = [w, h].map((T) =>
                                String(T).toLocaleString().toLowerCase(),
                              )),
                              w < h ? -1 * y : w === h ? 0 : y);
            });
          },
    );
  function i(d) {
    let c = e.columnSortOrder;
    if (wt(d)) (d.sortOrder && (c = d.sortOrder), (d = d.name));
    else {
      const y = n.value.find((_) => _.name === d);
      y?.sortOrder && (c = y.sortOrder);
    }
    let { sortBy: S, descending: a } = l.value;
    (S !== d
      ? ((S = d), (a = c === 'da'))
      : e.binaryStateSort
        ? (a = !a)
        : a
          ? c === 'ad'
            ? (S = null)
            : (a = !1)
          : c === 'ad'
            ? (a = !0)
            : (S = null),
      u({ sortBy: S, descending: a, page: 1 }));
  }
  return { columnToSort: o, computedSortMethod: v, sort: i };
}
const Nt = { filter: [String, Object], filterMethod: Function };
function Qt(e, l) {
  const n = f(() =>
    e.filterMethod !== void 0
      ? e.filterMethod
      : (u, o, v, i) => {
          const d = o ? o.toLowerCase() : '';
          return u.filter((c) =>
            v.some((S) => {
              const a = String(i(S, c));
              return (a === 'undefined' || a === 'null' ? '' : a.toLowerCase()).includes(d);
            }),
          );
        },
  );
  return (
    V(
      () => e.filter,
      () => {
        Ae(() => {
          l({ page: 1 }, !0);
        });
      },
      { deep: !0 },
    ),
    { computedFilterMethod: n }
  );
}
function Ht(e, l) {
  for (const n in l) if (l[n] !== e[n]) return !1;
  return !0;
}
function Be(e) {
  return (
    e.page < 1 && (e.page = 1),
    e.rowsPerPage !== void 0 && e.rowsPerPage < 1 && (e.rowsPerPage = 0),
    e
  );
}
const zt = {
  pagination: Object,
  rowsPerPageOptions: { type: Array, default: () => [5, 7, 10, 15, 20, 25, 50, 0] },
  'onUpdate:pagination': [Function, Array],
};
function Ut(e, l) {
  const { props: n, emit: u } = e,
    o = N({
      sortBy: null,
      descending: !1,
      page: 1,
      rowsPerPage: n.rowsPerPageOptions.length !== 0 ? n.rowsPerPageOptions[0] : 5,
      ...n.pagination,
    }),
    v = f(() => {
      const a = n['onUpdate:pagination'] !== void 0 ? { ...o.value, ...n.pagination } : o.value;
      return Be(a);
    }),
    i = f(() => v.value.rowsNumber !== void 0);
  function d(a) {
    c({ pagination: a, filter: n.filter });
  }
  function c(a = {}) {
    Ae(() => {
      u('request', {
        pagination: a.pagination || v.value,
        filter: a.filter || n.filter,
        getCellValue: l,
      });
    });
  }
  function S(a, y) {
    const _ = Be({ ...v.value, ...a });
    if (Ht(v.value, _)) {
      i.value && y && d(_);
      return;
    }
    if (i.value) {
      d(_);
      return;
    }
    n.pagination !== void 0 && n['onUpdate:pagination'] !== void 0
      ? u('update:pagination', _)
      : (o.value = _);
  }
  return {
    innerPagination: o,
    computedPagination: v,
    isServerSide: i,
    requestServerInteraction: c,
    setPagination: S,
  };
}
function It(e, l, n, u, o, v) {
  const {
      props: i,
      emit: d,
      proxy: { $q: c },
    } = e,
    S = f(() => (u.value ? n.value.rowsNumber || 0 : v.value)),
    a = f(() => {
      const { page: F, rowsPerPage: x } = n.value;
      return (F - 1) * x;
    }),
    y = f(() => {
      const { page: F, rowsPerPage: x } = n.value;
      return F * x;
    }),
    _ = f(() => n.value.page === 1),
    C = f(() =>
      n.value.rowsPerPage === 0 ? 1 : Math.max(1, Math.ceil(S.value / n.value.rowsPerPage)),
    ),
    R = f(() => (y.value === 0 ? !0 : n.value.page >= C.value)),
    w = f(() =>
      (i.rowsPerPageOptions.includes(l.value.rowsPerPage)
        ? i.rowsPerPageOptions
        : [l.value.rowsPerPage, ...i.rowsPerPageOptions]
      ).map((x) => ({ label: x === 0 ? c.lang.table.allRows : String(x), value: x })),
    );
  V(C, (F, x) => {
    if (F === x) return;
    const p = n.value.page;
    F && !p ? o({ page: 1 }) : F < p && o({ page: F });
  });
  function h() {
    o({ page: 1 });
  }
  function T() {
    const { page: F } = n.value;
    F > 1 && o({ page: F - 1 });
  }
  function B() {
    const { page: F, rowsPerPage: x } = n.value;
    y.value > 0 && F * x < S.value && o({ page: F + 1 });
  }
  function O() {
    o({ page: C.value });
  }
  return (
    i['onUpdate:pagination'] !== void 0 && d('update:pagination', { ...n.value }),
    {
      firstRowIndex: a,
      lastRowIndex: y,
      isFirstPage: _,
      isLastPage: R,
      pagesNumber: C,
      computedRowsPerPageOptions: w,
      computedRowsNumber: S,
      firstPage: h,
      prevPage: T,
      nextPage: B,
      lastPage: O,
    }
  );
}
const pt = {
    selection: {
      type: String,
      default: 'none',
      validator: (e) => ['single', 'multiple', 'none'].includes(e),
    },
    selected: { type: Array, default: () => [] },
  },
  Wt = ['update:selected', 'selection'];
function Gt(e, l, n, u) {
  const o = f(() => {
      const R = {};
      return (
        e.selected.map(u.value).forEach((w) => {
          R[w] = !0;
        }),
        R
      );
    }),
    v = f(() => e.selection !== 'none'),
    i = f(() => e.selection === 'single'),
    d = f(() => e.selection === 'multiple'),
    c = f(() => n.value.length !== 0 && n.value.every((R) => o.value[u.value(R)])),
    S = f(() => !c.value && n.value.some((R) => o.value[u.value(R)])),
    a = f(() => e.selected.length);
  function y(R) {
    return o.value[R] === !0;
  }
  function _() {
    l('update:selected', []);
  }
  function C(R, w, h, T) {
    l('selection', { rows: w, added: h, keys: R, evt: T });
    const B = i.value
      ? h
        ? w
        : []
      : h
        ? [...e.selected, ...w]
        : e.selected.filter((O) => !R.includes(u.value(O)));
    l('update:selected', B);
  }
  return {
    hasSelectionMode: v,
    singleSelection: i,
    multipleSelection: d,
    allRowsSelected: c,
    someRowsSelected: S,
    rowsSelectedNumber: a,
    isRowSelected: y,
    clearSelection: _,
    updateSelection: C,
  };
}
function Oe(e) {
  return Array.isArray(e) ? [...e] : [];
}
const Kt = { expanded: Array },
  Zt = ['update:expanded'];
function Jt(e, l) {
  const n = N(Oe(e.expanded));
  V(
    () => e.expanded,
    (i) => {
      n.value = Oe(i);
    },
  );
  function u(i) {
    return n.value.includes(i);
  }
  function o(i) {
    e.expanded !== void 0 ? l('update:expanded', i) : (n.value = i);
  }
  function v(i, d) {
    const c = [...n.value],
      S = c.indexOf(i);
    d ? S === -1 && (c.push(i), o(c)) : S !== -1 && (c.splice(S, 1), o(c));
  }
  return { isRowExpanded: u, setExpanded: o, updateExpanded: v };
}
const Xt = { visibleColumns: Array };
function Yt(e, l, n) {
  const u = f(() => {
      if (e.columns !== void 0) return e.columns;
      const d = e.rows[0];
      return d !== void 0
        ? Object.keys(d).map((c) => ({
            name: c,
            label: c.toUpperCase(),
            field: c,
            align: ge(d[c]) ? 'right' : 'left',
            sortable: !0,
          }))
        : [];
    }),
    o = f(() => {
      const { sortBy: d, descending: c } = l.value;
      return (
        e.visibleColumns !== void 0
          ? u.value.filter((a) => a.required || e.visibleColumns.includes(a.name))
          : u.value
      ).map((a) => {
        const y = a.align || 'right',
          _ = `text-${y}`;
        return {
          ...a,
          align: y,
          __iconClass: `q-table__sort-icon q-table__sort-icon--${y}`,
          __thClass:
            _ +
            (a.headerClasses !== void 0 ? ' ' + a.headerClasses : '') +
            (a.sortable ? ' sortable' : '') +
            (a.name === d ? ` sorted ${c ? 'sort-desc' : ''}` : ''),
          __tdStyle:
            a.style !== void 0
              ? typeof a.style != 'function'
                ? () => a.style
                : a.style
              : () => null,
          __tdClass:
            a.classes !== void 0
              ? typeof a.classes != 'function'
                ? () => _ + ' ' + a.classes
                : (C) => _ + ' ' + a.classes(C)
              : () => _,
        };
      });
    }),
    v = f(() => {
      const d = {};
      return (
        o.value.forEach((c) => {
          d[c.name] = c;
        }),
        d
      );
    }),
    i = f(() => (e.tableColspan !== void 0 ? e.tableColspan : o.value.length + (n.value ? 1 : 0)));
  return { colList: u, computedCols: o, computedColsMap: v, computedColspan: i };
}
const te = 'q-table__bottom row items-center',
  Qe = {};
$e.forEach((e) => {
  Qe[e] = {};
});
function $(e, l) {
  const n = typeof e.field == 'function' ? e.field(l) : l[e.field];
  return e.format !== void 0 ? e.format(n, l) : n;
}
const ol = I({
  name: 'QTable',
  props: {
    rows: { type: Array, required: !0 },
    rowKey: { type: [String, Function], default: 'id' },
    columns: Array,
    loading: Boolean,
    iconFirstPage: String,
    iconPrevPage: String,
    iconNextPage: String,
    iconLastPage: String,
    title: String,
    hideHeader: Boolean,
    grid: Boolean,
    gridHeader: Boolean,
    dense: Boolean,
    flat: Boolean,
    bordered: Boolean,
    square: Boolean,
    separator: {
      type: String,
      default: 'horizontal',
      validator: (e) => ['horizontal', 'vertical', 'cell', 'none'].includes(e),
    },
    wrapCells: Boolean,
    virtualScroll: Boolean,
    virtualScrollTarget: {},
    ...Qe,
    noDataLabel: String,
    noResultsLabel: String,
    loadingLabel: String,
    selectedRowsLabel: Function,
    rowsPerPageLabel: String,
    paginationLabel: Function,
    color: { type: String, default: 'grey-8' },
    titleClass: [String, Array, Object],
    tableStyle: [String, Array, Object],
    tableClass: [String, Array, Object],
    tableHeaderStyle: [String, Array, Object],
    tableHeaderClass: [String, Array, Object],
    tableRowStyleFn: Function,
    tableRowClassFn: Function,
    cardContainerClass: [String, Array, Object],
    cardContainerStyle: [String, Array, Object],
    cardStyle: [String, Array, Object],
    cardClass: [String, Array, Object],
    cardStyleFn: Function,
    cardClassFn: Function,
    hideBottom: Boolean,
    hideSelectedBanner: Boolean,
    hideNoData: Boolean,
    hidePagination: Boolean,
    onRowClick: Function,
    onRowDblclick: Function,
    onRowContextmenu: Function,
    ...Ee,
    ...xt,
    ...Xt,
    ...Nt,
    ...zt,
    ...Kt,
    ...pt,
    ...At,
  },
  emits: ['request', 'virtualScroll', ...Tt, ...Zt, ...Wt],
  setup(e, { slots: l, emit: n }) {
    const u = U(),
      {
        proxy: { $q: o },
      } = u,
      v = je(e, o),
      { inFullscreen: i, toggleFullscreen: d } = Bt(),
      c = f(() => (typeof e.rowKey == 'function' ? e.rowKey : (t) => t[e.rowKey])),
      S = N(null),
      a = N(null),
      y = f(() => !e.grid && e.virtualScroll),
      _ = f(
        () =>
          ' q-table__card' +
          (v.value ? ' q-table__card--dark q-dark' : '') +
          (e.square ? ' q-table--square' : '') +
          (e.flat ? ' q-table--flat' : '') +
          (e.bordered ? ' q-table--bordered' : ''),
      ),
      C = f(
        () =>
          `q-table__container q-table--${e.separator}-separator column no-wrap` +
          (e.grid ? ' q-table--grid' : _.value) +
          (v.value ? ' q-table--dark' : '') +
          (e.dense ? ' q-table--dense' : '') +
          (e.wrapCells ? '' : ' q-table--no-wrap') +
          (i.value ? ' fullscreen scroll' : ''),
      ),
      R = f(() => C.value + (e.loading ? ' q-table--loading' : ''));
    V(
      () => e.tableStyle + e.tableClass + e.tableHeaderStyle + e.tableHeaderClass + C.value,
      () => {
        y.value && a.value?.reset();
      },
    );
    const {
        innerPagination: w,
        computedPagination: h,
        isServerSide: T,
        requestServerInteraction: B,
        setPagination: O,
      } = Ut(u, $),
      { computedFilterMethod: F } = Qt(e, O),
      { isRowExpanded: x, setExpanded: p, updateExpanded: He } = Jt(e, n),
      le = f(() => {
        let t = e.rows;
        if (T.value || t.length === 0) return t;
        const { sortBy: s, descending: b } = h.value;
        return (
          e.filter && (t = F.value(t, e.filter, D.value, $)),
          We.value !== null && (t = Ge.value(e.rows === t ? [...t] : t, s, b)),
          t
        );
      }),
      me = f(() => le.value.length),
      L = f(() => {
        let t = le.value;
        if (T.value) return t;
        const { rowsPerPage: s } = h.value;
        return (
          s !== 0 &&
            (G.value === 0 && e.rows !== t
              ? t.length > K.value && (t = t.slice(0, K.value))
              : (t = t.slice(G.value, K.value))),
          t
        );
      }),
      {
        hasSelectionMode: j,
        singleSelection: ze,
        multipleSelection: Se,
        allRowsSelected: Ue,
        someRowsSelected: ye,
        rowsSelectedNumber: ae,
        isRowSelected: ne,
        clearSelection: Ie,
        updateSelection: W,
      } = Gt(e, n, L, c),
      { colList: pe, computedCols: D, computedColsMap: he, computedColspan: we } = Yt(e, h, j),
      { columnToSort: We, computedSortMethod: Ge, sort: oe } = $t(e, h, pe, O),
      {
        firstRowIndex: G,
        lastRowIndex: K,
        isFirstPage: re,
        isLastPage: ie,
        pagesNumber: Z,
        computedRowsPerPageOptions: Ke,
        computedRowsNumber: J,
        firstPage: se,
        prevPage: ce,
        nextPage: ue,
        lastPage: de,
      } = It(u, w, h, T, O, me),
      Ze = f(() => L.value.length === 0),
      Je = f(() => {
        const t = {};
        return (
          $e.forEach((s) => {
            t[s] = e[s];
          }),
          t.virtualScrollItemSize === void 0 && (t.virtualScrollItemSize = e.dense ? 28 : 48),
          t
        );
      });
    function Xe() {
      y.value && a.value.reset();
    }
    function Ye() {
      if (e.grid) return dt();
      const t = e.hideHeader ? null : Re;
      if (y.value) {
        const b = l['top-row'],
          g = l['bottom-row'],
          m = { default: (k) => Ce(k.item, l.body, k.index) };
        if (b !== void 0) {
          const k = r('tbody', b({ cols: D.value }));
          m.before = t === null ? () => k : () => [t(), k];
        } else t !== null && (m.before = t);
        return (
          g !== void 0 && (m.after = () => r('tbody', g({ cols: D.value }))),
          r(
            Et,
            {
              ref: a,
              class: e.tableClass,
              style: e.tableStyle,
              ...Je.value,
              scrollTarget: e.virtualScrollTarget,
              items: L.value,
              type: '__qtable',
              tableColspan: we.value,
              onVirtualScroll: tt,
            },
            m,
          )
        );
      }
      const s = [lt()];
      return (
        t !== null && s.unshift(t()),
        Ne({ class: ['q-table__middle scroll', e.tableClass], style: e.tableStyle }, s)
      );
    }
    function et(t, s) {
      if (a.value !== null) {
        a.value.scrollTo(t, s);
        return;
      }
      t = Number.parseInt(t, 10);
      const b = S.value.querySelector(`tbody tr:nth-of-type(${t + 1})`);
      if (b !== null) {
        const g = S.value.querySelector('.q-table__middle.scroll'),
          m = b.offsetTop - e.virtualScrollStickySizeStart,
          k = m < g.scrollTop ? 'decrease' : 'increase';
        ((g.scrollTop = m),
          n('virtualScroll', { index: t, from: 0, to: w.value.rowsPerPage - 1, direction: k }));
      }
    }
    function tt(t) {
      n('virtualScroll', t);
    }
    function _e() {
      return [
        r(Ft, {
          class: 'q-table__linear-progress',
          color: e.color,
          dark: v.value,
          indeterminate: !0,
          trackColor: 'transparent',
        }),
      ];
    }
    function Ce(t, s, b) {
      const g = c.value(t),
        m = ne(g);
      if (s !== void 0) {
        const q = { key: g, row: t, pageIndex: b, __trClass: m ? 'selected' : '' };
        if (
          (e.tableRowStyleFn !== void 0 && (q.__trStyle = e.tableRowStyleFn(t)),
          e.tableRowClassFn !== void 0)
        ) {
          const E = e.tableRowClassFn(t);
          E && (q.__trClass = `${E} ${q.__trClass}`);
        }
        return s(Pe(q));
      }
      const k = l['body-cell'],
        P = D.value.map((q) => {
          const E = l[`body-cell-${q.name}`],
            Y = E !== void 0 ? E : k;
          return Y !== void 0
            ? Y(at({ key: g, row: t, pageIndex: b, col: q }))
            : r('td', { class: q.__tdClass(t), style: q.__tdStyle(t) }, $(q, t));
        });
      if (j.value) {
        const q = l['body-selection'],
          E =
            q !== void 0
              ? q(nt({ key: g, row: t, pageIndex: b }))
              : [
                  r(be, {
                    modelValue: m,
                    color: e.color,
                    dark: v.value,
                    dense: e.dense,
                    'onUpdate:modelValue': (Y, vt) => {
                      W([g], [t], Y, vt);
                    },
                  }),
                ];
        P.unshift(r('td', { class: 'q-table--col-auto-width' }, E));
      }
      const M = { key: g, class: { selected: m } };
      if (
        (e.onRowClick !== void 0 &&
          ((M.class['cursor-pointer'] = !0),
          (M.onClick = (q) => {
            n('rowClick', q, t, b);
          })),
        e.onRowDblclick !== void 0 &&
          ((M.class['cursor-pointer'] = !0),
          (M.onDblclick = (q) => {
            n('rowDblclick', q, t, b);
          })),
        e.onRowContextmenu !== void 0 &&
          ((M.class['cursor-pointer'] = !0),
          (M.onContextmenu = (q) => {
            n('rowContextmenu', q, t, b);
          })),
        e.tableRowStyleFn !== void 0 && (M.style = e.tableRowStyleFn(t)),
        e.tableRowClassFn !== void 0)
      ) {
        const q = e.tableRowClassFn(t);
        q && (M.class[q] = !0);
      }
      return r('tr', M, P);
    }
    function lt() {
      const t = l.body,
        s = l['top-row'],
        b = l['bottom-row'],
        g = L.value.map((m, k) => Ce(m, t, k));
      return r('tbody', [s?.({ cols: D.value }), ...g, b?.({ cols: D.value })].flat());
    }
    function Pe(t) {
      return (ve(t), (t.cols = t.cols.map((s) => Q({ ...s }, 'value', () => $(s, t.row)))), t);
    }
    function at(t) {
      return (ve(t), Q(t, 'value', () => $(t.col, t.row)), t);
    }
    function nt(t) {
      return (ve(t), t);
    }
    function ve(t) {
      (Object.assign(t, {
        cols: D.value,
        colsMap: he.value,
        sort: oe,
        rowIndex: G.value + t.pageIndex,
        color: e.color,
        dark: v.value,
        dense: e.dense,
      }),
        j.value &&
          Q(
            t,
            'selected',
            () => ne(t.key),
            (s, b) => {
              W([t.key], [t.row], s, b);
            },
          ),
        Q(
          t,
          'expand',
          () => x(t.key),
          (s) => {
            He(t.key, s);
          },
        ));
    }
    const A = f(() => ({
      pagination: h.value,
      pagesNumber: Z.value,
      isFirstPage: re.value,
      isLastPage: ie.value,
      firstPage: se,
      prevPage: ce,
      nextPage: ue,
      lastPage: de,
      inFullscreen: i.value,
      toggleFullscreen: d,
    }));
    function ot() {
      const t = l.top,
        s = l['top-left'],
        b = l['top-right'],
        g = l['top-selection'],
        m = j.value && g !== void 0 && ae.value > 0,
        k = 'q-table__top relative-position row items-center';
      if (t !== void 0) return r('div', { class: k }, [t(A.value)]);
      let P;
      if (
        (m
          ? (P = [g(A.value)].flat())
          : ((P = []),
            s !== void 0
              ? P.push(r('div', { class: 'q-table__control' }, [s(A.value)]))
              : e.title &&
                P.push(
                  r('div', { class: 'q-table__control' }, [
                    r('div', { class: ['q-table__title', e.titleClass] }, e.title),
                  ]),
                )),
        b !== void 0 &&
          (P.push(r('div', { class: 'q-table__separator col' })),
          P.push(r('div', { class: 'q-table__control' }, [b(A.value)]))),
        P.length !== 0)
      )
        return r('div', { class: k }, P);
    }
    const qe = f(() => (ye.value ? null : Ue.value));
    function Re() {
      const t = rt();
      return (
        e.loading &&
          l.loading === void 0 &&
          t.push(
            r('tr', { class: 'q-table__progress' }, [
              r('th', { class: 'relative-position', colspan: we.value }, _e()),
            ]),
          ),
        r('thead', t)
      );
    }
    function rt() {
      const t = l.header,
        s = l['header-cell'];
      if (t !== void 0) return [t(fe({ header: !0 }))].flat();
      const b = D.value.map((g) => {
        const m = l[`header-cell-${g.name}`],
          k = m !== void 0 ? m : s,
          P = fe({ col: g });
        return k !== void 0 ? k(P) : r(Ot, { key: g.name, props: P }, () => g.label);
      });
      if (ze.value && !e.grid) b.unshift(r('th', { class: 'q-table--col-auto-width' }, ' '));
      else if (Se.value) {
        const g = l['header-selection'],
          m =
            g !== void 0
              ? g(fe({}))
              : [
                  r(be, {
                    color: e.color,
                    modelValue: qe.value,
                    dark: v.value,
                    dense: e.dense,
                    'onUpdate:modelValue': ke,
                  }),
                ];
        b.unshift(r('th', { class: 'q-table--col-auto-width' }, m));
      }
      return [r('tr', { class: e.tableHeaderClass, style: e.tableHeaderStyle }, b)];
    }
    function fe(t) {
      return (
        Object.assign(t, {
          cols: D.value,
          sort: oe,
          colsMap: he.value,
          color: e.color,
          dark: v.value,
          dense: e.dense,
        }),
        Se.value && Q(t, 'selected', () => qe.value, ke),
        t
      );
    }
    function ke(t) {
      (ye.value && (t = !1), W(L.value.map(c.value), L.value, t));
    }
    const X = f(() => {
      const t = [
        e.iconFirstPage || o.iconSet.table.firstPage,
        e.iconPrevPage || o.iconSet.table.prevPage,
        e.iconNextPage || o.iconSet.table.nextPage,
        e.iconLastPage || o.iconSet.table.lastPage,
      ];
      return o.lang.rtl ? t.reverse() : t;
    });
    function it() {
      if (e.hideBottom) return;
      if (Ze.value) {
        if (e.hideNoData) return;
        const b = e.loading
            ? e.loadingLabel || o.lang.table.loading
            : e.filter
              ? e.noResultsLabel || o.lang.table.noResults
              : e.noDataLabel || o.lang.table.noData,
          g = l['no-data'],
          m =
            g !== void 0
              ? [g({ message: b, icon: o.iconSet.table.warning, filter: e.filter })]
              : [r(Le, { class: 'q-table__bottom-nodata-icon', name: o.iconSet.table.warning }), b];
        return r('div', { class: te + ' q-table__bottom--nodata' }, m);
      }
      const t = l.bottom;
      if (t !== void 0) return r('div', { class: te }, [t(A.value)]);
      const s =
        !e.hideSelectedBanner && j.value && ae.value > 0
          ? [
              r('div', { class: 'q-table__control' }, [
                r('div', [(e.selectedRowsLabel || o.lang.table.selectedRecords)(ae.value)]),
              ]),
            ]
          : [];
      if (!e.hidePagination) return r('div', { class: te + ' justify-end' }, ct(s));
      if (s.length !== 0) return r('div', { class: te }, s);
    }
    function st(t) {
      O({ page: 1, rowsPerPage: t.value });
    }
    function ct(t) {
      let s;
      const { rowsPerPage: b } = h.value,
        g = e.paginationLabel || o.lang.table.pagination,
        m = l.pagination,
        k = e.rowsPerPageOptions.length > 1;
      if (
        (t.push(r('div', { class: 'q-table__separator col' })),
        k &&
          t.push(
            r('div', { class: 'q-table__control' }, [
              r('span', { class: 'q-table__bottom-item' }, [
                e.rowsPerPageLabel || o.lang.table.recordsPerPage,
              ]),
              r(kt, {
                class: 'q-table__select inline q-table__bottom-item',
                color: e.color,
                modelValue: b,
                options: Ke.value,
                displayValue: b === 0 ? o.lang.table.allRows : b,
                dark: v.value,
                borderless: !0,
                dense: !0,
                optionsDense: !0,
                optionsCover: !0,
                'onUpdate:modelValue': st,
              }),
            ]),
          ),
        m !== void 0)
      )
        s = m(A.value);
      else if (
        ((s = [
          r('span', b !== 0 ? { class: 'q-table__bottom-item' } : {}, [
            b ? g(G.value + 1, Math.min(K.value, J.value), J.value) : g(1, me.value, J.value),
          ]),
        ]),
        b !== 0 && Z.value > 1)
      ) {
        const P = { color: e.color, round: !0, dense: !0, flat: !0 };
        (e.dense && (P.size = 'sm'),
          Z.value > 2 &&
            s.push(
              r(ee, {
                key: 'pgFirst',
                ...P,
                icon: X.value[0],
                disable: re.value,
                'aria-label': o.lang.pagination.first,
                onClick: se,
              }),
            ),
          s.push(
            r(ee, {
              key: 'pgPrev',
              ...P,
              icon: X.value[1],
              disable: re.value,
              'aria-label': o.lang.pagination.prev,
              onClick: ce,
            }),
            r(ee, {
              key: 'pgNext',
              ...P,
              icon: X.value[2],
              disable: ie.value,
              'aria-label': o.lang.pagination.next,
              onClick: ue,
            }),
          ),
          Z.value > 2 &&
            s.push(
              r(ee, {
                key: 'pgLast',
                ...P,
                icon: X.value[3],
                disable: ie.value,
                'aria-label': o.lang.pagination.last,
                onClick: de,
              }),
            ));
      }
      return (t.push(r('div', { class: 'q-table__control' }, s)), t);
    }
    function ut() {
      const t = e.gridHeader
        ? [r('table', { class: 'q-table' }, [Re()])]
        : e.loading && l.loading === void 0
          ? _e()
          : void 0;
      return r('div', { class: 'q-table__middle' }, t);
    }
    function dt() {
      const t =
        l.item !== void 0
          ? l.item
          : (s) => {
              const b = s.cols.map((m) =>
                r('div', { class: 'q-table__grid-item-row' }, [
                  r('div', { class: 'q-table__grid-item-title' }, [m.label]),
                  r('div', { class: 'q-table__grid-item-value' }, [m.value]),
                ]),
              );
              if (j.value) {
                const m = l['body-selection'],
                  k =
                    m !== void 0
                      ? m(s)
                      : [
                          r(be, {
                            modelValue: s.selected,
                            color: e.color,
                            dark: v.value,
                            dense: e.dense,
                            'onUpdate:modelValue': (P, M) => {
                              W([s.key], [s.row], P, M);
                            },
                          }),
                        ];
                b.unshift(
                  r('div', { class: 'q-table__grid-item-row' }, k),
                  r(Ct, { dark: v.value }),
                );
              }
              const g = {
                class: ['q-table__grid-item-card' + _.value, e.cardClass],
                style: e.cardStyle,
              };
              if (
                (e.cardStyleFn !== void 0 && (g.style = [g.style, e.cardStyleFn(s.row)]),
                e.cardClassFn !== void 0)
              ) {
                const m = e.cardClassFn(s.row);
                m && (g.class[0] += ` ${m}`);
              }
              return (
                (e.onRowClick !== void 0 ||
                  e.onRowDblclick !== void 0 ||
                  e.onRowContextmenu !== void 0) &&
                  ((g.class[0] += ' cursor-pointer'),
                  e.onRowClick !== void 0 &&
                    (g.onClick = (m) => {
                      n('RowClick', m, s.row, s.pageIndex);
                    }),
                  e.onRowDblclick !== void 0 &&
                    (g.onDblclick = (m) => {
                      n('RowDblclick', m, s.row, s.pageIndex);
                    }),
                  e.onRowContextmenu !== void 0 &&
                    (g.onContextmenu = (m) => {
                      n('rowContextmenu', m, s.row, s.pageIndex);
                    })),
                r(
                  'div',
                  {
                    class:
                      'q-table__grid-item col-xs-12 col-sm-6 col-md-4 col-lg-3' +
                      (s.selected ? ' q-table__grid-item--selected' : ''),
                  },
                  [r('div', g, b)],
                )
              );
            };
      return r(
        'div',
        { class: ['q-table__grid-content row', e.cardContainerClass], style: e.cardContainerStyle },
        L.value.map((s, b) => t(Pe({ key: c.value(s), row: s, pageIndex: b }))),
      );
    }
    return (
      Object.assign(u.proxy, {
        requestServerInteraction: B,
        setPagination: O,
        firstPage: se,
        prevPage: ce,
        nextPage: ue,
        lastPage: de,
        isRowSelected: ne,
        clearSelection: Ie,
        isRowExpanded: x,
        setExpanded: p,
        sort: oe,
        resetVirtualScroll: Xe,
        scrollTo: et,
        getCellValue: $,
      }),
      _t(u.proxy, {
        filteredSortedRows: () => le.value,
        computedRows: () => L.value,
        computedRowsNumber: () => J.value,
      }),
      () => {
        const t = [ot()],
          s = { ref: S, class: R.value };
        return (
          e.grid
            ? t.push(ut())
            : Object.assign(s, { class: [s.class, e.cardClass], style: e.cardStyle }),
          t.push(Ye(), it()),
          e.loading && l.loading !== void 0 && t.push(l.loading()),
          r('div', s, t)
        );
      }
    );
  },
});
export { nl as Q, xt as a, Bt as b, Ot as c, ol as d, Tt as u };
