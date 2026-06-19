import { Q as T } from './QPage-CM3LWBRo.js';
import {
  O as h,
  Q as w,
  _ as x,
  W as i,
  S as t,
  T as u,
  X as N,
  f as _,
  a2 as D,
  a4 as H,
  t as q,
  V as p,
  r as v,
} from './index-CKSooU2k.js';
import { u as B } from './use-quasar-DaOT29F-.js';
import { A as $, a as C } from './app-breadcrumbs-C0oZOPYe.js';
import { S as I } from './search-bar-BgXkcRlY.js';
import { _ as V } from './export-csv-button.vue_vue_type_script_setup_true_lang-VSWIuzMe.js';
import { u as Q } from './vue-i18n-Bebkm_iB.js';
import { B as S } from './base-table-DuGvP-XM.js';
import { u as L } from './useThaiDate-DeOnfo3Z.js';
import { f as A } from './exam.service-0p8xz0zq.js';
import './export-file-BbXX5Gbn.js';
import './date-DmslTAtO.js';
import './format-DnjzHs7F.js';
import './position-engine-Bv76xS6k.js';
import './app-button-D_cMl4aM.js';
import './QTable-B4W-6HCk.js';
import './QList-fArhXj97.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './QLinearProgress-ComgvJOP.js';
import './QSpinnerDots-Dwh4MvNX.js';
import './QInnerLoading-CAwPoqSH.js';
const R = { class: 'text-center' },
  k = { class: 'text-left q-pl-custom' },
  O = { class: 'text-center' },
  j = { class: 'text-center' },
  M = { class: 'text-center' },
  U = h({
    __name: 'passcode-history-table',
    props: { passcodes: {}, loading: { type: Boolean }, pagination: {} },
    emits: ['request'],
    setup(r, { emit: f }) {
      const d = r,
        c = f,
        { formatThaiDate: o } = L(),
        { t: s } = Q(),
        g = (l) => {
          const b = d.pagination?.page ?? 1,
            e = d.pagination?.rowsPerPage ?? 10,
            a = d.passcodes.indexOf(l);
          return (b - 1) * e + a + 1;
        },
        n = _(() => [
          {
            name: 'index',
            label: s('admin.passcodeHistory.table.columns.index'),
            field: 'index',
            align: 'center',
            style: 'width: 8%',
          },
          {
            name: 'fullName',
            label: s('admin.passcodeHistory.table.columns.fullName'),
            field: 'fullName',
            align: 'left',
            style: 'width: 30%',
          },
          {
            name: 'passcode',
            label: s('admin.passcodeHistory.table.columns.passcode'),
            field: 'passcode',
            align: 'center',
            style: 'width: 22%',
          },
          {
            name: 'usedDate',
            label: s('admin.passcodeHistory.table.columns.usedDate'),
            field: 'usedDate',
            align: 'center',
            style: 'width: 20%',
          },
          {
            name: 'usedTime',
            label: s('admin.passcodeHistory.table.columns.usedTime'),
            field: 'usedTime',
            align: 'center',
            style: 'width: 20%',
          },
        ]),
        y = (l) => {
          c('request', l);
        };
      return (l, b) => (
        w(),
        x(
          S,
          {
            columns: n.value,
            rows: r.passcodes,
            loading: r.loading,
            pagination: r.pagination,
            onRequest: y,
          },
          {
            'body-cell-index': i(({ row: e }) => [t('div', R, u(g(e)), 1)]),
            'body-cell-fullName': i(({ row: e }) => [t('div', k, u(e.fullName), 1)]),
            'body-cell-passcode': i(({ row: e }) => [t('div', O, u(e.passcode), 1)]),
            'body-cell-usedDate': i(({ row: e }) => [t('div', j, u(N(o)(e.usedDate)), 1)]),
            'body-cell-usedTime': i(({ row: e }) => [t('div', M, u(e.usedTime), 1)]),
            _: 1,
          },
          8,
          ['columns', 'rows', 'loading', 'pagination'],
        )
      );
    },
  }),
  W = D(U, [['__scopeId', 'data-v-2ba0fd0d']]),
  X = { class: 'row items-center justify-between q-mb-lg' },
  z = { class: 'col' },
  ye = h({
    __name: 'passcode-history-page',
    setup(r) {
      const f = B(),
        d = H(),
        c = v(!1),
        o = v(''),
        s = v([]),
        g = _(() => d.query.examId),
        n = v({ page: 1, rowsPerPage: 10, rowsNumber: 0 }),
        y = _(() => {
          if (!o.value) return s.value;
          const a = o.value.toLowerCase();
          return s.value.filter(
            (m) => m.fullName.toLowerCase().includes(a) || m.passcode.toLowerCase().includes(a),
          );
        }),
        l = [
          { name: 'index', label: 'ลำดับ', field: 'index', align: 'center' },
          { name: 'fullName', label: 'ชื่อ-นามสกุล', field: 'fullName', align: 'center' },
          { name: 'passcode', label: 'Passcode', field: 'passcode', align: 'center' },
          { name: 'usedDate', label: 'วันที่ใช้', field: 'usedDate', align: 'center' },
          { name: 'usedTime', label: 'เวลาที่ใช้', field: 'usedTime', align: 'center' },
        ],
        b = async () => {
          if (!g.value) {
            f.notify({ type: 'warning', message: 'ไม่พบรหัสการสอบ', position: 'top' });
            return;
          }
          c.value = !0;
          try {
            const a = await A(g.value);
            ((s.value = a), (n.value.rowsNumber = a.length));
          } catch {
            f.notify({
              type: 'negative',
              message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
              position: 'top',
            });
          } finally {
            c.value = !1;
          }
        },
        e = (a) => {
          ((n.value.page = a.pagination.page), (n.value.rowsPerPage = a.pagination.rowsPerPage));
        };
      return (
        q(() => {
          b();
        }),
        (a, m) => (
          w(),
          x(
            T,
            { class: 'page-container exam-management-page' },
            {
              default: i(() => [
                p($),
                p(
                  C,
                  {
                    title: a.$t('admin.passcodeHistory.pageTitle'),
                    subtitle: a.$t('admin.passcodeHistory.pageSubtitle'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                t('div', X, [
                  t('div', z, [
                    p(
                      I,
                      {
                        modelValue: o.value,
                        'onUpdate:modelValue': m[0] || (m[0] = (P) => (o.value = P)),
                      },
                      null,
                      8,
                      ['modelValue'],
                    ),
                  ]),
                  p(
                    V,
                    {
                      columns: l,
                      rows: y.value,
                      'file-name-prefix': 'passcode-history',
                      color: 'primary',
                      unelevated: '',
                      class: 'text-weight-bold',
                    },
                    null,
                    8,
                    ['rows'],
                  ),
                ]),
                p(
                  W,
                  { passcodes: y.value, loading: c.value, pagination: n.value, onRequest: e },
                  null,
                  8,
                  ['passcodes', 'loading', 'pagination'],
                ),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  });
export { ye as default };
