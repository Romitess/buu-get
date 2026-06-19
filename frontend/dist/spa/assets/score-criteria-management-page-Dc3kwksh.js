import {
  O as X,
  Q as c,
  R as m,
  S as e,
  V as o,
  a8 as b,
  aE as g,
  $ as y,
  Z as k,
  a6 as S,
  a7 as C,
  U as $,
  r as q,
  T as n,
  a2 as M,
  aq as B,
  P as E,
  t as N,
  _ as A,
  W as D,
  av as u,
} from './index-CKSooU2k.js';
import { Q as I } from './QPage-CM3LWBRo.js';
import { u as O } from './use-quasar-DaOT29F-.js';
import { u as G } from './vue-i18n-Bebkm_iB.js';
import { A as j, a as L } from './app-breadcrumbs-C0oZOPYe.js';
import { A as w } from './app-button-D_cMl4aM.js';
const P = { class: 'q-pa-md page-container-test' },
  Q = { class: 'row justify-end q-mb-md no-print' },
  F = { class: 'report-card' },
  J = { class: 'report-body relative-position' },
  z = { class: 'row q-col-gutter-lg items-stretch content-container' },
  H = { class: 'col-12 col-sm-4 flex flex-center column' },
  W = { class: 'profile-photo-wrapper shadow-1' },
  K = { class: 'col-12 col-sm-8 detail-grid-column' },
  Y = { class: 'row q-col-gutter-y-sm full-height items-center' },
  Z = { class: 'col-12 q-mt-md' },
  ee = { class: 'score-section' },
  te = { class: 'report-footer row justify-between items-center no-wrap' },
  ae = { class: 'col-auto text-right' },
  se = { class: 'band-desc-block q-mt-lg' },
  oe = { class: 'band-desc-box relative-position' },
  ie = { class: 'band-desc-section' },
  ne = { class: 'band-table-container' },
  re = { class: 'band-table' },
  de = { class: 'text-center text-weight-bold' },
  le = { class: 'text-center' },
  ce = { class: 'text-center' },
  me = { class: 'text-left descriptor-cell' },
  ve = { key: 0 },
  pe = X({
    __name: 'certificate-preview-report',
    props: { bandRules: {} },
    setup(v) {
      const f = q(null),
        p = () => {
          window.print();
        };
      return (h, t) => (
        c(),
        m('div', P, [
          e('div', Q, [
            o(
              b,
              {
                color: 'primary',
                icon: 'print',
                label: h.$t('exam.voucher.print'),
                class: 'print-btn shadow-2 text-weight-bold',
                onClick: p,
              },
              null,
              8,
              ['label'],
            ),
          ]),
          e(
            'div',
            { ref_key: 'reportRef', ref: f, class: 'report-wrapper' },
            [
              e('div', F, [
                t[6] ||
                  (t[6] = g(
                    '<div class="report-header row items-center no-wrap" data-v-4f20478f><div class="col-auto" data-v-4f20478f><img src="icons/logo-vocher.png" class="header-logo" alt="BUULI Logo" data-v-4f20478f></div><div class="col text-center" data-v-4f20478f><h1 class="header-title" data-v-4f20478f>BUU-GET: Burapha University&#39;s Graduate English Test</h1><h2 class="header-subtitle" data-v-4f20478f>Test Taker Score Report</h2></div></div>',
                    1,
                  )),
                e('div', J, [
                  t[4] || (t[4] = e('div', { class: 'watermark-bg no-pointer-events' }, 'GET', -1)),
                  e('div', z, [
                    e('div', H, [
                      e('div', W, [o(y, { name: 'image', size: '48px', color: 'grey-5' })]),
                      t[0] ||
                        (t[0] = e(
                          'div',
                          { class: 'photo-name text-weight-bold text-primary q-mt-sm' },
                          'XX. XXXXX XXXXXX',
                          -1,
                        )),
                    ]),
                    e('div', K, [
                      e('div', Y, [
                        t[3] ||
                          (t[3] = g(
                            '<div class="col-12 col-sm-6 detail-group" data-v-4f20478f><div class="info-group" data-v-4f20478f><label class="info-label" data-v-4f20478f>Test Taker ID:</label><div class="info-value" data-v-4f20478f>XXXXXXXXX</div></div><div class="info-group" data-v-4f20478f><label class="info-label" data-v-4f20478f>Citizen ID:</label><div class="info-value" data-v-4f20478f>X-XXXX-XXXXX-XX-X</div></div></div><div class="col-12 col-sm-6 detail-group" data-v-4f20478f><div class="info-group" data-v-4f20478f><label class="info-label" data-v-4f20478f>Test Session:</label><div class="info-value" data-v-4f20478f>X/XXXX</div></div><div class="info-group" data-v-4f20478f><label class="info-label" data-v-4f20478f>Test Date:</label><div class="info-value" data-v-4f20478f>XX XXX XXXX</div></div></div>',
                            2,
                          )),
                        e('div', Z, [
                          e('div', ee, [
                            t[1] ||
                              (t[1] = g(
                                '<div class="score-header q-mb-xs" data-v-4f20478f>Score</div><div class="row justify-between items-center q-py-xs score-row" data-v-4f20478f><div class="score-label" data-v-4f20478f>1. Vocabulary &amp; Grammar</div><div class="score-val" data-v-4f20478f>XX/50</div></div><div class="row justify-between items-center q-py-xs score-row" data-v-4f20478f><div class="score-label" data-v-4f20478f>2. Reading</div><div class="score-val" data-v-4f20478f>XX/50</div></div><div class="row justify-between items-center q-py-xs score-row" data-v-4f20478f><div class="score-label" data-v-4f20478f>Overall BUU-GET Score</div><div class="score-val text-weight-bold" data-v-4f20478f>XXX/100</div></div>',
                                4,
                              )),
                            o(k, { class: 'score-separator q-my-xs' }),
                            t[2] ||
                              (t[2] = e(
                                'div',
                                {
                                  class: 'row justify-between items-center q-py-xs score-row-level',
                                },
                                [
                                  e('div', { class: 'score-label' }, 'Level'),
                                  e('div', { class: 'row no-wrap score-level-val' }, [
                                    e('div', { class: 'q-mr-xl' }, 'Band'),
                                    e('div', null, 'X'),
                                  ]),
                                ],
                                -1,
                              )),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
                e('div', te, [
                  t[5] ||
                    (t[5] = g(
                      '<div class="col row q-col-gutter-x-xl metadata-group" data-v-4f20478f><div class="col-auto text-left" data-v-4f20478f><div class="metadata-label" data-v-4f20478f>Report Issue Date:</div><div class="metadata-value" data-v-4f20478f>XX XXX XXXX</div></div><div class="col-auto text-left" data-v-4f20478f><div class="metadata-label" data-v-4f20478f>Score Valid Until:</div><div class="metadata-value" data-v-4f20478f>XX XXX XXXX</div></div></div>',
                      1,
                    )),
                  e('div', ae, [
                    o(y, { name: 'qr_code_2', size: '48px', color: 'dark', class: 'qr-code-icon' }),
                  ]),
                ]),
              ]),
              e('div', se, [
                e('div', oe, [
                  t[11] ||
                    (t[11] = e('div', { class: 'watermark-bg no-pointer-events' }, 'GET', -1)),
                  e('div', ie, [
                    t[9] ||
                      (t[9] = e(
                        'h3',
                        { class: 'band-desc-title text-center text-weight-bold q-mb-md' },
                        ' BUU GET Band Description ',
                        -1,
                      )),
                    e('div', ne, [
                      e('table', re, [
                        t[8] ||
                          (t[8] = e(
                            'thead',
                            null,
                            [
                              e('tr', null, [
                                e('th', { class: 'text-center', style: { width: '10%' } }, 'Band'),
                                e('th', { class: 'text-center', style: { width: '15%' } }, 'Score'),
                                e('th', { class: 'text-center', style: { width: '12%' } }, 'CEFR'),
                                e('th', { class: 'text-center' }, 'Performance Descriptor'),
                              ]),
                            ],
                            -1,
                          )),
                        e('tbody', null, [
                          (c(!0),
                          m(
                            S,
                            null,
                            C(
                              v.bandRules,
                              (r) => (
                                c(),
                                m('tr', { key: r.id }, [
                                  e('td', de, n(r.band), 1),
                                  e('td', le, n(r.minScore) + '-' + n(r.maxScore), 1),
                                  e('td', ce, n(r.cefr), 1),
                                  e('td', me, n(r.descriptor), 1),
                                ])
                              ),
                            ),
                            128,
                          )),
                          v.bandRules.length
                            ? $('', !0)
                            : (c(),
                              m('tr', ve, [
                                ...(t[7] ||
                                  (t[7] = [
                                    e(
                                      'td',
                                      { colspan: '4', class: 'text-center text-grey-6 py-md' },
                                      ' No band descriptions defined ',
                                      -1,
                                    ),
                                  ])),
                              ])),
                        ]),
                      ]),
                    ]),
                    t[10] ||
                      (t[10] = e(
                        'p',
                        { class: 'band-table-note text-left q-mt-md italic' },
                        ' The performance descriptor is taken from CEFR Overall Reading Comprehension Scale ',
                        -1,
                      )),
                  ]),
                ]),
              ]),
            ],
            512,
          ),
        ])
      );
    },
  }),
  ue = M(pe, [['__scopeId', 'data-v-4f20478f']]),
  fe = async () => (await B.get('/score-criteria/band-rules')).data,
  ge = async (v) => (await B.put('/score-criteria/band-rules', { bandRules: v })).data,
  he = { class: 'score-criteria-grid row q-col-gutter-lg' },
  be = { class: 'col-12 col-md-6' },
  xe = { class: 'section-card section-card--scrollable' },
  ye = { class: 'section-title' },
  we = { class: 'scrollable-content' },
  _e = { class: 'admin-cert-preview' },
  Xe = { class: 'col-12 col-md-6' },
  Se = { class: 'section-card' },
  Ce = { class: 'section-title' },
  $e = { class: 'row items-center table-header-row text-weight-bold q-mb-sm text-grey-8 no-wrap' },
  qe = { class: 'text-center', style: { width: '50px', 'margin-right': '12px' } },
  Me = { class: 'text-center', style: { width: '140px', 'margin-right': '12px' } },
  Be = { class: 'text-center', style: { width: '60px', 'margin-right': '12px' } },
  Ve = { class: 'text-center col', style: { 'margin-right': '12px' } },
  Re = { class: 'band-rules-list' },
  Te = {
    class: 'text-weight-bold text-grey-7 text-center',
    style: { width: '24px', 'margin-right': '8px' },
  },
  Ue = { style: { width: '50px', 'margin-right': '12px' } },
  ke = { class: 'row items-center no-wrap', style: { width: '140px', 'margin-right': '12px' } },
  Ee = { style: { width: '60px', 'margin-right': '12px' } },
  Ne = { class: 'col', style: { 'margin-right': '12px' } },
  Ae = { style: { width: '40px' } },
  De = { key: 0, class: 'text-center q-py-lg text-grey-5 border-dashed rounded-lg' },
  Ie = { class: 'action-bar row justify-end q-mt-xl q-gutter-md' },
  Oe = 'buu-get-band-rules',
  _ = 100,
  Ge = 9,
  je = X({
    __name: 'score-criteria-management-page',
    setup(v) {
      const f = { cefr: 'B2', descriptor: 'New performance descriptor text...' },
        p = [
          {
            id: '1',
            band: '1',
            minScore: 40,
            maxScore: 49,
            cefr: 'A2',
            descriptor:
              'Can understand short, simple texts on familiar matters of a concrete type which consist of high frequency every day or job-related language.',
          },
          {
            id: '2',
            band: '2',
            minScore: 50,
            maxScore: 59,
            cefr: 'A2',
            descriptor:
              'Can understand short, simple texts on familiar matters of a concrete type which consist of high frequency every day or job-related language.',
          },
          {
            id: '3',
            band: '3',
            minScore: 60,
            maxScore: 69,
            cefr: 'B1',
            descriptor:
              'Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension.',
          },
          {
            id: '4',
            band: '4',
            minScore: 70,
            maxScore: 79,
            cefr: 'B1',
            descriptor:
              'Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension.',
          },
          {
            id: '5',
            band: '5',
            minScore: 80,
            maxScore: 100,
            cefr: 'B2',
            descriptor:
              'Can read with a large degree of independence, adapting style and speed of reading to different texts and purposes, and using appropriate reference sources selectively. Has a broad active reading vocabulary, but may experience some difficulty with low frequency idioms.',
          },
        ],
        h = E(),
        t = O(),
        { t: r } = G(),
        i = q([]);
      N(async () => {
        try {
          const a = await fe();
          a.bandRules && a.bandRules.length > 0
            ? (i.value = a.bandRules)
            : (i.value = JSON.parse(JSON.stringify(p)));
        } catch {
          try {
            const a = localStorage.getItem(Oe);
            i.value = JSON.parse(a || JSON.stringify(p));
          } catch (a) {
            (console.error('Failed to load band rules from localStorage', a),
              (i.value = JSON.parse(JSON.stringify(p))));
          }
        }
      });
      const V = () => {
          const a = i.value[i.value.length - 1],
            d = a ? Math.min(_, a.maxScore + 1) : 0,
            s = Math.min(_, d + Ge);
          i.value.push({
            id: String(Date.now()),
            band: String(i.value.length + 1),
            minScore: d,
            maxScore: s,
            ...f,
          });
        },
        R = (a) => {
          i.value.splice(a, 1);
        },
        T = () => {
          h.back();
        },
        U = async () => {
          if (
            i.value.some(
              (s) =>
                typeof s.minScore != 'number' ||
                typeof s.maxScore != 'number' ||
                s.minScore < 0 ||
                s.maxScore < 0 ||
                s.minScore > 100 ||
                s.maxScore > 100,
            )
          ) {
            t.notify({
              type: 'negative',
              message: r('admin.scoreCriteriaManagement.notifications.invalidScore'),
              position: 'top',
            });
            return;
          }
          if (i.value.some((s) => s.minScore > s.maxScore)) {
            t.notify({
              type: 'negative',
              message: r('admin.scoreCriteriaManagement.notifications.minGreaterThanMax'),
              position: 'top',
            });
            return;
          }
          try {
            (await ge(i.value),
              t.notify({
                type: 'positive',
                message: r('admin.scoreCriteriaManagement.notifications.saveSuccess'),
                position: 'top',
              }));
          } catch (s) {
            (console.error(s),
              t.notify({
                type: 'negative',
                message: r('admin.scoreCriteriaManagement.notifications.saveError'),
                position: 'top',
              }));
          }
        };
      return (a, d) => (
        c(),
        A(
          I,
          { class: 'page-container score-criteria-management-page' },
          {
            default: D(() => [
              o(j),
              o(
                L,
                {
                  title: a.$t('admin.scoreCriteriaManagement.pageTitle'),
                  subtitle: a.$t('admin.scoreCriteriaManagement.pageDescription'),
                },
                null,
                8,
                ['title', 'subtitle'],
              ),
              e('div', he, [
                e('div', be, [
                  e('div', xe, [
                    e('h3', ye, n(a.$t('admin.scoreCriteriaManagement.previewTitle')), 1),
                    e('div', we, [
                      e('div', _e, [o(ue, { 'band-rules': i.value }, null, 8, ['band-rules'])]),
                    ]),
                  ]),
                ]),
                e('div', Xe, [
                  e('div', Se, [
                    e('h3', Ce, n(a.$t('admin.scoreCriteriaManagement.editTitle')), 1),
                    e('div', $e, [
                      d[0] ||
                        (d[0] = e(
                          'div',
                          { style: { width: '24px', 'margin-right': '8px' } },
                          null,
                          -1,
                        )),
                      e('div', qe, n(a.$t('admin.scoreCriteriaManagement.colBand')), 1),
                      e('div', Me, n(a.$t('admin.scoreCriteriaManagement.colScore')), 1),
                      e('div', Be, n(a.$t('admin.scoreCriteriaManagement.colCefr')), 1),
                      e('div', Ve, n(a.$t('admin.scoreCriteriaManagement.colDescriptor')), 1),
                      d[1] || (d[1] = e('div', { style: { width: '40px' } }, null, -1)),
                    ]),
                    e('div', Re, [
                      (c(!0),
                      m(
                        S,
                        null,
                        C(
                          i.value,
                          (s, x) => (
                            c(),
                            m(
                              'div',
                              { key: s.id, class: 'row items-center rule-row q-mb-md no-wrap' },
                              [
                                e('div', Te, n(x + 1), 1),
                                e('div', Ue, [
                                  o(
                                    u,
                                    {
                                      modelValue: s.band,
                                      'onUpdate:modelValue': (l) => (s.band = l),
                                      outlined: '',
                                      dense: '',
                                      class: 'buu-input-muted',
                                      'input-class': 'text-center',
                                    },
                                    null,
                                    8,
                                    ['modelValue', 'onUpdate:modelValue'],
                                  ),
                                ]),
                                e('div', ke, [
                                  o(
                                    u,
                                    {
                                      modelValue: s.minScore,
                                      'onUpdate:modelValue': (l) => (s.minScore = l),
                                      modelModifiers: { number: !0 },
                                      type: 'number',
                                      min: 0,
                                      max: 100,
                                      outlined: '',
                                      dense: '',
                                      class: 'buu-input-muted col',
                                      'input-class': 'text-center',
                                    },
                                    null,
                                    8,
                                    ['modelValue', 'onUpdate:modelValue'],
                                  ),
                                  d[2] ||
                                    (d[2] = e('span', { class: 'q-mx-xs text-grey-6' }, '-', -1)),
                                  o(
                                    u,
                                    {
                                      modelValue: s.maxScore,
                                      'onUpdate:modelValue': (l) => (s.maxScore = l),
                                      modelModifiers: { number: !0 },
                                      type: 'number',
                                      min: 0,
                                      max: 100,
                                      outlined: '',
                                      dense: '',
                                      class: 'buu-input-muted col',
                                      'input-class': 'text-center',
                                    },
                                    null,
                                    8,
                                    ['modelValue', 'onUpdate:modelValue'],
                                  ),
                                ]),
                                e('div', Ee, [
                                  o(
                                    u,
                                    {
                                      modelValue: s.cefr,
                                      'onUpdate:modelValue': (l) => (s.cefr = l),
                                      outlined: '',
                                      dense: '',
                                      class: 'buu-input-muted',
                                      'input-class': 'text-center',
                                    },
                                    null,
                                    8,
                                    ['modelValue', 'onUpdate:modelValue'],
                                  ),
                                ]),
                                e('div', Ne, [
                                  o(
                                    u,
                                    {
                                      modelValue: s.descriptor,
                                      'onUpdate:modelValue': (l) => (s.descriptor = l),
                                      outlined: '',
                                      dense: '',
                                      type: 'text',
                                      class: 'buu-input-muted',
                                    },
                                    null,
                                    8,
                                    ['modelValue', 'onUpdate:modelValue'],
                                  ),
                                ]),
                                e('div', Ae, [
                                  o(
                                    b,
                                    {
                                      flat: '',
                                      round: '',
                                      dense: '',
                                      color: 'negative',
                                      icon: 'delete',
                                      onClick: (l) => R(x),
                                    },
                                    null,
                                    8,
                                    ['onClick'],
                                  ),
                                ]),
                              ],
                            )
                          ),
                        ),
                        128,
                      )),
                      i.value.length
                        ? $('', !0)
                        : (c(),
                          m(
                            'div',
                            De,
                            ' No band rules defined. Click the "+" button to add one. ',
                          )),
                      o(b, {
                        flat: '',
                        icon: 'add',
                        color: 'grey-7',
                        class: 'full-width q-py-sm q-mt-sm add-row-btn',
                        onClick: V,
                      }),
                    ]),
                  ]),
                ]),
              ]),
              e('div', Ie, [
                o(
                  w,
                  {
                    label: a.$t('admin.scoreCriteriaManagement.cancelBtn'),
                    color: 'grey-4',
                    'text-color': 'dark',
                    unelevated: '',
                    class: 'action-btn',
                    onClick: T,
                  },
                  null,
                  8,
                  ['label'],
                ),
                o(
                  w,
                  {
                    label: a.$t('admin.scoreCriteriaManagement.saveBtn'),
                    color: 'primary',
                    unelevated: '',
                    class: 'action-btn action-btn--save',
                    onClick: U,
                  },
                  null,
                  8,
                  ['label'],
                ),
              ]),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  He = M(je, [['__scopeId', 'data-v-2e88a86c']]);
export { He as default };
