import { Q as v } from './QPage-CM3LWBRo.js';
import { u as D } from './use-quasar-DaOT29F-.js';
import { A as w, a as _ } from './app-breadcrumbs-C0oZOPYe.js';
import { u as h, D as C } from './use-daily-revenue-XZfrg-bR.js';
import { S as B } from './search-bar-BgXkcRlY.js';
import { _ as S } from './export-csv-button.vue_vue_type_script_setup_true_lang-VSWIuzMe.js';
import { B as L } from './base-table-DuGvP-XM.js';
import { u as T } from './vue-i18n-Bebkm_iB.js';
import {
  O as F,
  w as P,
  t as Q,
  Q as V,
  _ as $,
  W as q,
  V as i,
  X as o,
  S as r,
  r as s,
  f as p,
  a2 as A,
} from './index-CKSooU2k.js';
import './QPopupProxy-SS26l2Ne.js';
import './format-DnjzHs7F.js';
import './position-engine-Bv76xS6k.js';
import './app-calendar-3fcHCMzM.js';
import './QResizeObserver-C4jaR1Qo.js';
import './app-select-DSldWHEY.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './finance.service-BGaW4u-C.js';
import './export-file-BbXX5Gbn.js';
import './date-DmslTAtO.js';
import './app-button-D_cMl4aM.js';
import './QTable-B4W-6HCk.js';
import './QList-fArhXj97.js';
import './QLinearProgress-ComgvJOP.js';
import './QSpinnerDots-Dwh4MvNX.js';
import './QInnerLoading-CAwPoqSH.js';
const O = { class: 'row items-center justify-between q-mb-lg' },
  k = { class: 'col-6' },
  E = { class: 'q-mt-lg receipt-usage-table' },
  G = F({
    __name: 'receipt-usage-report-page',
    setup(I) {
      const c = D(),
        {
          error: u,
          filter: d,
          departmentOptions: g,
          fetchData: f,
          loadDepartmentOptions: b,
          applyFilter: y,
        } = h(),
        m = s([
          {
            index: 1,
            receiptNo: '6751300100001',
            paymentDate: '01/05/2569 14:05:06',
            receiptDate: '11/05/2569 09:31:07',
            year: '2569',
            documentType: 'ใบเสร็จ',
            amount: 500,
            examName: '1/2026 การสอบวัดระดับภาษาอังกฤษ BUU-GET',
            payer: 'นาย สมศรี ใจดี',
            payee: 'สิงหา มานะอมรกุล',
          },
          {
            index: 2,
            receiptNo: '6751300100002',
            paymentDate: '01/05/2569 14:25:16',
            receiptDate: '11/05/2569 09:31:07',
            year: '2569',
            documentType: 'ใบเสร็จ',
            amount: 500,
            examName: '1/2026 การสอบวัดระดับภาษาอังกฤษ BUU-GET',
            payer: 'นาย สมกบ ใจดี',
            payee: 'สิงหา มานะอมรกุล',
          },
        ]),
        { t: e } = T(),
        l = s(''),
        n = p(() => {
          if (!l.value) return m.value;
          const a = l.value.toString().toLowerCase();
          return m.value.filter(
            (t) =>
              String(t.receiptNo).toLowerCase().includes(a) ||
              String(t.examName).toLowerCase().includes(a) ||
              String(t.payer).toLowerCase().includes(a) ||
              String(t.payee).toLowerCase().includes(a),
          );
        }),
        U = p(() => ({ page: 1, rowsPerPage: 10, rowsNumber: n.value.length })),
        R = p(() => [
          {
            name: 'index',
            label: e('admin.receiptUsageReport.table.columns.index'),
            field: 'index',
            align: 'center',
          },
          {
            name: 'receiptNo',
            label: e('admin.receiptUsageReport.table.columns.receiptNo'),
            field: 'receiptNo',
            align: 'left',
          },
          {
            name: 'paymentDate',
            label: e('admin.receiptUsageReport.table.columns.paymentDate'),
            field: 'paymentDate',
            align: 'center',
          },
          {
            name: 'receiptDate',
            label: e('admin.receiptUsageReport.table.columns.receiptDate'),
            field: 'receiptDate',
            align: 'center',
          },
          {
            name: 'year',
            label: e('admin.receiptUsageReport.table.columns.year'),
            field: 'year',
            align: 'center',
          },
          {
            name: 'amount',
            label: e('admin.receiptUsageReport.table.columns.amount'),
            field: 'amount',
            align: 'center',
            style: 'width:120px',
            format: (a) => {
              const t = Number(a);
              return Number.isNaN(t) ? '0.00' : t.toFixed(2);
            },
          },
          {
            name: 'examName',
            label: e('admin.receiptUsageReport.table.columns.examName'),
            field: 'examName',
            align: 'left',
          },
          {
            name: 'payer',
            label: e('admin.receiptUsageReport.table.columns.payer'),
            field: 'payer',
            align: 'left',
          },
          {
            name: 'payee',
            label: e('admin.receiptUsageReport.table.columns.payee'),
            field: 'payee',
            align: 'left',
          },
        ]),
        N = [
          {
            name: 'index',
            label: e('admin.receiptUsageReport.table.columns.index'),
            field: 'index',
            align: 'center',
          },
          {
            name: 'receiptNo',
            label: e('admin.receiptUsageReport.table.columns.receiptNo'),
            field: 'receiptNo',
            align: 'left',
          },
          {
            name: 'paymentDate',
            label: e('admin.receiptUsageReport.table.columns.paymentDate'),
            field: 'paymentDate',
            align: 'left',
          },
          {
            name: 'receiptDate',
            label: e('admin.receiptUsageReport.table.columns.receiptDate'),
            field: 'receiptDate',
            align: 'left',
          },
          {
            name: 'year',
            label: e('admin.receiptUsageReport.table.columns.year'),
            field: 'year',
            align: 'center',
          },
          {
            name: 'amount',
            label: e('admin.receiptUsageReport.table.columns.amount'),
            field: 'amount',
            align: 'right',
          },
          {
            name: 'examName',
            label: e('admin.receiptUsageReport.table.columns.examName'),
            field: 'examName',
            align: 'left',
          },
          {
            name: 'payer',
            label: e('admin.receiptUsageReport.table.columns.payer'),
            field: 'payer',
            align: 'left',
          },
          {
            name: 'payee',
            label: e('admin.receiptUsageReport.table.columns.payee'),
            field: 'payee',
            align: 'left',
          },
        ];
      return (
        P(u, (a) => {
          a && c.notify({ type: 'negative', message: a, position: 'top' });
        }),
        Q(() => {
          (b(), f());
        }),
        (a, t) => (
          V(),
          $(
            v,
            { class: 'page-container receipt-usage-report-page' },
            {
              default: q(() => [
                i(w),
                i(
                  _,
                  {
                    title: a.$t('admin.receiptUsageReport.pageTitle'),
                    subtitle: a.$t('admin.receiptUsageReport.pageSubtitle'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                i(
                  C,
                  { filter: o(d), 'department-options': o(g), mode: 'full', onFilterChange: o(y) },
                  null,
                  8,
                  ['filter', 'department-options', 'onFilterChange'],
                ),
                r('div', O, [
                  r('div', k, [
                    i(
                      B,
                      {
                        modelValue: l.value,
                        'onUpdate:modelValue': t[0] || (t[0] = (x) => (l.value = x)),
                      },
                      null,
                      8,
                      ['modelValue'],
                    ),
                  ]),
                  t[1] || (t[1] = r('div', { class: 'text-weight-bold' }, ' ', -1)),
                  i(
                    S,
                    {
                      columns: N,
                      rows: n.value,
                      'file-name-prefix': 'receipt-usage-report',
                      color: 'primary',
                      unelevated: '',
                      class: 'text-weight-bold',
                    },
                    null,
                    8,
                    ['rows'],
                  ),
                ]),
                r('div', E, [
                  i(
                    L,
                    {
                      columns: R.value,
                      rows: n.value,
                      loading: !1,
                      pagination: U.value,
                      'empty-label': a.$t('admin.receiptUsageReport.table.emptyLabel'),
                    },
                    null,
                    8,
                    ['columns', 'rows', 'pagination', 'empty-label'],
                  ),
                ]),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  }),
  ye = A(G, [['__scopeId', 'data-v-f57d380a']]);
export { ye as default };
