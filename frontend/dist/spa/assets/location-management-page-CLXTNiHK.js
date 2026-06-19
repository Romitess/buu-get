import { Q as T } from './QPage-CM3LWBRo.js';
import {
  O as w,
  P as L,
  t as I,
  Q as S,
  _ as P,
  W as f,
  V as n,
  S as c,
  r as m,
  f as d,
  a2 as $,
} from './index-CKSooU2k.js';
import { u as B } from './use-quasar-DaOT29F-.js';
import { u as E } from './vue-i18n-Bebkm_iB.js';
import { A as k, a as R } from './app-breadcrumbs-C0oZOPYe.js';
import { S as x } from './search-bar-BgXkcRlY.js';
import { B as q } from './base-table-DuGvP-XM.js';
import { A as O } from './action-button-LWkAWINi.js';
import { A as D } from './app-button-D_cMl4aM.js';
import { f as V, d as Q } from './location.service-BLTYQ1bo.js';
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
const U = { class: 'row q-col-gutter-md items-center q-mb-lg' },
  F = { class: 'col-12 col-sm' },
  W = { class: 'col-12 col-sm-auto text-right' },
  j = { class: 'row justify-center q-gutter-x-sm no-wrap' },
  H = w({
    __name: 'location-management-page',
    setup(Y) {
      const l = B(),
        { t: o } = E(),
        _ = L(),
        i = m(!1),
        s = m(''),
        p = m([]),
        r = m({ page: 1, rowsPerPage: 10, rowsNumber: 0 }),
        u = (e) => {
          if (!e) return 1;
          const a = e.match(/\d+/g);
          if (a && a.length > 0) {
            const t = a[a.length - 1];
            if (t && t.length >= 3) return parseInt(t.substring(0, 1)) || 1;
            if (t) return parseInt(t) || 1;
          }
          return 1;
        },
        v = (e) => (e && u(e) === 1 ? 40 : 60),
        y = d(() => [
          {
            name: 'index',
            label: o('admin.locationManagement.table.columns.index'),
            field: 'index',
            align: 'center',
            style: 'width: 8%',
          },
          {
            name: 'roomName',
            label: o('admin.locationManagement.table.columns.roomName'),
            field: 'LOCATION_ROOM_NO',
            align: 'left',
            style: 'width: 24%; padding-left: 128px;',
            format: (e) => e || '-',
          },
          {
            name: 'floor',
            label: o('admin.locationManagement.table.columns.floor'),
            field: 'floor',
            align: 'center',
            style: 'width: 8%',
          },
          {
            name: 'locationName',
            label: o('admin.locationManagement.table.columns.locationName'),
            field: 'LOCATION_NAME',
            align: 'left',
            style: 'width: 36%; padding-left: 96px;',
          },
          {
            name: 'capacity',
            label: o('admin.locationManagement.table.columns.capacity'),
            field: 'capacity',
            align: 'center',
            style: 'width: 12%',
          },
          {
            name: 'tools',
            label: o('admin.locationManagement.table.columns.tools'),
            field: 'tools',
            align: 'center',
            style: 'width: 12%',
          },
        ]),
        A = d(() =>
          p.value.map((e, a) => ({
            ...e,
            index: a + 1,
            floor: e.LOCATION_FLOOR_NO ?? u(e.LOCATION_ROOM_NO),
            capacity:
              e.SEATS?.filter((t) => t.LS_SEAT_STATUS !== 1 && t.LS_SEAT_STATUS !== 2).length ??
              e.LOCATION_SEAT_CAPACITY ??
              v(e.LOCATION_ROOM_NO),
          })),
        ),
        b = d(() => {
          const e = A.value;
          if (!s.value) return e;
          const a = s.value.toLowerCase();
          return e.filter(
            (t) =>
              t.LOCATION_NAME.toLowerCase().includes(a) ||
              (t.LOCATION_ROOM_NO && t.LOCATION_ROOM_NO.toLowerCase().includes(a)),
          );
        }),
        g = async () => {
          i.value = !0;
          try {
            const e = await V();
            ((p.value = e), (r.value.rowsNumber = e.length));
          } catch {
            l.notify({
              type: 'negative',
              message: o('admin.locationManagement.notifications.loadError'),
              position: 'top',
            });
          } finally {
            i.value = !1;
          }
        },
        h = (e) => {
          const { page: a, rowsPerPage: t } = e.pagination;
          ((r.value.page = a), (r.value.rowsPerPage = t));
        },
        M = (e) => {
          _.push({ name: 'admin-edit-location', params: { locationId: String(e) } });
        },
        N = (e) => {
          l.dialog({
            title: o('admin.locationManagement.dialogs.deleteTitle'),
            message: o('admin.locationManagement.dialogs.deleteMessage'),
            cancel: !0,
            persistent: !0,
          }).onOk(() => {
            (async () => {
              i.value = !0;
              try {
                (await Q(e.LOCATION_ID),
                  l.notify({
                    type: 'positive',
                    message: o('admin.locationManagement.notifications.deleteSuccess'),
                    position: 'top',
                  }),
                  await g());
              } catch {
                l.notify({
                  type: 'negative',
                  message: o('admin.locationManagement.notifications.deleteError'),
                  position: 'top',
                });
              } finally {
                i.value = !1;
              }
            })();
          });
        };
      return (
        I(() => {
          g();
        }),
        (e, a) => (
          S(),
          P(
            T,
            { class: 'page-container location-management-page' },
            {
              default: f(() => [
                n(k),
                n(
                  R,
                  {
                    title: e.$t('admin.locationManagement.pageTitle'),
                    subtitle: e.$t('admin.locationManagement.pageDescription'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                c('div', U, [
                  c('div', F, [
                    n(
                      x,
                      {
                        modelValue: s.value,
                        'onUpdate:modelValue': a[0] || (a[0] = (t) => (s.value = t)),
                      },
                      null,
                      8,
                      ['modelValue'],
                    ),
                  ]),
                  c('div', W, [
                    n(
                      D,
                      {
                        icon: 'add',
                        label: e.$t('admin.locationManagement.createLocation'),
                        color: 'primary',
                        class: 'create-location-btn text-weight-bold',
                        onClick:
                          a[1] || (a[1] = (t) => e.$router.push({ name: 'admin-create-location' })),
                      },
                      null,
                      8,
                      ['label'],
                    ),
                  ]),
                ]),
                n(
                  q,
                  {
                    columns: y.value,
                    rows: b.value,
                    loading: i.value,
                    pagination: r.value,
                    onRequest: h,
                  },
                  {
                    'body-cell-tools': f(({ row: t }) => [
                      c('div', j, [
                        n(
                          O,
                          {
                            icon: 'edit',
                            color: 'secondary',
                            tooltip: e.$t('admin.locationManagement.table.tooltips.edit'),
                            onClick: (C) => M(t.LOCATION_ID),
                          },
                          null,
                          8,
                          ['tooltip', 'onClick'],
                        ),
                        n(
                          O,
                          {
                            icon: 'delete',
                            color: 'negative',
                            tooltip: e.$t('admin.locationManagement.table.tooltips.delete'),
                            onClick: (C) => N(t),
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
                  ['columns', 'rows', 'loading', 'pagination'],
                ),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  }),
  fe = $(H, [['__scopeId', 'data-v-ac53fa54']]);
export { fe as default };
