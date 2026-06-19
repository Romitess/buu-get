import { Q as N } from './QTooltip-BUG2ohUJ.js';
import {
  O as $,
  t as j,
  Q as z,
  _ as W,
  W as i,
  V as n,
  S as l,
  T as d,
  a8 as p,
  a0 as v,
  au as G,
  an as H,
  am as O,
  az as R,
  X as m,
  av as y,
  aZ as X,
  ap as Z,
  r,
  f as _,
  a2 as J,
} from './index-CKSooU2k.js';
import { Q as K } from './QSpace-BPMiD-JH.js';
import { Q as ee } from './QForm-7Hg-hjp5.js';
import { Q as ae } from './QPage-CM3LWBRo.js';
import { u as te } from './use-quasar-DaOT29F-.js';
import { u as oe } from './vue-i18n-Bebkm_iB.js';
import { A as ne, a as le } from './app-breadcrumbs-C0oZOPYe.js';
import { S as se } from './search-bar-BgXkcRlY.js';
import { B as ie } from './base-table-DuGvP-XM.js';
import { A as re } from './app-button-D_cMl4aM.js';
import { f as ue, u as de, c as ce, d as me } from './finance.service-BGaW4u-C.js';
import './position-engine-Bv76xS6k.js';
import './QTable-B4W-6HCk.js';
import './QList-fArhXj97.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './format-DnjzHs7F.js';
import './QLinearProgress-ComgvJOP.js';
import './QSpinnerDots-Dwh4MvNX.js';
import './QInnerLoading-CAwPoqSH.js';
const ge = { class: 'row q-col-gutter-md items-center q-mb-lg' },
  fe = { class: 'col-12 col-sm' },
  Se = { class: 'col-12 col-sm-auto text-right' },
  pe = { class: 'row justify-center q-gutter-x-sm no-wrap' },
  ve = { class: 'cell-inner-padding' },
  _e = { class: 'cell-inner-padding' },
  Ce = { class: 'dialog-title' },
  Fe = { class: 'dialog-fields' },
  be = { class: 'dialog-field-row' },
  Me = { class: 'dialog-label' },
  Ae = { class: 'dialog-field-row' },
  Te = { class: 'dialog-label' },
  De = { class: 'dialog-field-row' },
  ye = { class: 'dialog-label' },
  Ee = { class: 'dialog-field-row' },
  Ue = { class: 'dialog-label' },
  Ne = $({
    __name: 'fin-fund-source-mananagement-page',
    setup(Oe) {
      const c = te(),
        { t: a } = oe(),
        f = r(!1),
        C = r(''),
        M = r([]),
        F = r({ page: 1, rowsPerPage: 10, rowsNumber: 0 }),
        S = r(!1),
        g = r(!1),
        b = r(null),
        A = r(!1),
        s = r({ FS_FACULTY: '', FS_ACCOUNT_CODE: '', FS_NAME: '', FS_OPEN_STATUS: !0 }),
        u = r({}),
        w = _(() =>
          g.value
            ? a('admin.fundSourceManagement.editDialog.title')
            : a('admin.fundSourceManagement.createDialog.title'),
        ),
        h = _(() =>
          g.value
            ? a('admin.fundSourceManagement.editDialog.actions.save')
            : a('admin.fundSourceManagement.createDialog.actions.save'),
        ),
        V = _(() => [
          {
            name: 'index',
            label: a('admin.fundSourceManagement.table.columns.index'),
            field: 'index',
            align: 'center',
          },
          {
            name: 'faculty',
            label: a('admin.fundSourceManagement.table.columns.faculty'),
            field: 'FS_FACULTY',
            align: 'left',
            format: (e) => e || '-',
          },
          {
            name: 'accountCode',
            label: a('admin.fundSourceManagement.table.columns.accountCode'),
            field: 'FS_ACCOUNT_CODE',
            align: 'center',
            format: (e) => e || '-',
          },
          {
            name: 'name',
            label: a('admin.fundSourceManagement.table.columns.name'),
            field: 'FS_NAME',
            align: 'left',
            format: (e) => e || '-',
          },
          {
            name: 'status',
            label: a('admin.fundSourceManagement.table.columns.status'),
            field: 'FS_OPEN_STATUS',
            align: 'center',
            format: (e) =>
              a(
                e
                  ? 'admin.fundSourceManagement.status.active'
                  : 'admin.fundSourceManagement.status.inactive',
              ),
          },
          {
            name: 'tools',
            label: a('admin.fundSourceManagement.table.columns.tools'),
            field: 'tools',
            align: 'center',
            style: 'width: 15%',
          },
        ]),
        L = _(() =>
          M.value.map((e, t) => ({ ...e, index: t + 1, FS_OPEN_STATUS: e.FS_OPEN_STATUS ?? !1 })),
        ),
        P = _(() => {
          const e = L.value;
          if (!C.value) return e;
          const t = C.value.toLowerCase();
          return e.filter(
            (o) =>
              o.FS_FACULTY.toLowerCase().includes(t) ||
              o.FS_ACCOUNT_CODE.toLowerCase().includes(t) ||
              o.FS_NAME.toLowerCase().includes(t),
          );
        }),
        T = async () => {
          f.value = !0;
          try {
            const e = await ue();
            ((M.value = e), (F.value.rowsNumber = e.length));
          } catch {
            c.notify({
              type: 'negative',
              message: a('admin.fundSourceManagement.notifications.loadError'),
              position: 'top',
            });
          } finally {
            f.value = !1;
          }
        },
        E = () => {
          ((g.value = !1),
            (b.value = null),
            (s.value = { FS_FACULTY: '', FS_ACCOUNT_CODE: '', FS_NAME: '', FS_OPEN_STATUS: !0 }),
            (u.value = {}));
        },
        Q = () => {
          (E(), (S.value = !0));
        },
        x = (e) => {
          ((g.value = !0),
            (b.value = e.FS_ID),
            (s.value = {
              FS_FACULTY: e.FS_FACULTY,
              FS_ACCOUNT_CODE: e.FS_ACCOUNT_CODE,
              FS_NAME: e.FS_NAME,
              FS_OPEN_STATUS: e.FS_OPEN_STATUS ?? !0,
            }),
            (u.value = {}),
            (S.value = !0));
        },
        D = () => {
          ((S.value = !1), E());
        },
        k = () => {
          const e = {};
          return (
            s.value.FS_FACULTY?.trim() ||
              (e.FS_FACULTY = a('admin.fundSourceManagement.createDialog.validation.faculty')),
            s.value.FS_NAME?.trim() ||
              (e.FS_NAME = a('admin.fundSourceManagement.createDialog.validation.name')),
            s.value.FS_ACCOUNT_CODE?.trim() ||
              (e.FS_ACCOUNT_CODE = a(
                'admin.fundSourceManagement.createDialog.validation.accountCode',
              )),
            (u.value = e),
            Object.keys(e).length === 0
          );
        },
        U = async () => {
          if (k()) {
            A.value = !0;
            try {
              (g.value && b.value !== null
                ? (await de(b.value, s.value),
                  c.notify({
                    type: 'positive',
                    message: a('admin.fundSourceManagement.editDialog.notifications.updated'),
                    position: 'top',
                  }))
                : (await ce(s.value),
                  c.notify({
                    type: 'positive',
                    message: a('admin.fundSourceManagement.createDialog.notifications.created'),
                    position: 'top',
                  })),
                await T(),
                D());
            } catch {
              c.notify({
                type: 'negative',
                message: g.value
                  ? a('admin.fundSourceManagement.editDialog.notifications.updateError')
                  : a('admin.fundSourceManagement.createDialog.notifications.createError'),
                position: 'top',
              });
            } finally {
              A.value = !1;
            }
          }
        },
        Y = (e) => {
          const { page: t, rowsPerPage: o } = e.pagination;
          ((F.value.page = t), (F.value.rowsPerPage = o));
        },
        B = (e) => {
          const t = M.value.find((o) => o.FS_ID === e);
          t && x(t);
        },
        q = (e) => {
          c.dialog({
            title: a('admin.fundSourceManagement.dialogs.deleteTitle'),
            message: a('admin.fundSourceManagement.dialogs.deleteMessage'),
            cancel: !0,
            persistent: !0,
          }).onOk(() => {
            (async () => {
              f.value = !0;
              try {
                (await me(e.FS_ID),
                  c.notify({
                    type: 'positive',
                    message: a('admin.fundSourceManagement.notifications.deleteSuccess'),
                    position: 'top',
                  }),
                  await T());
              } catch {
                c.notify({
                  type: 'negative',
                  message: a('admin.fundSourceManagement.notifications.deleteError'),
                  position: 'top',
                });
              } finally {
                f.value = !1;
              }
            })();
          });
        };
      return (
        j(() => {
          T();
        }),
        (e, t) => (
          z(),
          W(
            ae,
            { class: 'page-container fund-source-management-page' },
            {
              default: i(() => [
                n(ne),
                n(
                  le,
                  {
                    title: e.$t('admin.fundSourceManagement.pageTitle'),
                    subtitle: e.$t('admin.fundSourceManagement.pageDescription'),
                  },
                  null,
                  8,
                  ['title', 'subtitle'],
                ),
                l('div', ge, [
                  l('div', fe, [
                    n(
                      se,
                      {
                        modelValue: C.value,
                        'onUpdate:modelValue': t[0] || (t[0] = (o) => (C.value = o)),
                      },
                      null,
                      8,
                      ['modelValue'],
                    ),
                  ]),
                  l('div', Se, [
                    n(
                      re,
                      {
                        icon: 'add',
                        label: e.$t('admin.fundSourceManagement.createFundSource'),
                        color: 'primary',
                        class: 'create-fund-source-btn text-weight-bold',
                        onClick: Q,
                      },
                      null,
                      8,
                      ['label'],
                    ),
                  ]),
                ]),
                n(
                  ie,
                  {
                    columns: V.value,
                    rows: P.value,
                    loading: f.value,
                    pagination: F.value,
                    onRequest: Y,
                  },
                  {
                    'body-cell-tools': i(({ row: o }) => [
                      l('div', pe, [
                        n(
                          p,
                          {
                            unelevated: '',
                            dense: '',
                            color: 'blue-2',
                            'text-color': 'grey-10',
                            icon: 'edit',
                            class: 'action-btn',
                            onClick: (I) => B(o.FS_ID),
                          },
                          {
                            default: i(() => [
                              n(
                                N,
                                { class: 'bg-secondary text-white text-caption' },
                                {
                                  default: i(() => [
                                    v(d(e.$t('admin.fundSourceManagement.table.tooltips.edit')), 1),
                                  ]),
                                  _: 1,
                                },
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          ['onClick'],
                        ),
                        n(
                          p,
                          {
                            unelevated: '',
                            dense: '',
                            color: 'negative',
                            'text-color': 'white',
                            icon: 'delete',
                            class: 'action-btn',
                            onClick: (I) => q(o),
                          },
                          {
                            default: i(() => [
                              n(
                                N,
                                { class: 'bg-negative text-white text-caption' },
                                {
                                  default: i(() => [
                                    v(
                                      d(e.$t('admin.fundSourceManagement.table.tooltips.delete')),
                                      1,
                                    ),
                                  ]),
                                  _: 1,
                                },
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          ['onClick'],
                        ),
                      ]),
                    ]),
                    'body-cell-faculty': i(({ value: o }) => [l('div', ve, d(o), 1)]),
                    'body-cell-name': i(({ value: o }) => [l('div', _e, d(o), 1)]),
                    _: 1,
                  },
                  8,
                  ['columns', 'rows', 'loading', 'pagination'],
                ),
                n(
                  G,
                  {
                    modelValue: S.value,
                    'onUpdate:modelValue': t[5] || (t[5] = (o) => (S.value = o)),
                    persistent: '',
                  },
                  {
                    default: i(() => [
                      n(
                        H,
                        { class: 'form-dialog-card' },
                        {
                          default: i(() => [
                            n(
                              O,
                              { class: 'dialog-header row items-center no-wrap' },
                              {
                                default: i(() => [
                                  l('span', Ce, d(w.value), 1),
                                  n(K),
                                  n(p, {
                                    icon: 'close',
                                    flat: '',
                                    round: '',
                                    dense: '',
                                    color: 'grey-7',
                                    size: 'sm',
                                    onClick: D,
                                  }),
                                ]),
                                _: 1,
                              },
                            ),
                            n(
                              O,
                              { class: 'dialog-body' },
                              {
                                default: i(() => [
                                  n(
                                    ee,
                                    { onSubmit: R(U, ['prevent']) },
                                    {
                                      default: i(() => [
                                        l('div', Fe, [
                                          l('div', be, [
                                            l('label', Me, [
                                              v(
                                                d(
                                                  m(a)(
                                                    'admin.fundSourceManagement.createDialog.labels.faculty',
                                                  ),
                                                ) + ' ',
                                                1,
                                              ),
                                              t[6] ||
                                                (t[6] = l(
                                                  'span',
                                                  { class: 'required-star' },
                                                  '*',
                                                  -1,
                                                )),
                                            ]),
                                            n(
                                              y,
                                              {
                                                outlined: '',
                                                modelValue: s.value.FS_FACULTY,
                                                'onUpdate:modelValue':
                                                  t[1] || (t[1] = (o) => (s.value.FS_FACULTY = o)),
                                                error: !!u.value.FS_FACULTY,
                                                'error-message': u.value.FS_FACULTY,
                                                class: 'dialog-input',
                                                dense: '',
                                              },
                                              null,
                                              8,
                                              ['modelValue', 'error', 'error-message'],
                                            ),
                                          ]),
                                          l('div', Ae, [
                                            l('label', Te, [
                                              v(
                                                d(
                                                  m(a)(
                                                    'admin.fundSourceManagement.createDialog.labels.name',
                                                  ),
                                                ) + ' ',
                                                1,
                                              ),
                                              t[7] ||
                                                (t[7] = l(
                                                  'span',
                                                  { class: 'required-star' },
                                                  '*',
                                                  -1,
                                                )),
                                            ]),
                                            n(
                                              y,
                                              {
                                                outlined: '',
                                                modelValue: s.value.FS_NAME,
                                                'onUpdate:modelValue':
                                                  t[2] || (t[2] = (o) => (s.value.FS_NAME = o)),
                                                error: !!u.value.FS_NAME,
                                                'error-message': u.value.FS_NAME,
                                                class: 'dialog-input',
                                                dense: '',
                                              },
                                              null,
                                              8,
                                              ['modelValue', 'error', 'error-message'],
                                            ),
                                          ]),
                                          l('div', De, [
                                            l('label', ye, [
                                              v(
                                                d(
                                                  m(a)(
                                                    'admin.fundSourceManagement.createDialog.labels.accountCode',
                                                  ),
                                                ) + ' ',
                                                1,
                                              ),
                                              t[8] ||
                                                (t[8] = l(
                                                  'span',
                                                  { class: 'required-star' },
                                                  '*',
                                                  -1,
                                                )),
                                            ]),
                                            n(
                                              y,
                                              {
                                                outlined: '',
                                                modelValue: s.value.FS_ACCOUNT_CODE,
                                                'onUpdate:modelValue':
                                                  t[3] ||
                                                  (t[3] = (o) => (s.value.FS_ACCOUNT_CODE = o)),
                                                error: !!u.value.FS_ACCOUNT_CODE,
                                                'error-message': u.value.FS_ACCOUNT_CODE,
                                                class: 'dialog-input',
                                                dense: '',
                                              },
                                              null,
                                              8,
                                              ['modelValue', 'error', 'error-message'],
                                            ),
                                          ]),
                                          l('div', Ee, [
                                            l(
                                              'label',
                                              Ue,
                                              d(
                                                m(a)(
                                                  'admin.fundSourceManagement.createDialog.labels.status',
                                                ),
                                              ),
                                              1,
                                            ),
                                            n(
                                              X,
                                              {
                                                modelValue: s.value.FS_OPEN_STATUS,
                                                'onUpdate:modelValue':
                                                  t[4] ||
                                                  (t[4] = (o) => (s.value.FS_OPEN_STATUS = o)),
                                                type: 'radio',
                                                inline: '',
                                                color: 'black',
                                                class: 'status-radio-group',
                                                options: [
                                                  {
                                                    label: m(a)(
                                                      'admin.fundSourceManagement.createDialog.status.open',
                                                    ),
                                                    value: !0,
                                                  },
                                                  {
                                                    label: m(a)(
                                                      'admin.fundSourceManagement.createDialog.status.closed',
                                                    ),
                                                    value: !1,
                                                  },
                                                ],
                                              },
                                              null,
                                              8,
                                              ['modelValue', 'options'],
                                            ),
                                          ]),
                                        ]),
                                      ]),
                                      _: 1,
                                    },
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                            n(
                              Z,
                              { align: 'center', class: 'dialog-actions' },
                              {
                                default: i(() => [
                                  n(
                                    p,
                                    {
                                      unelevated: '',
                                      class: 'dialog-btn-cancel text-weight-medium col',
                                      label: m(a)(
                                        'admin.fundSourceManagement.createDialog.actions.cancel',
                                      ),
                                      onClick: D,
                                    },
                                    null,
                                    8,
                                    ['label'],
                                  ),
                                  n(
                                    p,
                                    {
                                      unelevated: '',
                                      color: 'primary',
                                      class: 'dialog-btn-save text-weight-medium col',
                                      label: h.value,
                                      onClick: U,
                                      loading: A.value,
                                    },
                                    null,
                                    8,
                                    ['label', 'loading'],
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    _: 1,
                  },
                  8,
                  ['modelValue'],
                ),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  }),
  Ke = J(Ne, [['__scopeId', 'data-v-892a9053']]);
export { Ke as default };
