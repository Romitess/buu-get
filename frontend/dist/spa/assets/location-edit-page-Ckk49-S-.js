import {
  O as K,
  a4 as ee,
  P as ae,
  t as oe,
  Q as A,
  _ as te,
  W as le,
  V as l,
  S as o,
  $ as M,
  T as i,
  Z as $,
  av as h,
  R as E,
  a3 as se,
  a6 as ne,
  a7 as ie,
  U as re,
  r as d,
  f as p,
  I as ue,
  aq as de,
  a2 as ce,
} from './index-CKSooU2k.js';
import { Q as me, A as ve, a as pe } from './app-walkway-position-dialog-D1dLqAq8.js';
import { Q as ge } from './QPage-CM3LWBRo.js';
import { u as we } from './vue-i18n-Bebkm_iB.js';
import { u as fe } from './use-quasar-DaOT29F-.js';
import { A as _e, a as be } from './app-breadcrumbs-C0oZOPYe.js';
import { A as C } from './app-button-D_cMl4aM.js';
import { a as he, u as ye } from './location.service-BLTYQ1bo.js';
import './QTooltip-BUG2ohUJ.js';
import './position-engine-Bv76xS6k.js';
const Se = { class: 'row q-col-gutter-md location-create-layout items-stretch' },
  Ae = { class: 'col-12 col-md-auto form-panel' },
  Oe = { class: 'form-card' },
  Le = { class: 'form-section' },
  Te = { class: 'row items-center q-mb-sm' },
  Ne = { class: 'text-h6 text-weight-bold text-black' },
  Ee = { class: 'q-gutter-y-md q-mb-md q-pt-sm' },
  ke = { class: 'buu-label-muted q-mb-xs' },
  Pe = { class: 'row q-col-gutter-sm' },
  Ie = { class: 'col-12 col-sm-7' },
  Me = { class: 'buu-label-muted q-mb-xs' },
  $e = { class: 'col-12 col-sm-5' },
  Ce = { class: 'buu-label-muted q-mb-xs' },
  Ve = { class: 'form-section' },
  Re = { class: 'row items-center q-mb-xs' },
  xe = { class: 'text-h6 text-weight-bold text-black' },
  qe = { class: 'row q-col-gutter-sm q-mb-md' },
  Be = { class: 'col-6' },
  We = { class: 'buu-label-muted q-mb-xs' },
  De = { class: 'col-6' },
  Ue = { class: 'buu-label-muted q-mb-xs' },
  Fe = { class: 'layout-setting-panel' },
  ze = { class: 'seat-direction-row' },
  Qe = { class: 'seat-direction-label' },
  Ze = { class: 'walkway-row' },
  He = { class: 'buu-label-muted' },
  Ge = { class: 'walkway-control-row' },
  Ye = { class: 'walkway-chip-label' },
  Xe = ['onClick'],
  je = { class: 'total-seats-box rounded-borders total-seats-offset' },
  Je = { class: 'total-seats-content' },
  Ke = { class: 'total-seats-value text-primary text-weight-bold' },
  ea = { class: 'total-seats-label' },
  aa = { class: 'col-12 col-md preview-panel' },
  oa = { class: 'buu-premium-card preview-card q-pa-md' },
  ta = { class: 'preview-scroll' },
  la = { class: 'row justify-end preview-actions' },
  g = 25,
  sa = K({
    __name: 'location-edit-page',
    setup(na) {
      const V = ee(),
        k = ae(),
        O = fe(),
        { t: w } = we(),
        L = Number(V.params.locationId),
        f = d(''),
        v = d(null),
        _ = d(''),
        r = d(null),
        u = d(null),
        m = d('vertical'),
        y = d(!1),
        T = d(!1),
        S = d(null),
        n = d([]),
        s = d({}),
        R = [
          {
            label: w('admin.locationManagement.createPage.fields.horizontalDirection'),
            value: 'horizontal',
          },
          {
            label: w('admin.locationManagement.createPage.fields.verticalDirection'),
            value: 'vertical',
          },
        ],
        P = p(() => (r.value || 0) * (u.value || 0)),
        x = p(() => r.value || 0),
        q = p(() => u.value || 0),
        B = p(() => n.value.length > 0),
        W = p(() => n.value.map((e) => `${e.type === 'row' ? 'row' : 'col'}-${e.index}`)),
        D = p(() =>
          n.value
            .filter((e) => e.type === 'column')
            .map((e) => e.index)
            .sort((e, a) => e - a),
        ),
        U = p(() =>
          n.value
            .filter((e) => e.type === 'row')
            .map((e) => e.index)
            .sort((e, a) => e - a),
        ),
        I = (e) => {
          if (e === '' || e === null || e === void 0) return null;
          const a = Number(e);
          return Number.isFinite(a) ? Math.min(g, Math.max(1, Math.floor(a))) : null;
        },
        b = (e) => {
          s.value[e] && (s.value = { ...s.value, [e]: void 0 });
        },
        N = (e) => e == null || String(e).trim() === '',
        F = () => {
          const e = {};
          return (
            N(f.value) && (e.roomName = 'กรุณากรอกชื่อห้องสอบ'),
            N(_.value) && (e.building = 'กรุณากรอกสถานที่/อาคาร'),
            N(v.value) && (e.floor = 'กรุณากรอกชั้นที่สอบ'),
            !r.value || r.value < 1
              ? (e.rows = 'กรุณากรอกแถว (Rows)')
              : r.value > g &&
                (e.rows = w('admin.locationManagement.createPage.validation.layoutLimit', {
                  max: g,
                })),
            !u.value || u.value < 1
              ? (e.cols = 'กรุณากรอกคอลัมน์ (Cols)')
              : u.value > g &&
                (e.cols = w('admin.locationManagement.createPage.validation.layoutLimit', {
                  max: g,
                })),
            (s.value = e),
            Object.keys(e).length === 0
          );
        },
        z = (e) => {
          const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return m.value === 'horizontal' ? (a[e - 1] ?? `${e}`) : `${e}`;
        },
        Q = (e) => {
          const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          return m.value === 'horizontal' ? `${e}` : (a[e - 1] ?? `${e}`);
        },
        Z = (e) => (e.type === 'row' ? `หลังแถว ${z(e.index)}` : `หลังคอลัมน์ ${Q(e.index)}`),
        H = (e) => {
          const [a, t] = e.split('-'),
            c = Number(t);
          return (a !== 'row' && a !== 'col') || !Number.isInteger(c)
            ? null
            : { type: a === 'row' ? 'row' : 'column', index: c };
        },
        G = (e) => {
          n.value = e.map(H).filter((a) => a !== null);
        },
        Y = (e) => {
          n.value = n.value.filter((a) => !(a.type === e.type && a.index === e.index));
        },
        X = () => S.value?.getSeatStatuses() ?? {},
        j = async () => {
          try {
            const e = await he(L);
            if (
              ((f.value = e.LOCATION_ROOM_NO || ''),
              (v.value = e.LOCATION_FLOOR_NO ?? null),
              (_.value = e.LOCATION_NAME || ''),
              (r.value = e.LOCATION_TOTAL_ROWS ?? null),
              (u.value = e.LOCATION_TOTAL_COLS ?? null),
              (m.value = e.SEAT_DIRECTION === 'HORIZONTAL' ? 'horizontal' : 'vertical'),
              (n.value = [
                ...(e.AISLE_AFTER_ROWS ?? []).map((a) => ({ type: 'row', index: a })),
                ...(e.AISLE_AFTER_COLS ?? []).map((a) => ({ type: 'column', index: a })),
              ]),
              await ue(),
              S.value)
            ) {
              const a = new Set(),
                t = new Set();
              (e.SEATS &&
                e.SEATS.forEach((c) => {
                  (c.LS_SEAT_STATUS === 1 && c.LS_SEAT_LABEL && a.add(c.LS_SEAT_LABEL),
                    c.LS_SEAT_STATUS === 2 && c.LS_SEAT_LABEL && t.add(c.LS_SEAT_LABEL));
                }),
                S.value.setSeatStatusSets({ brokenSeats: a, omittedSeats: t }));
            }
          } catch (e) {
            (console.error('Error loading location:', e),
              O.notify({
                type: 'negative',
                message: 'ไม่สามารถโหลดข้อมูลห้องสอบได้',
                position: 'top',
              }),
              k.push({ name: 'admin-location-management' }));
          }
        },
        J = async () => {
          if (F()) {
            y.value = !0;
            try {
              (await ye(L, {
                LOCATION_NAME: _.value.trim(),
                LOCATION_ROOM_NO: f.value.trim() || void 0,
                LOCATION_FLOOR_NO:
                  v.value !== null && String(v.value).trim() !== '' ? Number(v.value) : void 0,
                LOCATION_TOTAL_ROWS: Number(r.value),
                LOCATION_TOTAL_COLS: Number(u.value),
                LOCATION_SEAT_CAPACITY: Number(P.value),
                SEAT_DIRECTION: m.value === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL',
                AISLE_AFTER_COLS: D.value,
                AISLE_AFTER_ROWS: U.value,
              }),
                await de.post(`/exam-location-seats/generate/${L}`, { seatStatuses: X() }),
                O.notify({
                  type: 'positive',
                  message: w('admin.locationManagement.notifications.updateSuccess'),
                  position: 'top',
                }),
                k.push({ name: 'admin-location-management' }));
            } catch (e) {
              (console.error('Error updating location:', e),
                O.notify({
                  type: 'negative',
                  message: w('admin.locationManagement.notifications.updateError'),
                  position: 'top',
                }));
            } finally {
              y.value = !1;
            }
          }
        };
      return (
        oe(() => {
          j();
        }),
        (e, a) => (
          A(),
          te(
            ge,
            { class: 'page-container surface-page-bg' },
            {
              default: le(() => [
                l(_e),
                l(
                  be,
                  {
                    title: 'แก้ไขห้องสอบ',
                    subtitle: e.$t('admin.locationManagement.createPage.subtitle'),
                  },
                  null,
                  8,
                  ['subtitle'],
                ),
                o('div', Se, [
                  o('div', Ae, [
                    o('div', Oe, [
                      o('div', Le, [
                        o('div', Te, [
                          l(M, {
                            name: 'info_outline',
                            size: 'sm',
                            class: 'section-heading-icon q-mr-sm',
                          }),
                          o(
                            'div',
                            Ne,
                            i(e.$t('admin.locationManagement.createPage.sections.roomInfo')),
                            1,
                          ),
                        ]),
                        l($, { class: 'q-mb-md', color: 'grey-4' }),
                        o('div', Ee, [
                          o('div', null, [
                            o(
                              'div',
                              ke,
                              i(e.$t('admin.locationManagement.createPage.fields.roomName')),
                              1,
                            ),
                            l(
                              h,
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
                            o('div', Ie, [
                              o(
                                'div',
                                Me,
                                i(e.$t('admin.locationManagement.createPage.fields.building')),
                                1,
                              ),
                              l(
                                h,
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
                            o('div', $e, [
                              o(
                                'div',
                                Ce,
                                i(e.$t('admin.locationManagement.createPage.fields.floor')),
                                1,
                              ),
                              l(
                                h,
                                {
                                  modelValue: v.value,
                                  'onUpdate:modelValue': [
                                    a[4] || (a[4] = (t) => (v.value = t)),
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
                      o('div', Ve, [
                        o('div', Re, [
                          l(M, {
                            name: 'grid_view',
                            size: 'sm',
                            class: 'section-heading-icon q-mr-sm',
                          }),
                          o(
                            'div',
                            xe,
                            i(e.$t('admin.locationManagement.createPage.sections.seatLayout')),
                            1,
                          ),
                        ]),
                        l($, { class: 'q-mb-md', color: 'grey-4' }),
                        o('div', qe, [
                          o('div', Be, [
                            o(
                              'div',
                              We,
                              i(e.$t('admin.locationManagement.createPage.fields.rows')),
                              1,
                            ),
                            l(
                              h,
                              {
                                modelValue: r.value,
                                'onUpdate:modelValue': [
                                  a[6] || (a[6] = (t) => (r.value = t)),
                                  a[7] ||
                                    (a[7] = (t) => {
                                      ((r.value = I(t)), b('rows'));
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
                                max: g,
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'error', 'error-message'],
                            ),
                          ]),
                          o('div', De, [
                            o(
                              'div',
                              Ue,
                              i(e.$t('admin.locationManagement.createPage.fields.cols')),
                              1,
                            ),
                            l(
                              h,
                              {
                                modelValue: u.value,
                                'onUpdate:modelValue': [
                                  a[8] || (a[8] = (t) => (u.value = t)),
                                  a[9] ||
                                    (a[9] = (t) => {
                                      ((u.value = I(t)), b('cols'));
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
                                max: g,
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'error', 'error-message'],
                            ),
                          ]),
                        ]),
                        o('div', Fe, [
                          o('div', ze, [
                            o(
                              'div',
                              Qe,
                              i(
                                e.$t(
                                  'admin.locationManagement.createPage.fields.seatNumberDirection',
                                ),
                              ),
                              1,
                            ),
                            l(
                              me,
                              {
                                modelValue: m.value,
                                'onUpdate:modelValue': a[10] || (a[10] = (t) => (m.value = t)),
                                dense: '',
                                unelevated: '',
                                'toggle-color': 'primary',
                                'toggle-text-color': 'white',
                                color: 'grey-3',
                                'text-color': 'dark',
                                options: R,
                                class: 'layout-direction-toggle',
                              },
                              null,
                              8,
                              ['modelValue'],
                            ),
                          ]),
                        ]),
                        o('div', Ze, [
                          o(
                            'div',
                            He,
                            i(e.$t('admin.locationManagement.createPage.fields.walkway')),
                            1,
                          ),
                          o('div', Ge, [
                            n.value.length > 0
                              ? (A(),
                                E(
                                  'div',
                                  {
                                    key: 0,
                                    class: se([
                                      'walkway-chip-row',
                                      { 'walkway-chip-row--scroll': n.value.length > 2 },
                                    ]),
                                  },
                                  [
                                    (A(!0),
                                    E(
                                      ne,
                                      null,
                                      ie(
                                        n.value,
                                        (t) => (
                                          A(),
                                          E(
                                            'div',
                                            { key: `${t.type}-${t.index}`, class: 'walkway-chip' },
                                            [
                                              o('span', Ye, i(Z(t)), 1),
                                              o(
                                                'button',
                                                {
                                                  type: 'button',
                                                  class: 'walkway-chip-remove',
                                                  'aria-label': 'Remove walkway',
                                                  onClick: (c) => Y(t),
                                                },
                                                ' × ',
                                                8,
                                                Xe,
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
                              : re('', !0),
                            l(
                              C,
                              {
                                outline: '',
                                dense: '',
                                'no-caps': '',
                                color: 'primary',
                                icon: 'add',
                                label: e.$t(
                                  'admin.locationManagement.createPage.actions.addWalkway',
                                ),
                                class: 'walkway-add-btn',
                                onClick: a[11] || (a[11] = (t) => (T.value = !0)),
                              },
                              null,
                              8,
                              ['label'],
                            ),
                          ]),
                        ]),
                        o('div', je, [
                          o('div', Je, [
                            o('div', Ke, i(P.value), 1),
                            o(
                              'div',
                              ea,
                              i(e.$t('admin.locationManagement.createPage.totalSeats')),
                              1,
                            ),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                  o('div', aa, [
                    o('div', oa, [
                      o('div', ta, [
                        l(
                          ve,
                          {
                            ref_key: 'seatPreviewRef',
                            ref: S,
                            rows: r.value,
                            cols: u.value,
                            'split-left-right': B.value,
                            'walkway-positions': n.value,
                            'numbering-direction': m.value,
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
                    o('div', la, [
                      l(
                        C,
                        {
                          label: e.$t('admin.locationManagement.createPage.actions.save'),
                          color: 'primary',
                          class: 'text-weight-bold q-px-xl',
                          style: { 'border-radius': '8px', 'min-width': '140px' },
                          loading: y.value,
                          disable: y.value,
                          onClick: J,
                        },
                        null,
                        8,
                        ['label', 'loading', 'disable'],
                      ),
                    ]),
                  ]),
                ]),
                l(
                  pe,
                  {
                    modelValue: T.value,
                    'onUpdate:modelValue': a[12] || (a[12] = (t) => (T.value = t)),
                    rows: x.value,
                    cols: q.value,
                    'numbering-direction': m.value,
                    'selected-positions': W.value,
                    onConfirm: G,
                  },
                  null,
                  8,
                  ['modelValue', 'rows', 'cols', 'numbering-direction', 'selected-positions'],
                ),
              ]),
              _: 1,
            },
          )
        )
      );
    },
  }),
  fa = ce(sa, [['__scopeId', 'data-v-f2f0e2ac']]);
export { fa as default };
