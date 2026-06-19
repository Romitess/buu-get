import { Q as L } from './QPage-CM3LWBRo.js';
import { u as k } from './use-quasar-DaOT29F-.js';
import { A as Y, a as V } from './app-breadcrumbs-C0oZOPYe.js';
import { u as Q, D as j } from './use-daily-revenue-XZfrg-bR.js';
import { S as q } from './search-bar-BgXkcRlY.js';
import { _ as H } from './export-csv-button.vue_vue_type_script_setup_true_lang-VSWIuzMe.js';
import { A as z } from './action-button-LWkAWINi.js';
import { B as G } from './base-table-DuGvP-XM.js';
import { d as W } from './enrollment.service-D8jIpEGB.js';
import { u as J, R as K } from './use-exam-documents-BOgCcvPw.js';
import { u as Z } from './vue-i18n-Bebkm_iB.js';
import {
  O as ee,
  w as te,
  t as ae,
  Q as N,
  _ as ne,
  W as x,
  V as r,
  X as p,
  S as s,
  R as oe,
  U as ie,
  r as b,
  f as d,
  a2 as le,
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
import './QTooltip-BUG2ohUJ.js';
import './QTable-B4W-6HCk.js';
import './QList-fArhXj97.js';
import './QLinearProgress-ComgvJOP.js';
import './QSpinnerDots-Dwh4MvNX.js';
import './QInnerLoading-CAwPoqSH.js';
import './jspdf.es.min-UKkqpIx2.js';
import './image.service-iLwePKJ0.js';
import './exam.service-0p8xz0zq.js';
import './exam-rule-voucher.service-CrkXcGFH.js';
const re = { class: 'row items-center justify-between q-mb-lg' },
  pe = { class: 'col-6' },
  se = { class: 'q-mt-lg application-fee-table' },
  me = { class: 'row items-center justify-center' },
  ce = {
    key: 0,
    id: 'receipt-render-container',
    style: {
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      width: '210mm',
      height: '297mm',
      'z-index': '-1000',
      'pointer-events': 'none',
      'background-color': '#ffffff',
    },
  },
  de = ee({
    __name: 'application-fee-report-page',
    setup(ue) {
      const u = k(),
        {
          error: A,
          filter: i,
          departmentOptions: _,
          fetchData: E,
          loadDepartmentOptions: v,
          applyFilter: h,
        } = Q(),
        { isDownloadingReceipt: F, selectedReceiptData: S, printReceipt: T } = J(),
        { t: n } = Z(),
        m = b(''),
        f = b(!1),
        D = b([]),
        w = (e) => {
          if (!e) return '-';
          const t = new Date(e),
            a = String(t.getDate()).padStart(2, '0'),
            o = String(t.getMonth() + 1).padStart(2, '0'),
            l = t.getFullYear() + 543,
            c = String(t.getHours()).padStart(2, '0'),
            g = String(t.getMinutes()).padStart(2, '0'),
            R = String(t.getSeconds()).padStart(2, '0');
          return `${a}/${o}/${l} ${c}:${g}:${R}`;
        },
        C = async () => {
          f.value = !0;
          try {
            const e = await W();
            D.value = e.filter((t) => [1, 2, 3, 4].includes(t.ERM_STATUS));
          } catch (e) {
            (console.error(e),
              u.notify({
                type: 'negative',
                message: 'ไม่สามารถดึงข้อมูลค่าธรรมเนียมสมัครสอบได้',
                position: 'top',
              }));
          } finally {
            f.value = !1;
          }
        },
        $ = d(() =>
          D.value.map((e, t) => {
            const a = e.TRANSACTION,
              o = a?.RECEIPTS?.[0],
              l = e.SESSION?.EXAM,
              c = a?.TRANX_PAID_AT
                ? new Date(a.TRANX_PAID_AT).getFullYear()
                : l?.EXAM_DATE
                  ? new Date(l.EXAM_DATE).getFullYear()
                  : new Date().getFullYear(),
              g =
                (o?.RC_ID ? `RC${c}-${String(o.RC_ID).padStart(5, '0')}` : '') ||
                `RC${c}-${String(e.ERM_ID).padStart(5, '0')}`,
              R =
                o?.RC_NAME ||
                `${e.USER?.PROFILE?.userTitleTh || ''} ${e.USER?.PROFILE?.userFullnameTh || ''}`.trim() ||
                'ผู้สมัครสอบ',
              U = Number(a?.TRANX_AMOUNT ?? l?.EXAM_FEE ?? 0),
              P = w(a?.TRANX_PAID_AT),
              B = w(e.CREATED_AT);
            return {
              index: t + 1,
              receiptNo: g,
              payer: R,
              amount: U,
              paymentDate: P,
              examName: l?.EXAM_ROUND
                ? `${l.EXAM_NAME} ${l.EXAM_ROUND}`
                : l?.EXAM_NAME || 'BUU-GET Exam',
              importedDate: B,
              payee: 'สิงหา มานะอมรกุล',
              rawEnrollment: e,
            };
          }),
        ),
        y = d(() => {
          let e = $.value;
          if (i.value.startDate) {
            const t = new Date(`${i.value.startDate}T00:00:00`);
            e = e.filter((a) => {
              const o = a.rawEnrollment.TRANSACTION?.TRANX_PAID_AT;
              return o ? new Date(o) >= t : !1;
            });
          }
          if (i.value.endDate) {
            const t = new Date(`${i.value.endDate}T23:59:59`);
            e = e.filter((a) => {
              const o = a.rawEnrollment.TRANSACTION?.TRANX_PAID_AT;
              return o ? new Date(o) <= t : !1;
            });
          }
          if (
            (i.value.department &&
              (e = e.filter(
                (t) =>
                  t.rawEnrollment.SESSION?.EXAM?.FUND_SOURCE?.FS_FACULTY === i.value.department,
              )),
            i.value.examName)
          ) {
            const t = i.value.examName.toLowerCase();
            e = e.filter((a) => (a.examName || '').toLowerCase().includes(t));
          }
          if (m.value) {
            const t = m.value.toString().toLowerCase();
            e = e.filter((a) =>
              [a.receiptNo, a.payer, a.examName, a.payee].join(' ').toLowerCase().includes(t),
            );
          }
          return e.map((t, a) => ({ ...t, index: a + 1 }));
        }),
        I = d(() => ({ page: 1, rowsPerPage: 10, rowsNumber: y.value.length })),
        M = d(() => [
          {
            name: 'index',
            label: n('admin.applicationFeeReport.table.columns.index'),
            field: 'index',
            align: 'center',
            style: 'width:60px',
          },
          {
            name: 'receiptNo',
            label: n('admin.applicationFeeReport.table.columns.receiptNo'),
            field: 'receiptNo',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'payer',
            label: n('admin.applicationFeeReport.table.columns.payer'),
            field: 'payer',
            align: 'left',
            style: 'width:180px',
          },
          {
            name: 'amount',
            label: n('admin.applicationFeeReport.table.columns.amount'),
            field: 'amount',
            align: 'center',
            style: 'width:120px',
            format: (e) => {
              const t = Number(e);
              return Number.isNaN(t) ? '0.00' : t.toFixed(2);
            },
          },
          {
            name: 'paymentDate',
            label: n('admin.applicationFeeReport.table.columns.paymentDate'),
            field: 'paymentDate',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'examName',
            label: n('admin.applicationFeeReport.table.columns.examName'),
            field: 'examName',
            align: 'left',
          },
          {
            name: 'importedDate',
            label: n('admin.applicationFeeReport.table.columns.importedDate'),
            field: 'importedDate',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'payee',
            label: n('admin.applicationFeeReport.table.columns.payee'),
            field: 'payee',
            align: 'left',
            style: 'width:160px',
          },
          {
            name: 'actions',
            label: n('admin.applicationFeeReport.table.columns.actions'),
            field: 'actions',
            align: 'center',
            style: 'width:110px',
          },
        ]),
        X = [
          {
            name: 'index',
            label: n('admin.applicationFeeReport.table.columns.index'),
            field: 'index',
            align: 'center',
            style: 'width:60px',
          },
          {
            name: 'receiptNo',
            label: n('admin.applicationFeeReport.table.columns.receiptNo'),
            field: 'receiptNo',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'payer',
            label: n('admin.applicationFeeReport.table.columns.payer'),
            field: 'payer',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'amount',
            label: n('admin.applicationFeeReport.table.columns.amount'),
            field: 'amount',
            align: 'center',
            style: 'width:120px',
          },
          {
            name: 'paymentDate',
            label: n('admin.applicationFeeReport.table.columns.paymentDate'),
            field: 'paymentDate',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'examName',
            label: n('admin.applicationFeeReport.table.columns.examName'),
            field: 'examName',
            align: 'center',
          },
          {
            name: 'importedDate',
            label: n('admin.applicationFeeReport.table.columns.importedDate'),
            field: 'importedDate',
            align: 'center',
            style: 'width:180px',
          },
          {
            name: 'payee',
            label: n('admin.applicationFeeReport.table.columns.payee'),
            field: 'payee',
            align: 'center',
            style: 'width:160px',
          },
        ],
        O = async (e) => {
          try {
            const t = {
              id: e.rawEnrollment.ERM_ID,
              title: e.examName,
              status: 'SUCCESS',
              statusType: 'success',
              date: e.paymentDate,
              time: '',
              location: '',
              rawEnrollment: e.rawEnrollment,
            };
            await T(t);
          } catch (t) {
            (console.error(t),
              u.notify({
                type: 'negative',
                message: 'เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ',
                position: 'top',
              }));
          }
        };
      return (
        te(A, (e) => {
          e && u.notify({ type: 'negative', message: e, position: 'top' });
        }),
        ae(() => {
          (v(), E(), C());
        }),
        (e, t) => (
          N(),
          ne(
            L,
            { class: 'page-container application-fee-report-page' },
            {
              default: x(() => [
                r(Y),
                r(
                  V,
                  {
                    title: e.$t('admin.applicationFeeReport.pageTitle'),
                    subtitle: e.$t('admin.applicationFeeReport.pageSubtitle'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                r(
                  j,
                  {
                    filter: p(i),
                    'department-options': p(_),
                    mode: 'compact',
                    onFilterChange: p(h),
                  },
                  null,
                  8,
                  ['filter', 'department-options', 'onFilterChange'],
                ),
                s('div', re, [
                  s('div', pe, [
                    r(
                      q,
                      {
                        modelValue: m.value,
                        'onUpdate:modelValue': t[0] || (t[0] = (a) => (m.value = a)),
                      },
                      null,
                      8,
                      ['modelValue'],
                    ),
                  ]),
                  t[1] || (t[1] = s('div', { class: 'text-weight-bold' }, ' ', -1)),
                  r(
                    H,
                    {
                      columns: X,
                      rows: y.value,
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
                s('div', se, [
                  r(
                    G,
                    {
                      columns: M.value,
                      rows: y.value,
                      loading: f.value,
                      pagination: I.value,
                      'empty-label': e.$t('admin.applicationFeeReport.table.emptyLabel'),
                    },
                    {
                      'body-cell-actions': x(({ row: a }) => [
                        s('div', me, [
                          r(
                            z,
                            {
                              icon: 'download',
                              color: 'scecondary',
                              tooltip: p(n)('admin.applicationFeeReport.actions.viewRecord'),
                              onClick: (o) => O(a),
                            },
                            null,
                            8,
                            ['tooltip', 'onClick'],
                          ),
                        ]),
                      ]),
                      _: 1,
                    },
                    8,
                    ['columns', 'rows', 'loading', 'pagination', 'empty-label'],
                  ),
                ]),
                p(F)
                  ? (N(),
                    oe('div', ce, [r(K, { receipt: p(S), 'is-copy': !0 }, null, 8, ['receipt'])]))
                  : ie('', !0),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  }),
  We = le(de, [['__scopeId', 'data-v-76715515']]);
export { We as default };
