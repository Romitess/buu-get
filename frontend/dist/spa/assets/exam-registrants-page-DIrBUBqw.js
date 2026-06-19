import { Q as le } from './QPage-CM3LWBRo.js';
import {
  O as j,
  Q as q,
  R as oe,
  T as x,
  a3 as re,
  f as l,
  a2 as z,
  r as A,
  a4 as ie,
  P as ue,
  w,
  t as ce,
  _ as Q,
  W as h,
  V as I,
  X as p,
  ax as X,
  U as me,
  S as f,
} from './index-CKSooU2k.js';
import { u as de } from './vue-i18n-Bebkm_iB.js';
import { B as Se } from './base-table-DuGvP-XM.js';
import { A as Y } from './action-button-LWkAWINi.js';
import { P as F, V as H, E as L, a as $ } from './enrollment.types-BjT4wGLO.js';
import { S as ve } from './search-bar-BgXkcRlY.js';
import { _ as pe } from './export-csv-button.vue_vue_type_script_setup_true_lang-VSWIuzMe.js';
import { A as fe, a as ge } from './app-exam-session-time-DwwTVopE.js';
import { A as Ie, a as _e } from './app-breadcrumbs-C0oZOPYe.js';
import { c as Te } from './enrollment.service-D8jIpEGB.js';
import { i as Ee } from './exam.service-0p8xz0zq.js';
import './QTable-B4W-6HCk.js';
import './QList-fArhXj97.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './format-DnjzHs7F.js';
import './position-engine-Bv76xS6k.js';
import './QLinearProgress-ComgvJOP.js';
import './QSpinnerDots-Dwh4MvNX.js';
import './QInnerLoading-CAwPoqSH.js';
import './QTooltip-BUG2ohUJ.js';
import './export-file-BbXX5Gbn.js';
import './date-DmslTAtO.js';
import './use-quasar-DaOT29F-.js';
import './app-button-D_cMl4aM.js';
import './QResizeObserver-C4jaR1Qo.js';
const he = j({
    __name: 'enrollment-status-badge',
    props: { status: {}, type: {} },
    setup(N) {
      const o = N,
        g = l(() => (o.type === 'payment' ? (F[o.status] ?? '-') : (H[o.status] ?? '-'))),
        c = l(() => {
          if (o.type === 'payment')
            switch (o.status) {
              case L.PAID:
              case L.SEAT_ASSIGNED:
              case L.SEAT_PUBLISHED:
              case L.ATTENDED:
                return 'badge--paid';
              case L.UNPAID:
                return 'badge--unpaid';
              case L.CANCELLED:
                return 'badge--cancelled';
              default:
                return 'badge--default';
            }
          switch (o.status) {
            case $.PASS:
              return 'badge--pass';
            case $.WAIT_FIXED:
              return 'badge--wait-fixed';
            case $.UNCHECKED:
              return 'badge--unchecked';
            case $.CANCELLED:
              return 'badge--cancelled';
            default:
              return 'badge--default';
          }
        });
      return (_, u) => (
        q(),
        oe('div', { class: re(['enrollment-status-badge', c.value]) }, x(g.value), 3)
      );
    },
  }),
  W = z(he, [['__scopeId', 'data-v-3d55673f']]);
function Ae() {
  const N = L.CANCELLED,
    o = A([]),
    g = A(null),
    c = A(!1),
    _ = A(null),
    u = A(''),
    v = A(null),
    d = A(null),
    r = (n) => `${n.SS_START_TIME || ''}-${n.SS_END_TIME || ''}`,
    C = l(() => {
      const n = new Set();
      return (g.value?.SESSIONS ?? []).filter((a) => {
        const i = r(a);
        return n.has(i) ? !1 : (n.add(i), !0);
      });
    }),
    S = l(() => {
      if (!v.value) return new Set();
      const n = g.value?.SESSIONS ?? [],
        a = n.find((m) => m.SS_ID === v.value);
      if (!a) return new Set([v.value]);
      const i = r(a);
      return new Set(n.filter((m) => r(m) === i).map((m) => m.SS_ID));
    }),
    P = l(() =>
      (g.value?.SESSIONS ?? [])
        .filter((a) => S.value.has(a.SS_ID))
        .flatMap((a) => a.SESSION_LOCATIONS ?? []),
    ),
    k = l(() =>
      P.value
        .filter((n) => n.LOCATION)
        .map((n) => ({
          value: n.SL_ID,
          label: `${n.LOCATION.LOCATION_NAME}${n.LOCATION.LOCATION_ROOM_NO ? ` (${n.LOCATION.LOCATION_ROOM_NO})` : ''}`,
        })),
    ),
    R = l(() => {
      let n = o.value.filter((a) => a.paymentStatus !== N);
      if ((v.value && (n = n.filter((a) => S.value.has(a.sessionId))), u.value)) {
        const a = u.value.toLowerCase();
        n = n.filter((i) => {
          const m = (F[i.paymentStatus] || '').toLowerCase(),
            O = (H[i.verifyStatus] || '').toLowerCase(),
            y = (i.remark || '').toLowerCase();
          return (
            i.nationalId.toLowerCase().includes(a) ||
            i.fullnameTh.toLowerCase().includes(a) ||
            i.titleTh.toLowerCase().includes(a) ||
            m.includes(a) ||
            O.includes(a) ||
            y.includes(a)
          );
        });
      }
      return n.map((a, i) => ({ ...a, index: i + 1 }));
    }),
    B = l(() => {
      const n = o.value.filter((a) => a.paymentStatus !== N);
      return v.value
        ? n.filter(
            (a) =>
              S.value.has(a.sessionId) && (d.value === null || a.sessionLocationId === d.value),
          ).length
        : n.length;
    }),
    T = l(
      () =>
        (v.value ? o.value.filter((a) => S.value.has(a.sessionId)) : o.value).filter(
          (a) =>
            a.paymentStatus >= 1 &&
            a.paymentStatus !== N &&
            (d.value === null || a.sessionLocationId === d.value),
        ).length,
    );
  return {
    enrollments: o,
    exam: g,
    isLoading: c,
    error: _,
    searchQuery: u,
    selectedSessionId: v,
    selectedSessionLocationId: d,
    sessionTimeTabs: C,
    roomOptions: k,
    filteredEnrollments: R,
    sessionTotalCount: B,
    sessionPaidCount: T,
    fetchEnrollments: async (n) => {
      ((c.value = !0), (_.value = null));
      try {
        const a = Te(n).catch((y) => (console.error('Failed to fetch enrollments:', y), [])),
          i = Ee(n).catch((y) => (console.error('Failed to fetch exam details:', y), null)),
          [m, O] = await Promise.all([a, i]);
        ((o.value = m),
          (g.value = O),
          m.length === 0 && !O && (_.value = 'ไม่พบข้อมูลการสอบหรือรายชื่อผู้สมัคร'));
      } catch (a) {
        (console.error('Critical error in fetchEnrollments:', a),
          (_.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล'));
      } finally {
        c.value = !1;
      }
    },
  };
}
const ye = { class: 'toolbar-section row q-col-gutter-md items-center q-mb-md' },
  Le = { class: 'col' },
  Ne = { class: 'col-auto' },
  Oe = { class: 'text-center' },
  be = { class: 'text-center' },
  Ce = { class: 'registrant-fullname-cell' },
  De = { class: 'text-center' },
  xe = { class: 'text-center' },
  Me = { class: 'text-center' },
  we = { class: 'row justify-center q-gutter-x-sm no-wrap' },
  $e = j({
    __name: 'exam-registrants-page',
    setup(N) {
      const o = ie(),
        g = ue(),
        c = de(),
        {
          isLoading: _,
          exam: u,
          searchQuery: v,
          selectedSessionId: d,
          selectedSessionLocationId: r,
          sessionTimeTabs: C,
          roomOptions: S,
          filteredEnrollments: P,
          fetchEnrollments: k,
        } = Ae(),
        R = (e) => c.t(`common.months[${e}]`),
        B = l(() => {
          if (!u.value?.EXAM_DATE) return '-';
          const e = new Date(u.value.EXAM_DATE);
          if (isNaN(e.getTime())) return u.value.EXAM_DATE;
          const s = e.getDate(),
            t = R(e.getMonth()),
            E = c.locale.value.startsWith('th'),
            M = e.getFullYear() + (E ? 543 : 0);
          return `${s} ${t} ${M}`;
        }),
        T = l(() => u.value?.SESSIONS?.find((e) => e.SS_ID === d.value) || null),
        V = (e) => {
          const s = String(e.SS_START_TIME || '').substring(0, 5),
            t = String(e.SS_END_TIME || '').substring(0, 5);
          return `${s}-${t}`;
        },
        n = l(() => {
          if (!T.value) return [];
          const e = V(T.value);
          return (u.value?.SESSIONS ?? []).filter((s) => V(s) === e);
        }),
        a = l(() =>
          n.value.flatMap((e) => {
            const s = e.SESSION_LOCATIONS || [];
            return s.length > 0
              ? s.filter((t) => t.LOCATION).map((t) => ({ ...t, SS_ID: t.SS_ID || e.SS_ID }))
              : e.LOCATION
                ? [
                    {
                      SL_ID: -e.SS_ID,
                      LOCATION_ID: e.LOCATION.LOCATION_ID,
                      SS_ID: e.SS_ID,
                      LOCATION: e.LOCATION,
                    },
                  ]
                : [];
          }),
        ),
        i = l(() => a.value.find((e) => e.SL_ID === r.value) ?? null),
        m = l(() => i.value?.LOCATION ?? T.value?.LOCATION ?? null),
        O = l(() => {
          if (!T.value) return '-';
          const e = (T.value.SS_START_TIME || '').substring(0, 5),
            s = (T.value.SS_END_TIME || '').substring(0, 5);
          return `${e}-${s}`;
        }),
        y = l(() => {
          if (!m.value) return '-';
          const e = m.value;
          return `${e.LOCATION_NAME}${e.LOCATION_ROOM_NO ? ` (${e.LOCATION_ROOM_NO})` : ''}`;
        });
      w(
        [d, S],
        () => {
          S.value.some((e) => e.value === r.value) || (r.value = S.value[0]?.value ?? null);
        },
        { immediate: !0 },
      );
      const G = l(() =>
          m.value?.SEATS?.length
            ? m.value.SEATS.length
            : (n.value.find((e) => e.SS_ID === i.value?.SS_ID)?.SS_CAPACITY ?? 0),
        ),
        b = l(() => {
          const e = P.value;
          return r.value === null
            ? e
            : e
                .filter((t) => {
                  if (t.slId !== null && t.slId !== void 0) return t.slId === r.value;
                  const E = a.value.find((U) =>
                    U.LOCATION.SEATS?.some((se) => se.LS_ID === t.lsId),
                  );
                  if (E) return E.SL_ID === r.value;
                  const M = a.value.filter((U) => U.SS_ID === t.sessionId);
                  return M.length > 0 && M[0]?.SL_ID === r.value;
                })
                .map((t, E) => ({ ...t, index: E + 1 }));
        }),
        J = l(() => b.value.length),
        Z = l(() => {
          const e = b.value,
            s = 5;
          return e.filter((t) => t.paymentStatus >= 1 && t.paymentStatus !== s).length;
        });
      (w(u, (e) => {
        if (e && C.value.length > 0 && !d.value) {
          const s = C.value[0];
          s && (d.value = s.SS_ID);
        }
      }),
        w(
          [d, S],
          () => {
            const e = S.value[0]?.value ?? null;
            if (e === null) {
              r.value = null;
              return;
            }
            S.value.some((s) => s.value === r.value) || (r.value = e);
          },
          { immediate: !0 },
        ));
      const D = A({ page: 1, rowsPerPage: 10, rowsNumber: 0 }),
        K = [
          {
            name: 'index',
            label: c.t('admin.registrantManagement.table.columns.index'),
            field: 'index',
            align: 'center',
            style: 'width: 6%',
          },
          {
            name: 'titleTh',
            label: c.t('admin.registrantManagement.table.columns.prefix'),
            field: 'titleTh',
            align: 'center',
            style: 'width: 10%',
          },
          {
            name: 'fullnameTh',
            label: c.t('admin.registrantManagement.table.columns.fullName'),
            field: 'fullnameTh',
            align: 'left',
            style: 'width: 21%',
          },
          {
            name: 'remark',
            label: c.t('admin.registrantManagement.table.columns.remark'),
            field: 'remark',
            align: 'center',
            style: 'width: 18%',
          },
          {
            name: 'paymentStatus',
            label: c.t('admin.registrantManagement.table.columns.paymentStatus'),
            field: 'paymentStatus',
            align: 'center',
            format: (e) => F[e] || '-',
            style: 'width: 15%',
          },
          {
            name: 'verifyStatus',
            label: c.t('admin.registrantManagement.table.columns.verifyStatus'),
            field: 'verifyStatus',
            align: 'center',
            format: (e) => H[e] || '-',
            style: 'width: 18%',
          },
          {
            name: 'tools',
            label: c.t('admin.registrantManagement.table.columns.tools'),
            field: 'tools',
            align: 'center',
            style: 'width: 12%',
          },
        ],
        ee = (e) => {
          const { page: s, rowsPerPage: t } = e.pagination;
          ((D.value.page = s), (D.value.rowsPerPage = t));
        },
        te = (e) => {
          g.push({
            name: 'admin-exam-registrant-detail',
            params: { examId: o.params.examId, ermId: String(e) },
          });
        },
        ae = (e) => {
          g.push({
            name: 'admin-exam-registrant-history',
            params: { examId: o.params.examId, ermId: String(e) },
          });
        },
        ne = async () => {
          const e = Number(o.params.examId);
          if (!isNaN(e) && e > 0) {
            await k(e);
            const s = Number(o.query.sessionLocationId);
            (!isNaN(s) && S.value.some((t) => t.value === s) && (r.value = s),
              (D.value.rowsNumber = b.value.length));
          }
        };
      return (
        w(b, (e) => {
          D.value.rowsNumber = e.length;
        }),
        ce(() => {
          ne();
        }),
        (e, s) => (
          q(),
          Q(
            le,
            { class: 'page-container registrants-page' },
            {
              default: h(() => [
                I(Ie),
                I(
                  _e,
                  {
                    title: e.$t('admin.registrantManagement.pageTitle'),
                    subtitle: e.$t('admin.registrantManagement.pageSubtitle'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                I(
                  fe,
                  {
                    modelValue: p(d),
                    'onUpdate:modelValue': s[0] || (s[0] = (t) => (X(d) ? (d.value = t) : null)),
                    sessions: p(C),
                  },
                  null,
                  8,
                  ['modelValue', 'sessions'],
                ),
                p(u)
                  ? (q(),
                    Q(
                      ge,
                      {
                        key: 0,
                        'selected-location-id': p(r),
                        'onUpdate:selectedLocationId':
                          s[1] || (s[1] = (t) => (X(r) ? (r.value = t) : null)),
                        class: 'q-mb-md',
                        title: p(u).EXAM_ROUND
                          ? `${p(u).EXAM_NAME} ${p(u).EXAM_ROUND}`
                          : p(u).EXAM_NAME,
                        date: B.value,
                        time: O.value,
                        location: y.value,
                        'location-options': p(S),
                        'applicant-count': J.value,
                        'paid-count': Z.value,
                        'total-capacity': G.value,
                        'is-admin': '',
                      },
                      null,
                      8,
                      [
                        'selected-location-id',
                        'title',
                        'date',
                        'time',
                        'location',
                        'location-options',
                        'applicant-count',
                        'paid-count',
                        'total-capacity',
                      ],
                    ))
                  : me('', !0),
                f('nav', ye, [
                  f('div', Le, [
                    I(
                      ve,
                      {
                        modelValue: p(v),
                        'onUpdate:modelValue':
                          s[2] || (s[2] = (t) => (X(v) ? (v.value = t) : null)),
                        placeholder: e.$t('admin.registrantManagement.searchPlaceholder'),
                      },
                      null,
                      8,
                      ['modelValue', 'placeholder'],
                    ),
                  ]),
                  f('div', Ne, [
                    I(
                      pe,
                      {
                        columns: K,
                        rows: b.value,
                        'file-name-prefix': 'exam-registrants',
                        class: 'export-btn',
                      },
                      null,
                      8,
                      ['rows'],
                    ),
                  ]),
                ]),
                f('main', null, [
                  I(
                    Se,
                    {
                      columns: K,
                      rows: b.value,
                      loading: p(_),
                      pagination: D.value,
                      class: 'registrants-table',
                      onRequest: ee,
                    },
                    {
                      'body-cell-index': h(({ row: t }) => [f('div', Oe, x(t.index), 1)]),
                      'body-cell-titleTh': h(({ value: t }) => [f('div', be, x(t), 1)]),
                      'body-cell-fullnameTh': h(({ value: t }) => [f('div', Ce, x(t), 1)]),
                      'body-cell-remark': h(({ value: t }) => [f('div', De, x(t || '-'), 1)]),
                      'body-cell-paymentStatus': h(({ row: t }) => [
                        f('div', xe, [
                          I(W, { status: t.paymentStatus, type: 'payment' }, null, 8, ['status']),
                        ]),
                      ]),
                      'body-cell-verifyStatus': h(({ row: t }) => [
                        f('div', Me, [
                          I(W, { status: t.verifyStatus, type: 'verify' }, null, 8, ['status']),
                        ]),
                      ]),
                      'body-cell-tools': h(({ row: t }) => [
                        f('div', we, [
                          I(
                            Y,
                            {
                              icon: 'visibility',
                              tooltip: e.$t('admin.registrantManagement.table.tooltips.viewDetail'),
                              color: 'black',
                              onClick: (E) => te(t.ermId),
                            },
                            null,
                            8,
                            ['tooltip', 'onClick'],
                          ),
                          I(
                            Y,
                            {
                              icon: 'update',
                              tooltip: e.$t('profileEditHistory.pageTitle'),
                              color: 'black',
                              onClick: (E) => ae(t.ermId),
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
                    ['rows', 'loading', 'pagination'],
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
  ut = z($e, [['__scopeId', 'data-v-e6dd0ac7']]);
export { ut as default };
