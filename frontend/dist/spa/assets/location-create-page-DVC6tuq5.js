import {
  O as X,
  P as j,
  Q as y,
  _ as J,
  W as K,
  V as l,
  S as o,
  $ as V,
  T as n,
  Z as S,
  av as w,
  R as k,
  a3 as ee,
  a6 as ae,
  a7 as oe,
  U as te,
  r as i,
  f as m,
  a2 as le,
} from './index-CKSooU2k.js';
import { Q as se, A as ne, a as re } from './app-walkway-position-dialog-D1dLqAq8.js';
import { Q as ie } from './QPage-CM3LWBRo.js';
import { u as ue } from './vue-i18n-Bebkm_iB.js';
import { u as de } from './use-quasar-DaOT29F-.js';
import { A as ce, a as me } from './app-breadcrumbs-C0oZOPYe.js';
import { A as C } from './app-button-D_cMl4aM.js';
import { c as ve } from './location.service-BLTYQ1bo.js';
import './QTooltip-BUG2ohUJ.js';
import './position-engine-Bv76xS6k.js';
const ge = { class: 'row q-col-gutter-md location-create-layout items-stretch' },
  pe = { class: 'col-12 col-md-auto form-panel' },
  be = { class: 'form-card' },
  we = { class: 'form-section' },
  fe = { class: 'row items-center q-mb-sm' },
  _e = { class: 'text-h6 text-weight-bold text-black' },
  he = { class: 'q-gutter-y-md q-mb-md q-pt-sm' },
  ye = { class: 'buu-label-muted q-mb-xs' },
  Pe = { class: 'row q-col-gutter-sm' },
  Ae = { class: 'col-12 col-sm-7' },
  Oe = { class: 'buu-label-muted q-mb-xs' },
  ke = { class: 'col-12 col-sm-5' },
  Me = { class: 'buu-label-muted q-mb-xs' },
  $e = { class: 'form-section' },
  Le = { class: 'row items-center q-mb-xs' },
  Ne = { class: 'text-h6 text-weight-bold text-black' },
  Ve = { class: 'row q-col-gutter-sm q-mb-md' },
  Se = { class: 'col-6' },
  Ce = { class: 'buu-label-muted q-mb-xs' },
  Te = { class: 'col-6' },
  Ie = { class: 'buu-label-muted q-mb-xs' },
  Re = { class: 'layout-setting-panel' },
  qe = { class: 'seat-direction-row' },
  Ee = { class: 'seat-direction-label' },
  xe = { class: 'walkway-row' },
  We = { class: 'buu-label-muted' },
  Be = { class: 'walkway-control-row' },
  De = { class: 'walkway-chip-label' },
  Qe = ['onClick'],
  Ue = { class: 'total-seats-box rounded-borders total-seats-offset' },
  ze = { class: 'total-seats-content' },
  Fe = { class: 'total-seats-value text-primary text-weight-bold' },
  Ze = { class: 'total-seats-label' },
  Ge = { class: 'col-12 col-md preview-panel' },
  He = { class: 'buu-premium-card preview-card q-pa-md' },
  Ye = { class: 'preview-scroll' },
  Xe = { class: 'row justify-end preview-actions' },
  v = 25,
  je = X({
    __name: 'location-create-page',
    setup(Je) {
      const T = j(),
        M = de(),
        { t: g } = ue(),
        f = i(''),
        p = i(null),
        _ = i(''),
        u = i(null),
        d = i(null),
        c = i('vertical'),
        h = i(!1),
        P = i(!1),
        r = i([]),
        $ = i(null),
        s = i({}),
        I = [
          {
            label: g('admin.locationManagement.createPage.fields.horizontalDirection'),
            value: 'horizontal',
          },
          {
            label: g('admin.locationManagement.createPage.fields.verticalDirection'),
            value: 'vertical',
          },
        ],
        L = m(() => (u.value || 0) * (d.value || 0)),
        R = m(() => u.value || 0),
        q = m(() => d.value || 0),
        E = m(() => r.value.length > 0),
        x = m(() => r.value.map((e) => `${e.type === 'row' ? 'row' : 'col'}-${e.index}`)),
        W = m(() =>
          r.value
            .filter((e) => e.type === 'column')
            .map((e) => e.index)
            .sort((e, a) => e - a),
        ),
        B = m(() =>
          r.value
            .filter((e) => e.type === 'row')
            .map((e) => e.index)
            .sort((e, a) => e - a),
        ),
        N = (e) => {
          if (e === '' || e === null || e === void 0) return null;
          const a = Number(e);
          return Number.isFinite(a) ? Math.min(v, Math.max(1, Math.floor(a))) : null;
        },
        b = (e) => {
          s.value[e] && (s.value = { ...s.value, [e]: void 0 });
        },
        A = (e) => e == null || String(e).trim() === '',
        D = () => {
          const e = {};
          return (
            A(f.value) && (e.roomName = 'กรุณากรอกชื่อห้องสอบ'),
            A(_.value) && (e.building = 'กรุณากรอกสถานที่/อาคาร'),
            A(p.value) && (e.floor = 'กรุณากรอกชั้นที่สอบ'),
            !u.value || u.value < 1
              ? (e.rows = 'กรุณากรอกแถว (Rows)')
              : u.value > v &&
                (e.rows = g('admin.locationManagement.createPage.validation.layoutLimit', {
                  max: v,
                })),
            !d.value || d.value < 1
              ? (e.cols = 'กรุณากรอกคอลัมน์ (Cols)')
              : d.value > v &&
                (e.cols = g('admin.locationManagement.createPage.validation.layoutLimit', {
                  max: v,
                })),
            (s.value = e),
            Object.keys(e).length === 0
          );
        },
        Q = (e) => {
          const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return c.value === 'horizontal' ? (a[e - 1] ?? `${e}`) : `${e}`;
        },
        U = (e) => {
          const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return c.value === 'horizontal' ? `${e}` : (a[e - 1] ?? `${e}`);
        },
        z = (e) => (e.type === 'row' ? `หลังแถว ${Q(e.index)}` : `หลังคอลัมน์ ${U(e.index)}`),
        F = (e) => {
          const [a, t] = e.split('-'),
            O = Number(t);
          return (a !== 'row' && a !== 'col') || !Number.isInteger(O)
            ? null
            : { type: a === 'row' ? 'row' : 'column', index: O };
        },
        Z = (e) => {
          r.value = e.map(F).filter((a) => a !== null);
        },
        G = (e) => {
          r.value = r.value.filter((a) => !(a.type === e.type && a.index === e.index));
        },
        H = () => $.value?.getSeatStatuses() ?? {},
        Y = async () => {
          if (D()) {
            h.value = !0;
            try {
              (await ve(
                {
                  LOCATION_NAME: _.value.trim(),
                  LOCATION_ROOM_NO: f.value.trim() || void 0,
                  LOCATION_FLOOR_NO:
                    p.value !== null && String(p.value).trim() !== '' ? Number(p.value) : void 0,
                  LOCATION_TOTAL_ROWS: Number(u.value),
                  LOCATION_TOTAL_COLS: Number(d.value),
                  LOCATION_SEAT_CAPACITY: Number(L.value),
                  SEAT_LABEL_FORMAT: 'ROW_COL',
                  SEAT_DIRECTION: c.value === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL',
                  AISLE_AFTER_COLS: W.value,
                  AISLE_AFTER_ROWS: B.value,
                },
                H(),
              ),
                M.notify({
                  type: 'positive',
                  message: g('admin.locationManagement.notifications.createSuccess'),
                  position: 'top',
                }),
                T.push({ name: 'admin-location-management' }));
            } catch (e) {
              (console.error('Error creating location:', e),
                M.notify({
                  type: 'negative',
                  message: g('admin.locationManagement.notifications.createError'),
                  position: 'top',
                }));
            } finally {
              h.value = !1;
            }
          }
        };
      return (e, a) => (
        y(),
        J(
          ie,
          { class: 'page-container surface-page-bg' },
          {
            default: K(() => [
              l(ce),
              l(
                me,
                {
                  title: e.$t('admin.locationManagement.createPage.title'),
                  subtitle: e.$t('admin.locationManagement.createPage.subtitle'),
                },
                null,
                8,
                ['title', 'subtitle'],
              ),
              o('div', ge, [
                o('div', pe, [
                  o('div', be, [
                    o('div', we, [
                      o('div', fe, [
                        l(V, {
                          name: 'info_outline',
                          size: 'sm',
                          class: 'section-heading-icon q-mr-sm',
                        }),
                        o(
                          'div',
                          _e,
                          n(e.$t('admin.locationManagement.createPage.sections.roomInfo')),
                          1,
                        ),
                      ]),
                      l(S, { class: 'q-mb-md', color: 'grey-4' }),
                      o('div', he, [
                        o('div', null, [
                          o(
                            'div',
                            ye,
                            n(e.$t('admin.locationManagement.createPage.fields.roomName')),
                            1,
                          ),
                          l(
                            w,
                            {
                              modelValue: f.value,
                              'onUpdate:modelValue': [
                                a[0] || (a[0] = (t) => (f.value = t)),
                                a[1] || (a[1] = (t) => b('roomName')),
                              ],
                              outlined: '',
                              dense: '',
                              placeholder: e.$t(
                                'admin.locationManagement.createPage.placeholders.roomName',
                              ),
                              class: 'buu-input-muted',
                              error: !!s.value.roomName,
                              'error-message': s.value.roomName,
                            },
                            null,
                            8,
                            ['modelValue', 'placeholder', 'error', 'error-message'],
                          ),
                        ]),
                        o('div', Pe, [
                          o('div', Ae, [
                            o(
                              'div',
                              Oe,
                              n(e.$t('admin.locationManagement.createPage.fields.building')),
                              1,
                            ),
                            l(
                              w,
                              {
                                modelValue: _.value,
                                'onUpdate:modelValue': [
                                  a[2] || (a[2] = (t) => (_.value = t)),
                                  a[3] || (a[3] = (t) => b('building')),
                                ],
                                outlined: '',
                                dense: '',
                                placeholder: e.$t(
                                  'admin.locationManagement.createPage.placeholders.building',
                                ),
                                class: 'buu-input-muted',
                                error: !!s.value.building,
                                'error-message': s.value.building,
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'error', 'error-message'],
                            ),
                          ]),
                          o('div', ke, [
                            o(
                              'div',
                              Me,
                              n(e.$t('admin.locationManagement.createPage.fields.floor')),
                              1,
                            ),
                            l(
                              w,
                              {
                                modelValue: p.value,
                                'onUpdate:modelValue': [
                                  a[4] || (a[4] = (t) => (p.value = t)),
                                  a[5] || (a[5] = (t) => b('floor')),
                                ],
                                type: 'number',
                                outlined: '',
                                dense: '',
                                placeholder: e.$t(
                                  'admin.locationManagement.createPage.placeholders.floor',
                                ),
                                class: 'buu-input-muted',
                                error: !!s.value.floor,
                                'error-message': s.value.floor,
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'error', 'error-message'],
                            ),
                          ]),
                        ]),
                      ]),
                    ]),
                    o('div', $e, [
                      o('div', Le, [
                        l(V, {
                          name: 'grid_view',
                          size: 'sm',
                          class: 'section-heading-icon q-mr-sm',
                        }),
                        o(
                          'div',
                          Ne,
                          n(e.$t('admin.locationManagement.createPage.sections.seatLayout')),
                          1,
                        ),
                      ]),
                      l(S, { class: 'q-mb-md', color: 'grey-4' }),
                      o('div', Ve, [
                        o('div', Se, [
                          o(
                            'div',
                            Ce,
                            n(e.$t('admin.locationManagement.createPage.fields.rows')),
                            1,
                          ),
                          l(
                            w,
                            {
                              modelValue: u.value,
                              'onUpdate:modelValue': [
                                a[6] || (a[6] = (t) => (u.value = t)),
                                a[7] ||
                                  (a[7] = (t) => {
                                    ((u.value = N(t)), b('rows'));
                                  }),
                              ],
                              modelModifiers: { number: !0 },
                              type: 'number',
                              outlined: '',
                              dense: '',
                              placeholder: e.$t(
                                'admin.locationManagement.createPage.placeholders.rows',
                              ),
                              class: 'buu-input-muted',
                              error: !!s.value.rows,
                              'error-message': s.value.rows,
                              min: '1',
                              max: v,
                            },
                            null,
                            8,
                            ['modelValue', 'placeholder', 'error', 'error-message'],
                          ),
                        ]),
                        o('div', Te, [
                          o(
                            'div',
                            Ie,
                            n(e.$t('admin.locationManagement.createPage.fields.cols')),
                            1,
                          ),
                          l(
                            w,
                            {
                              modelValue: d.value,
                              'onUpdate:modelValue': [
                                a[8] || (a[8] = (t) => (d.value = t)),
                                a[9] ||
                                  (a[9] = (t) => {
                                    ((d.value = N(t)), b('cols'));
                                  }),
                              ],
                              modelModifiers: { number: !0 },
                              type: 'number',
                              outlined: '',
                              dense: '',
                              placeholder: e.$t(
                                'admin.locationManagement.createPage.placeholders.cols',
                              ),
                              class: 'buu-input-muted',
                              error: !!s.value.cols,
                              'error-message': s.value.cols,
                              min: '1',
                              max: v,
                            },
                            null,
                            8,
                            ['modelValue', 'placeholder', 'error', 'error-message'],
                          ),
                        ]),
                      ]),
                      o('div', Re, [
                        o('div', qe, [
                          o(
                            'div',
                            Ee,
                            n(
                              e.$t(
                                'admin.locationManagement.createPage.fields.seatNumberDirection',
                              ),
                            ),
                            1,
                          ),
                          l(
                            se,
                            {
                              modelValue: c.value,
                              'onUpdate:modelValue': a[10] || (a[10] = (t) => (c.value = t)),
                              dense: '',
                              unelevated: '',
                              'toggle-color': 'primary',
                              'toggle-text-color': 'white',
                              color: 'grey-3',
                              'text-color': 'dark',
                              options: I,
                              class: 'layout-direction-toggle',
                            },
                            null,
                            8,
                            ['modelValue'],
                          ),
                        ]),
                      ]),
                      o('div', xe, [
                        o(
                          'div',
                          We,
                          n(e.$t('admin.locationManagement.createPage.fields.walkway')),
                          1,
                        ),
                        o('div', Be, [
                          r.value.length > 0
                            ? (y(),
                              k(
                                'div',
                                {
                                  key: 0,
                                  class: ee([
                                    'walkway-chip-row',
                                    { 'walkway-chip-row--scroll': r.value.length > 2 },
                                  ]),
                                },
                                [
                                  (y(!0),
                                  k(
                                    ae,
                                    null,
                                    oe(
                                      r.value,
                                      (t) => (
                                        y(),
                                        k(
                                          'div',
                                          { key: `${t.type}-${t.index}`, class: 'walkway-chip' },
                                          [
                                            o('span', De, n(z(t)), 1),
                                            o(
                                              'button',
                                              {
                                                type: 'button',
                                                class: 'walkway-chip-remove',
                                                'aria-label': 'Remove walkway',
                                                onClick: (O) => G(t),
                                              },
                                              ' × ',
                                              8,
                                              Qe,
                                            ),
                                          ],
                                        )
                                      ),
                                    ),
                                    128,
                                  )),
                                ],
                                2,
                              ))
                            : te('', !0),
                          l(
                            C,
                            {
                              outline: '',
                              dense: '',
                              'no-caps': '',
                              color: 'primary',
                              icon: 'add',
                              label: e.$t('admin.locationManagement.createPage.actions.addWalkway'),
                              class: 'walkway-add-btn',
                              onClick: a[11] || (a[11] = (t) => (P.value = !0)),
                            },
                            null,
                            8,
                            ['label'],
                          ),
                        ]),
                      ]),
                      o('div', Ue, [
                        o('div', ze, [
                          o('div', Fe, n(L.value), 1),
                          o(
                            'div',
                            Ze,
                            n(e.$t('admin.locationManagement.createPage.totalSeats')),
                            1,
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
                o('div', Ge, [
                  o('div', He, [
                    o('div', Ye, [
                      l(
                        ne,
                        {
                          ref_key: 'seatPreviewRef',
                          ref: $,
                          rows: u.value,
                          cols: d.value,
                          'split-left-right': E.value,
                          'walkway-positions': r.value,
                          'numbering-direction': c.value,
                          'show-seat-guides': !0,
                          'show-footer-hint': !0,
                        },
                        null,
                        8,
                        [
                          'rows',
                          'cols',
                          'split-left-right',
                          'walkway-positions',
                          'numbering-direction',
                        ],
                      ),
                    ]),
                  ]),
                  o('div', Xe, [
                    l(
                      C,
                      {
                        label: e.$t('admin.locationManagement.createPage.actions.save'),
                        color: 'primary',
                        class: 'text-weight-bold q-px-xl',
                        style: { 'border-radius': '8px', 'min-width': '140px' },
                        loading: h.value,
                        disable: h.value,
                        onClick: Y,
                      },
                      null,
                      8,
                      ['label', 'loading', 'disable'],
                    ),
                  ]),
                ]),
              ]),
              l(
                re,
                {
                  modelValue: P.value,
                  'onUpdate:modelValue': a[12] || (a[12] = (t) => (P.value = t)),
                  rows: R.value,
                  cols: q.value,
                  'numbering-direction': c.value,
                  'selected-positions': x.value,
                  onConfirm: Z,
                },
                null,
                8,
                ['modelValue', 'rows', 'cols', 'numbering-direction', 'selected-positions'],
              ),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  ua = le(je, [['__scopeId', 'data-v-a8bd8505']]);
export { ua as default };
