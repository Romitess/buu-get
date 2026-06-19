import {
  O as X,
  Q as m,
  R as k,
  a3 as G,
  U as w,
  S as t,
  aC as le,
  a0 as Q,
  T as r,
  a2 as M,
  t as se,
  A as we,
  w as oe,
  r as x,
  V as l,
  X as p,
  $ as R,
  _ as D,
  aW as fe,
  f as b,
  c as xe,
  F as ne,
  k as Te,
  h as P,
  ai as Ce,
  a as qe,
  aX as De,
  aY as ae,
  g as Ve,
  W as g,
  an as K,
  J as ke,
  a8 as ve,
  au as ie,
  az as Ie,
  av as J,
  B as Fe,
  am as re,
  Y as Re,
  ap as Ne,
  u as Ee,
  aw as Ae,
  a6 as ue,
  a7 as ce,
  aB as Be,
} from './index-CKSooU2k.js';
import { u as Z } from './vue-i18n-Bebkm_iB.js';
import { u as ze } from './use-quasar-DaOT29F-.js';
import { A as Pe, a as Le } from './app-breadcrumbs-C0oZOPYe.js';
import { Q as Ue } from './QSpace-BPMiD-JH.js';
import { A as V } from './app-button-D_cMl4aM.js';
import { C as Qe } from './ClosePopup-D9BZcpVj.js';
import { Q as Xe } from './QForm-7Hg-hjp5.js';
import { Q as de, a as me } from './QItem-D-DX6y8A.js';
import { Q as Me } from './QList-fArhXj97.js';
import { T as He } from './test-voucher-report-uCQBvIhM.js';
import { u as je, R as Oe } from './use-exam-documents-BOgCcvPw.js';
import { u as Ye } from './exam.store-DCbxmgyM.js';
import { u as We } from './useAppDate-DA_W5Scq.js';
import { P as Je } from './exam.service-0p8xz0zq.js';
import './image-display-9myJRY3L.js';
import './use-image-url-Bi9bxevq.js';
import './image.service-iLwePKJ0.js';
import './user-image-BTNlQ5Ur.js';
import './exam-rule-voucher.service-CrkXcGFH.js';
import './jspdf.es.min-UKkqpIx2.js';
import './transaction.service-Cj5D4WKX.js';
const Ge = { key: 0, class: 'badge-dot' },
  Ke = { class: 'badge-label' },
  Ze = X({
    __name: 'app-status-badge',
    props: {
      label: { default: '' },
      type: { default: 'primary' },
      dot: { type: Boolean, default: !0 },
    },
    setup(e) {
      return (d, n) => (
        m(),
        k(
          'div',
          { class: G(['app-status-badge', [`badge--${e.type}`]]) },
          [
            e.dot ? (m(), k('div', Ge)) : w('', !0),
            t('span', Ke, [le(d.$slots, 'default', {}, () => [Q(r(e.label), 1)], !0)]),
          ],
          2,
        )
      );
    },
  }),
  ye = M(Ze, [['__scopeId', 'data-v-01255d21']]);
function ge(e, d) {
  const n = x(void 0);
  let i = null;
  const o = () => {
      i && (clearInterval(i), (i = null));
    },
    c = () => {
      const y = e.value;
      if (!y) return;
      const _ = new Date(y);
      if (isNaN(_.getTime())) {
        n.value = '00:00';
        return;
      }
      const f = _.getTime(),
        T = () => {
          const S = Date.now(),
            I = f - S;
          if (I <= 0) {
            (o(), (n.value = '00:00'), d?.());
            return;
          }
          const h = Math.floor(I / 1e3),
            C = Math.floor(h / 60),
            N = h % 60;
          n.value = `${C.toString().padStart(2, '0')}:${N.toString().padStart(2, '0')}`;
        };
      (T(), (i = setInterval(T, 1e3)));
    };
  return (
    se(() => {
      c();
    }),
    we(() => {
      o();
    }),
    oe(e, () => {
      (o(), c());
    }),
    { displayDeadline: n }
  );
}
const et = { class: 'row items-center justify-start full-width card-top-row' },
  tt = { class: 'row items-center q-gutter-x-md status-group' },
  at = { key: 0, class: 'deadline-text row items-center' },
  lt = { key: 0, class: 'fee-group text-right' },
  st = { class: 'fee-label' },
  ot = { class: 'fee-value' },
  it = { class: 'exam-title q-mt-sm' },
  nt = { class: 'row items-center full-width card-bottom-row q-mt-md' },
  rt = { class: 'row items-center q-gutter-x-lg' },
  ut = { class: 'info-item row items-center' },
  ct = { class: 'info-item row items-center' },
  dt = { class: 'info-item row items-center' },
  mt = { class: 'card-actions row q-gutter-x-md' },
  pt = X({
    __name: 'app-exam-history-card',
    props: {
      title: {},
      statusLabel: {},
      statusType: { default: 'primary' },
      date: {},
      time: {},
      location: {},
      fee: {},
      deadline: {},
      showCancel: { type: Boolean, default: !1 },
      showPay: { type: Boolean, default: !1 },
      showDownload: { type: Boolean, default: !1 },
    },
    emits: ['cancel', 'pay', 'download', 'timeout'],
    setup(e, { emit: d }) {
      const n = e,
        i = d,
        { displayDeadline: o } = ge(fe(n, 'deadline'), () => i('timeout'));
      return (c, y) => (
        m(),
        k(
          'div',
          {
            class: G([
              'buu-card q-pa-lg column app-exam-history-card-container',
              [`status-${e.statusType}`],
            ]),
          },
          [
            t('div', et, [
              t('div', tt, [
                l(ye, { label: e.statusLabel, type: e.statusType }, null, 8, ['label', 'type']),
                le(
                  c.$slots,
                  'status-append',
                  {},
                  () => [
                    p(o)
                      ? (m(),
                        k('div', at, [
                          l(R, {
                            name: 'warning_amber',
                            size: 'calc(var(--space-unit) * 4.5)',
                            class: 'q-mr-xs',
                          }),
                          Q(' ' + r(c.$t('exam.history.paymentDeadline')) + ' ' + r(p(o)), 1),
                        ]))
                      : w('', !0),
                  ],
                  !0,
                ),
              ]),
              l(Ue),
              e.fee !== void 0
                ? (m(),
                  k('div', lt, [
                    t('div', st, r(c.$t('exam.history.fee')), 1),
                    t('div', ot, r(e.fee.toLocaleString()) + ' ฿', 1),
                  ]))
                : w('', !0),
            ]),
            t('div', it, r(e.title), 1),
            t('div', nt, [
              t('div', rt, [
                t('div', ut, [
                  l(R, { name: 'event', size: 'calc(var(--space-unit) * 5)', class: 'q-mr-sm' }),
                  Q(' ' + r(e.date), 1),
                ]),
                t('div', ct, [
                  l(R, { name: 'schedule', size: 'calc(var(--space-unit) * 5)', class: 'q-mr-sm' }),
                  Q(' ' + r(e.time), 1),
                ]),
                t('div', dt, [
                  l(R, { name: 'place', size: 'calc(var(--space-unit) * 5)', class: 'q-mr-sm' }),
                  Q(' ' + r(e.location), 1),
                ]),
              ]),
            ]),
            t('div', mt, [
              le(
                c.$slots,
                'actions',
                {},
                () => [
                  e.showCancel
                    ? (m(),
                      D(
                        V,
                        {
                          key: 0,
                          id: 'btn-cancel-exam',
                          outline: '',
                          color: 'grey-8',
                          label: c.$t('exam.history.cancel'),
                          class: 'action-btn',
                          onClick: y[0] || (y[0] = (_) => c.$emit('cancel')),
                        },
                        null,
                        8,
                        ['label'],
                      ))
                    : w('', !0),
                  e.showPay
                    ? (m(),
                      D(
                        V,
                        {
                          key: 1,
                          id: 'btn-pay-exam',
                          icon: 'payments',
                          label: c.$t('exam.history.pay'),
                          class: 'action-btn pay-btn',
                          onClick: y[1] || (y[1] = (_) => c.$emit('pay')),
                        },
                        null,
                        8,
                        ['label'],
                      ))
                    : w('', !0),
                  e.showDownload
                    ? (m(),
                      D(
                        V,
                        {
                          key: 2,
                          id: 'btn-download-receipt',
                          icon: 'receipt_long',
                          label: c.$t('exam.history.downloadReceipt'),
                          class: 'action-btn download-btn',
                          onClick: y[2] || (y[2] = (_) => c.$emit('download')),
                        },
                        null,
                        8,
                        ['label'],
                      ))
                    : w('', !0),
                ],
                !0,
              ),
            ]),
          ],
          2,
        )
      );
    },
  }),
  pe = M(pt, [['__scopeId', 'data-v-9280013f']]),
  ft = { ratio: [String, Number] };
function vt(e, d) {
  return b(() => {
    const n = e.ratio || d?.value;
    if (typeof n == 'string' && n.trim() === '') return null;
    const i = Number(n);
    return Number.isFinite(i) && i > 0 ? { paddingBottom: `${100 / i}%` } : null;
  });
}
const yt = 1.7778,
  gt = xe({
    name: 'QImg',
    props: {
      ...ft,
      src: String,
      srcset: String,
      sizes: String,
      alt: String,
      crossorigin: String,
      decoding: String,
      referrerpolicy: String,
      draggable: Boolean,
      loading: { type: String, default: 'lazy' },
      loadingShowDelay: { type: [Number, String], default: 0 },
      fetchpriority: { type: String, default: 'auto' },
      width: String,
      height: String,
      initialRatio: { type: [Number, String], default: yt },
      placeholderSrc: String,
      errorSrc: String,
      fit: { type: String, default: 'cover' },
      position: { type: String, default: '50% 50%' },
      imgClass: String,
      imgStyle: Object,
      noSpinner: Boolean,
      noNativeMenu: Boolean,
      noTransition: Boolean,
      spinnerColor: String,
      spinnerSize: String,
    },
    emits: ['load', 'error'],
    setup(e, { slots: d, emit: n }) {
      const i = x(e.initialRatio),
        o = vt(e, i),
        c = Ve(),
        { registerTimeout: y, removeTimeout: _ } = ne(),
        { registerTimeout: f, removeTimeout: T } = ne(),
        S = b(() => (e.placeholderSrc !== void 0 ? { src: e.placeholderSrc } : null)),
        I = b(() => (e.errorSrc !== void 0 ? { src: e.errorSrc, __qerror: !0 } : null)),
        h = [x(null), x(S.value)],
        C = x(0),
        N = x(!1),
        B = x(!1),
        z = b(() => `q-img q-img--${e.noNativeMenu ? 'no-' : ''}menu`),
        E = b(() => ({ width: e.width, height: e.height })),
        H = b(
          () =>
            `q-img__image ${e.imgClass !== void 0 ? e.imgClass + ' ' : ''}q-img__image--with${e.noTransition ? 'out' : ''}-transition q-img__image--`,
        ),
        L = b(() => ({ ...e.imgStyle, objectFit: e.fit, objectPosition: e.position }));
      function j() {
        if ((T(), e.loadingShowDelay === 0)) {
          N.value = !0;
          return;
        }
        f(() => {
          N.value = !0;
        }, e.loadingShowDelay);
      }
      function v() {
        (T(), (N.value = !1));
      }
      function $({ target: u }) {
        ae(c) ||
          (_(),
          (i.value = u.naturalHeight === 0 ? 0.5 : u.naturalWidth / u.naturalHeight),
          q(u, 1));
      }
      function q(u, A) {
        A === 1e3 ||
          ae(c) ||
          (u.complete
            ? ee(u)
            : y(() => {
                q(u, A + 1);
              }, 50));
      }
      function ee(u) {
        ae(c) ||
          ((C.value = C.value ^ 1),
          (h[C.value].value = null),
          v(),
          u.getAttribute('__qerror') !== 'true' && (B.value = !1),
          n('load', u.currentSrc || u.src));
      }
      function te(u) {
        (_(),
          v(),
          (B.value = !0),
          (h[C.value].value = I.value),
          (h[C.value ^ 1].value = S.value),
          n('error', u));
      }
      function O(u) {
        const A = h[u].value,
          U = {
            key: 'img_' + u,
            class: H.value,
            style: L.value,
            alt: e.alt,
            crossorigin: e.crossorigin,
            decoding: e.decoding,
            referrerpolicy: e.referrerpolicy,
            height: e.height,
            width: e.width,
            loading: e.loading,
            fetchpriority: e.fetchpriority,
            'aria-hidden': 'true',
            draggable: e.draggable,
            ...A,
          };
        return (
          C.value === u
            ? Object.assign(U, { class: U.class + 'current', onLoad: $, onError: te })
            : (U.class += 'loaded'),
          P('div', { class: 'q-img__container absolute-full', key: 'img' + u }, P('img', U))
        );
      }
      function Y() {
        return N.value
          ? P(
              'div',
              { key: 'loading', class: 'q-img__loading absolute-full flex flex-center' },
              d.loading !== void 0
                ? d.loading()
                : e.noSpinner
                  ? void 0
                  : [P(De, { color: e.spinnerColor, size: e.spinnerSize })],
            )
          : P(
              'div',
              { key: 'content', class: 'q-img__content absolute-full q-anchor--skip' },
              qe(d[B.value ? 'error' : 'default']),
            );
      }
      {
        const u = () => {
          oe(
            () =>
              e.src || e.srcset || e.sizes
                ? { src: e.src, srcset: e.srcset, sizes: e.sizes }
                : null,
            (A) => {
              (_(),
                (B.value = !1),
                A === null ? (v(), (h[C.value ^ 1].value = S.value)) : j(),
                (h[C.value].value = A));
            },
            { immediate: !0 },
          );
        };
        Te.value ? se(u) : u();
      }
      return () => {
        const u = [];
        return (
          o.value !== null && u.push(P('div', { key: 'filler', style: o.value })),
          h[0].value !== null && u.push(O(0)),
          h[1].value !== null && u.push(O(1)),
          u.push(P(Ce, { name: 'q-transition--fade' }, Y)),
          P(
            'div',
            { key: 'main', class: z.value, style: E.value, role: 'img', 'aria-label': e.alt },
            u,
          )
        );
      };
    },
  }),
  ht = { class: 'dialog-title' },
  bt = { class: 'amount-label' },
  _t = { class: 'amount-value' },
  $t = { class: 'qr-container' },
  St = ['innerHTML'],
  wt = X({
    __name: 'app-payment-dialog',
    props: { modelValue: { type: Boolean }, amount: {}, qrCodeUrl: {}, expiryTime: {} },
    emits: ['update:modelValue', 'save', 'timeout'],
    setup(e, { emit: d }) {
      const n = e,
        i = d;
      Z();
      const { displayDeadline: o } = ge(fe(n, 'expiryTime'), () => i('timeout'));
      return (c, y) => (
        m(),
        D(
          ie,
          {
            'model-value': e.modelValue,
            'onUpdate:modelValue': y[1] || (y[1] = (_) => c.$emit('update:modelValue', _)),
            persistent: '',
          },
          {
            default: g(() => [
              l(
                K,
                { class: 'payment-dialog-card column no-wrap items-center' },
                {
                  default: g(() => [
                    ke(
                      l(
                        ve,
                        {
                          icon: 'close',
                          flat: '',
                          round: '',
                          dense: '',
                          class: 'absolute-top-right close-btn',
                        },
                        null,
                        512,
                      ),
                      [[Qe]],
                    ),
                    t('div', ht, r(c.$t('payment.dialog.title')), 1),
                    l(
                      K,
                      { flat: '', class: 'amount-card' },
                      {
                        default: g(() => [
                          t('div', bt, r(c.$t('payment.dialog.detailsLabel')), 1),
                          t('div', _t, r(e.amount.toLocaleString()) + ' THB', 1),
                        ]),
                        _: 1,
                      },
                    ),
                    t('div', $t, [
                      l(gt, { src: e.qrCodeUrl || '/qr test.png', class: 'qr-image' }, null, 8, [
                        'src',
                      ]),
                    ]),
                    l(
                      ye,
                      { type: 'error', dot: !1, class: 'countdown-badge' },
                      {
                        default: g(() => [
                          l(R, { name: 'schedule', class: 'q-mr-xs' }),
                          Q(' ' + r(c.$t('payment.dialog.payWithin', { time: p(o) })), 1),
                        ]),
                        _: 1,
                      },
                    ),
                    t(
                      'div',
                      { class: 'instruction-text', innerHTML: c.$t('payment.dialog.instruction') },
                      null,
                      8,
                      St,
                    ),
                    l(
                      V,
                      {
                        icon: 'file_download',
                        label: c.$t('payment.dialog.saveQr'),
                        class: 'save-btn',
                        onClick: y[0] || (y[0] = (_) => c.$emit('save')),
                      },
                      null,
                      8,
                      ['label'],
                    ),
                  ]),
                  _: 1,
                },
              ),
            ]),
            _: 1,
          },
          8,
          ['model-value'],
        )
      );
    },
  }),
  xt = M(wt, [['__scopeId', 'data-v-03b176b9']]),
  Tt = { class: 'dialog-title' },
  Ct = { class: 'exam-summary' },
  qt = { class: 'summary-title' },
  Dt = { class: 'summary-details' },
  Vt = { class: 'summary-item summary-subject' },
  kt = { class: 'summary-label' },
  It = { class: 'summary-value' },
  Ft = { class: 'summary-meta' },
  Rt = { class: 'summary-item' },
  Nt = { class: 'summary-label' },
  Et = { class: 'summary-value' },
  At = { class: 'summary-item' },
  Bt = { class: 'summary-label' },
  zt = { class: 'summary-value' },
  Pt = { class: 'field-group' },
  Lt = { class: 'field-group' },
  Ut = { class: 'field-group' },
  Qt = { class: 'field-group' },
  Xt = { class: 'dialog-actions' },
  Mt = X({
    __name: 'receipt-information-dialog',
    props: {
      modelValue: { type: Boolean },
      examTitle: {},
      amount: {},
      paymentDeadline: {},
      initialValue: {},
      isForeignUser: { type: Boolean },
    },
    emits: ['update:modelValue', 'confirm'],
    setup(e, { emit: d }) {
      const n = e,
        i = d,
        { t: o, locale: c } = Z(),
        y = x(null),
        _ = () => ({ taxId: '', fullName: '', phone: '', address: '' }),
        f = Fe(_()),
        T = b(() => ({
          taxId: I.value,
          fullName: o('exam.history.receiptForm.fullNamePlaceholder'),
          phone: o('exam.history.receiptForm.phonePlaceholder'),
          address: o('exam.history.receiptForm.addressPlaceholder'),
        })),
        S = b(() => o('exam.history.receiptForm.taxIdLabel')),
        I = b(() =>
          n.isForeignUser ? o('exam.history.receiptForm.passportPlaceholder') : 'X-XXXX-XXXXX-XX-X',
        ),
        h = b(() => [(v) => !!v?.trim() || o('exam.history.receiptForm.required')]),
        C = b(() => [
          ...h.value,
          (v) =>
            n.isForeignUser ||
            /^\d{13}$/.test(v) ||
            o('exam.history.receiptForm.identityDigitsOnly'),
        ]),
        N = b(() => [
          ...h.value,
          (v) => /^[\p{L}\p{M}\s'-]+$/u.test(v) || o('exam.history.receiptForm.fullNameInvalid'),
        ]),
        B = b(() => [
          ...h.value,
          (v) => /^\d{10}$/.test(v) || o('exam.history.receiptForm.phoneInvalid'),
        ]),
        z = (v) => {
          const $ = String(v ?? '');
          f.taxId = n.isForeignUser ? $ : $.replace(/\D/g, '').slice(0, 13);
        },
        E = (v) => {
          f.fullName = String(v ?? '').replace(/[^\p{L}\p{M}\s'-]/gu, '');
        },
        H = b(() => {
          const v = o('exam.history.receiptForm.currency');
          return `${n.amount.toLocaleString(c.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${v}`;
        });
      oe(
        () => n.modelValue,
        (v) => {
          v && Object.assign(f, _());
        },
      );
      const L = () => i('update:modelValue', !1),
        j = async () => {
          (await y.value?.validate()) &&
            i('confirm', {
              taxId: f.taxId.trim(),
              fullName: f.fullName.trim(),
              phone: f.phone.trim(),
              address: f.address.trim(),
            });
        };
      return (v, $) => (
        m(),
        D(
          ie,
          {
            'model-value': e.modelValue,
            persistent: '',
            'onUpdate:modelValue': $[4] || ($[4] = (q) => i('update:modelValue', q)),
          },
          {
            default: g(() => [
              l(
                K,
                { class: 'receipt-information-card' },
                {
                  default: g(() => [
                    l(ve, {
                      icon: 'close',
                      flat: '',
                      round: '',
                      dense: '',
                      class: 'absolute-top-right close-btn',
                      onClick: L,
                    }),
                    t('h2', Tt, r(p(o)('exam.history.receiptForm.title')), 1),
                    t('section', Ct, [
                      t('div', qt, r(p(o)('exam.history.receiptForm.examDetails')), 1),
                      t('div', Dt, [
                        t('div', Vt, [
                          t('strong', kt, r(p(o)('exam.history.receiptForm.subject')) + ':', 1),
                          t('span', It, r(e.examTitle), 1),
                        ]),
                        t('div', Ft, [
                          t('span', Rt, [
                            t('strong', Nt, r(p(o)('exam.history.receiptForm.fee')) + ':', 1),
                            t('span', Et, r(H.value), 1),
                          ]),
                          t('span', At, [
                            t(
                              'strong',
                              Bt,
                              r(p(o)('exam.history.receiptForm.paymentPeriod')) + ': ',
                              1,
                            ),
                            t('span', zt, r(e.paymentDeadline || '-'), 1),
                          ]),
                        ]),
                      ]),
                    ]),
                    l(
                      Xe,
                      {
                        ref_key: 'receiptFormRef',
                        ref: y,
                        class: 'receipt-form',
                        onSubmit: Ie(j, ['prevent']),
                      },
                      {
                        default: g(() => [
                          t('label', Pt, [
                            t('span', null, r(S.value), 1),
                            l(
                              J,
                              {
                                modelValue: f.taxId,
                                'onUpdate:modelValue': [$[0] || ($[0] = (q) => (f.taxId = q)), z],
                                outlined: '',
                                dense: '',
                                'lazy-rules': '',
                                mask: e.isForeignUser ? void 0 : '#-####-#####-##-#',
                                'unmasked-value': !e.isForeignUser,
                                placeholder: I.value,
                                rules: C.value,
                              },
                              null,
                              8,
                              ['modelValue', 'mask', 'unmasked-value', 'placeholder', 'rules'],
                            ),
                          ]),
                          t('label', Lt, [
                            t('span', null, r(p(o)('exam.history.receiptForm.fullNameLabel')), 1),
                            l(
                              J,
                              {
                                modelValue: f.fullName,
                                'onUpdate:modelValue': [
                                  $[1] || ($[1] = (q) => (f.fullName = q)),
                                  E,
                                ],
                                outlined: '',
                                dense: '',
                                'lazy-rules': '',
                                placeholder: T.value.fullName,
                                rules: N.value,
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'rules'],
                            ),
                          ]),
                          t('label', Ut, [
                            t('span', null, r(p(o)('exam.history.receiptForm.phoneLabel')), 1),
                            l(
                              J,
                              {
                                modelValue: f.phone,
                                'onUpdate:modelValue': $[2] || ($[2] = (q) => (f.phone = q)),
                                outlined: '',
                                dense: '',
                                'lazy-rules': '',
                                placeholder: T.value.phone,
                                rules: B.value,
                                mask: '###-###-####',
                                'unmasked-value': '',
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'rules'],
                            ),
                          ]),
                          t('label', Qt, [
                            t('span', null, r(p(o)('exam.history.receiptForm.addressLabel')), 1),
                            l(
                              J,
                              {
                                modelValue: f.address,
                                'onUpdate:modelValue': $[3] || ($[3] = (q) => (f.address = q)),
                                type: 'textarea',
                                outlined: '',
                                dense: '',
                                'lazy-rules': '',
                                placeholder: T.value.address,
                                rules: h.value,
                              },
                              null,
                              8,
                              ['modelValue', 'placeholder', 'rules'],
                            ),
                          ]),
                          t('div', Xt, [
                            l(
                              V,
                              {
                                type: 'button',
                                label: p(o)('exam.history.receiptForm.cancel'),
                                class: 'cancel-btn',
                                onClick: L,
                              },
                              null,
                              8,
                              ['label'],
                            ),
                            l(
                              V,
                              {
                                type: 'submit',
                                label: p(o)('exam.history.receiptForm.confirm'),
                                class: 'confirm-btn',
                              },
                              null,
                              8,
                              ['label'],
                            ),
                          ]),
                        ]),
                        _: 1,
                      },
                      512,
                    ),
                  ]),
                  _: 1,
                },
              ),
            ]),
            _: 1,
          },
          8,
          ['model-value'],
        )
      );
    },
  }),
  Ht = M(Mt, [['__scopeId', 'data-v-a8e74405']]),
  jt = { class: 'icon-container-wrapper' },
  Ot = { class: 'text-title q-mt-md' },
  Yt = { class: 'text-subtitle q-mt-sm' },
  Wt = { class: 'row justify-between items-end q-pb-xs' },
  Jt = { class: 'row items-center label-text' },
  Gt = { class: 'value-text' },
  Kt = { class: 'row justify-between items-end q-pb-xs' },
  Zt = { class: 'row items-center label-text' },
  ea = { class: 'value-text' },
  ta = { class: 'col-6' },
  aa = { class: 'col-6' },
  la = X({
    __name: 'dialog-cancel',
    props: {
      modelValue: { type: Boolean },
      examDate: {},
      examTime: {},
      title: {},
      subtitle: {},
      cancelBtnText: {},
      confirmBtnText: {},
    },
    emits: ['update:modelValue', 'confirm'],
    setup(e) {
      const { t: d } = Z();
      return (n, i) => (
        m(),
        D(
          ie,
          {
            'model-value': e.modelValue,
            persistent: '',
            'onUpdate:modelValue': i[2] || (i[2] = (o) => n.$emit('update:modelValue', o)),
            'transition-show': 'scale',
            'transition-hide': 'scale',
          },
          {
            default: g(() => [
              l(
                K,
                { class: 'dialog-cancel-card' },
                {
                  default: g(() => [
                    l(
                      re,
                      { class: 'column items-center q-pt-xl q-pb-lg' },
                      {
                        default: g(() => [
                          t('div', jt, [
                            l(
                              Re,
                              { class: 'icon-container' },
                              {
                                default: g(() => [l(R, { name: 'calendar_today', size: '28px' })]),
                                _: 1,
                              },
                            ),
                          ]),
                          t('div', Ot, r(e.title || p(d)('examSchedule.dialogCancel.title')), 1),
                          t(
                            'div',
                            Yt,
                            r(e.subtitle || p(d)('examSchedule.dialogCancel.subtitle')),
                            1,
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                    l(
                      re,
                      { class: 'q-px-xl q-pb-lg' },
                      {
                        default: g(() => [
                          l(
                            Me,
                            { class: 'info-box q-pa-none' },
                            {
                              default: g(() => [
                                l(
                                  de,
                                  {
                                    class: 'info-row q-pa-none',
                                    dense: '',
                                    style: { 'min-height': 'unset' },
                                  },
                                  {
                                    default: g(() => [
                                      l(
                                        me,
                                        { class: 'q-pa-none' },
                                        {
                                          default: g(() => [
                                            t('div', Wt, [
                                              t('div', Jt, [
                                                l(R, {
                                                  name: 'event',
                                                  size: '18px',
                                                  class: 'q-mr-sm',
                                                }),
                                                t(
                                                  'span',
                                                  null,
                                                  r(p(d)('examSchedule.dialogCancel.date')),
                                                  1,
                                                ),
                                              ]),
                                              t('div', Gt, r(e.examDate), 1),
                                            ]),
                                            i[3] ||
                                              (i[3] = t('div', { class: 'underline' }, null, -1)),
                                          ]),
                                          _: 1,
                                        },
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ),
                                l(
                                  de,
                                  {
                                    class: 'info-row q-mt-md q-pa-none',
                                    dense: '',
                                    style: { 'min-height': 'unset' },
                                  },
                                  {
                                    default: g(() => [
                                      l(
                                        me,
                                        { class: 'q-pa-none' },
                                        {
                                          default: g(() => [
                                            t('div', Kt, [
                                              t('div', Zt, [
                                                l(R, {
                                                  name: 'schedule',
                                                  size: '18px',
                                                  class: 'q-mr-sm',
                                                }),
                                                t(
                                                  'span',
                                                  null,
                                                  r(p(d)('examSchedule.dialogCancel.time')),
                                                  1,
                                                ),
                                              ]),
                                              t('div', ea, r(e.examTime), 1),
                                            ]),
                                            i[4] ||
                                              (i[4] = t('div', { class: 'underline' }, null, -1)),
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
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                    l(
                      Ne,
                      { class: 'row q-px-xl q-pb-xl q-col-gutter-md' },
                      {
                        default: g(() => [
                          t('div', ta, [
                            l(
                              V,
                              {
                                outline: '',
                                label: e.cancelBtnText || p(d)('examSchedule.dialogCancel.cancel'),
                                class: 'full-width dialog-btn',
                                onClick: i[0] || (i[0] = (o) => n.$emit('update:modelValue', !1)),
                              },
                              null,
                              8,
                              ['label'],
                            ),
                          ]),
                          t('div', aa, [
                            l(
                              V,
                              {
                                label:
                                  e.confirmBtnText || p(d)('examSchedule.dialogCancel.confirm'),
                                class: 'full-width dialog-btn',
                                onClick: i[1] || (i[1] = (o) => n.$emit('confirm')),
                              },
                              null,
                              8,
                              ['label'],
                            ),
                          ]),
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
          ['model-value'],
        )
      );
    },
  }),
  sa = M(la, [['__scopeId', 'data-v-2989acfb']]),
  oa = { class: 'page-container exam-history-page q-pa-lg' },
  ia = { key: 0, class: 'history-section q-mb-xl' },
  na = { class: 'section-title row items-center q-mb-md' },
  ra = { class: 'text-weight-bold text-subtitle1' },
  ua = { class: 'q-gutter-y-md' },
  ca = { key: 1, class: 'history-section' },
  da = { class: 'section-title row items-center q-mb-md' },
  ma = { class: 'text-weight-bold text-subtitle1' },
  pa = { class: 'q-gutter-y-md' },
  fa = {
    key: 2,
    id: 'pdf-render-container',
    style: {
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      width: '800px',
      'z-index': '-1000',
      'pointer-events': 'none',
    },
  },
  va = {
    key: 3,
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
  ya = X({
    __name: 'exam-history-page',
    setup(e) {
      const d = ze(),
        { t: n } = Z(),
        i = Ye(),
        o = Ee(),
        { formatDateRange: c } = We(),
        { pendingRegistrations: y, historyRecords: _ } = Ae(i);
      se(async () => {
        await i.fetchHistory();
      });
      const f = x(!1),
        T = x(!1),
        S = x(null),
        I = x(new Date().toISOString()),
        h = x(null),
        C = b(() => {
          const a = o.currentUser;
          return {
            taxId: a?.taxId || a?.nationalId || a?.passportNo || '',
            fullName: a?.fullNameTH || a?.fullNameEN || '',
            phone: a?.phone || '',
            address: a?.address || '',
          };
        }),
        N = b(() => !o.currentUser?.nationalId && !!o.currentUser?.passportNo),
        B = b(() => {
          const a = S.value?.rawEnrollment?.SESSION?.EXAM;
          return !a?.EXAM_PAY_START_DATE || !a.EXAM_PAY_END_DATE
            ? '-'
            : c(a.EXAM_PAY_START_DATE, a.EXAM_PAY_END_DATE);
        }),
        z = x(!1),
        E = x(null),
        {
          isDownloadingVoucher: H,
          selectedVoucherData: L,
          selectedVoucherRegulationsEn: j,
          selectedVoucherRegulationsTh: v,
          isDownloadingReceipt: $,
          selectedReceiptData: q,
          printVoucher: ee,
          printReceipt: te,
        } = je(),
        O = b(() =>
          y.value.map((a) => ({
            ...a,
            title: a.title || n('exam.history.defaultExamTitle'),
            status: n(a.status),
          })),
        ),
        Y = b(() =>
          _.value.map((a) => {
            const F = {
              ...a,
              title: a.title || n('exam.history.defaultExamTitle'),
              status: n(a.status),
            };
            if (a.customStatus) {
              const { result: s } = a.customStatus;
              F.customStatus = {
                ...a.customStatus,
                label: s
                  ? `${n('exam.statusLabel')} : ${n(`exam.status.${s}`)}`
                  : n(a.customStatus.label),
              };
            }
            return F;
          }),
        ),
        u = (a) => {
          i.cancelRegistration(a.id, 'paymentTimeout');
        },
        A = (a) => {
          if (((S.value = a), a.deadline)) I.value = a.deadline;
          else {
            const F = new Date(),
              s = new Date(F.getTime() + Je * 1e3);
            I.value = s.toISOString();
          }
          T.value = !0;
        },
        U = (a) => {
          ((h.value = a), (T.value = !1), (f.value = !0));
        },
        he = async () => {
          if (S.value && h.value)
            try {
              const a = S.value.fee;
              if (a === void 0) throw new Error('Exam fee is missing');
              (await i.confirmPayment(S.value.id, a, h.value),
                d.notify({ type: 'positive', message: n('success'), position: 'bottom' }));
            } catch {
              d.notify({
                type: 'negative',
                message: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน',
                position: 'bottom',
              });
            }
          f.value = !1;
        },
        be = (a) => {
          ((E.value = a), (z.value = !0));
        },
        _e = async () => {
          if (E.value)
            try {
              (await i.cancelRegistration(E.value.id, 'manual'),
                d.notify({
                  type: 'positive',
                  message: 'ยกเลิกการสมัครสอบเรียบร้อยแล้ว',
                  position: 'bottom',
                  timeout: 2e3,
                }));
            } catch {
              d.notify({
                type: 'negative',
                message: 'เกิดข้อผิดพลาดในการยกเลิกการสมัคร',
                position: 'bottom',
                timeout: 2e3,
              });
            }
          z.value = !1;
        },
        $e = (a) => {
          ee(a);
        },
        Se = (a) => {
          te(a);
        };
      return (a, F) => (
        m(),
        k('div', oa, [
          l(Pe),
          l(
            Le,
            {
              title: a.$t('exam.history.pageTitle'),
              subtitle: a.$t('exam.history.pageDescription'),
            },
            null,
            8,
            ['title', 'subtitle'],
          ),
          O.value.length > 0
            ? (m(),
              k('div', ia, [
                t('div', na, [
                  l(R, {
                    name: 'schedule',
                    size: 'var(--space-lg)',
                    class: 'section-icon q-mr-sm',
                  }),
                  t('span', ra, r(a.$t('exam.history.pendingSectionTitle')), 1),
                ]),
                t('div', ua, [
                  (m(!0),
                  k(
                    ue,
                    null,
                    ce(
                      O.value,
                      (s) => (
                        m(),
                        D(
                          pe,
                          {
                            key: s.id,
                            'status-label': s.status,
                            'status-type': s.statusType,
                            title: s.title,
                            date: s.date,
                            time: s.time,
                            location: s.location,
                            fee: s.fee,
                            deadline: s.deadline,
                            onTimeout: (W) => u(s),
                          },
                          {
                            actions: g(() => [
                              s.actions?.includes('cancel')
                                ? (m(),
                                  D(
                                    V,
                                    {
                                      key: 0,
                                      outline: '',
                                      label: a.$t('exam.history.cancel'),
                                      class: 'action-btn btn-action-outline',
                                      onClick: (W) => be(s),
                                    },
                                    null,
                                    8,
                                    ['label', 'onClick'],
                                  ))
                                : w('', !0),
                              s.actions?.includes('pay')
                                ? (m(),
                                  D(
                                    V,
                                    {
                                      key: 1,
                                      icon: 'payments',
                                      label: a.$t('exam.history.pay'),
                                      class: 'action-btn btn-action-filled',
                                      onClick: (W) => A(s),
                                    },
                                    null,
                                    8,
                                    ['label', 'onClick'],
                                  ))
                                : w('', !0),
                            ]),
                            _: 2,
                          },
                          1032,
                          [
                            'status-label',
                            'status-type',
                            'title',
                            'date',
                            'time',
                            'location',
                            'fee',
                            'deadline',
                            'onTimeout',
                          ],
                        )
                      ),
                    ),
                    128,
                  )),
                ]),
              ]))
            : w('', !0),
          Y.value.length > 0
            ? (m(),
              k('div', ca, [
                t('div', da, [
                  l(R, {
                    name: 'schedule',
                    size: 'var(--space-lg)',
                    class: 'section-icon q-mr-sm',
                  }),
                  t('span', ma, r(a.$t('exam.history.sectionTitle')), 1),
                ]),
                t('div', pa, [
                  (m(!0),
                  k(
                    ue,
                    null,
                    ce(
                      Y.value,
                      (s) => (
                        m(),
                        D(
                          pe,
                          {
                            key: s.id,
                            'status-label': s.status,
                            'status-type': s.statusType,
                            title: s.title,
                            date: s.date,
                            time: s.time,
                            location: s.location,
                          },
                          Be(
                            {
                              actions: g(() => [
                                s.actions?.includes('scoreDetails')
                                  ? (m(),
                                    D(
                                      V,
                                      {
                                        key: 0,
                                        outline: '',
                                        label: a.$t('exam.history.scoreDetails'),
                                        class: 'action-btn btn-action-outline',
                                      },
                                      null,
                                      8,
                                      ['label'],
                                    ))
                                  : w('', !0),
                                s.actions?.includes('certificate')
                                  ? (m(),
                                    D(
                                      V,
                                      {
                                        key: 1,
                                        icon: 'file_download',
                                        label: a.$t('exam.history.certificate'),
                                        class: 'action-btn btn-action-filled',
                                      },
                                      null,
                                      8,
                                      ['label'],
                                    ))
                                  : w('', !0),
                                s.actions?.includes('candidateCard')
                                  ? (m(),
                                    D(
                                      V,
                                      {
                                        key: 2,
                                        icon: 'badge',
                                        label: a.$t('exam.history.candidateCard'),
                                        class: 'action-btn btn-action-filled',
                                        onClick: (W) => $e(s),
                                      },
                                      null,
                                      8,
                                      ['label', 'onClick'],
                                    ))
                                  : w('', !0),
                                s.actions?.includes('downloadReceipt')
                                  ? (m(),
                                    D(
                                      V,
                                      {
                                        key: 3,
                                        icon: 'receipt_long',
                                        label: a.$t('exam.history.downloadReceipt'),
                                        class: 'action-btn btn-action-filled',
                                        onClick: (W) => Se(s),
                                      },
                                      null,
                                      8,
                                      ['label', 'onClick'],
                                    ))
                                  : w('', !0),
                              ]),
                              _: 2,
                            },
                            [
                              s.customStatus
                                ? {
                                    name: 'status-append',
                                    fn: g(() => [
                                      t(
                                        'div',
                                        {
                                          class: G([
                                            'custom-status',
                                            `${s.customStatus.type}-status`,
                                            'row items-center',
                                          ]),
                                        },
                                        [
                                          l(
                                            R,
                                            {
                                              name: s.customStatus.icon,
                                              size: 'calc(var(--space-unit) * 5)',
                                              class: 'q-mr-xs',
                                            },
                                            null,
                                            8,
                                            ['name'],
                                          ),
                                          t(
                                            'span',
                                            {
                                              class: G({
                                                'text-weight-bold': s.customStatus.type === 'error',
                                              }),
                                            },
                                            r(s.customStatus.label),
                                            3,
                                          ),
                                        ],
                                        2,
                                      ),
                                    ]),
                                    key: '0',
                                  }
                                : void 0,
                            ],
                          ),
                          1032,
                          ['status-label', 'status-type', 'title', 'date', 'time', 'location'],
                        )
                      ),
                    ),
                    128,
                  )),
                ]),
              ]))
            : w('', !0),
          l(
            Ht,
            {
              modelValue: T.value,
              'onUpdate:modelValue': F[0] || (F[0] = (s) => (T.value = s)),
              'exam-title': S.value?.title || '',
              amount: S.value?.fee ?? 0,
              'payment-deadline': B.value,
              'initial-value': C.value,
              'is-foreign-user': N.value,
              onConfirm: U,
            },
            null,
            8,
            [
              'modelValue',
              'exam-title',
              'amount',
              'payment-deadline',
              'initial-value',
              'is-foreign-user',
            ],
          ),
          l(
            xt,
            {
              modelValue: f.value,
              'onUpdate:modelValue': F[1] || (F[1] = (s) => (f.value = s)),
              amount: S.value?.fee ?? 0,
              'expiry-time': I.value,
              onSave: he,
            },
            null,
            8,
            ['modelValue', 'amount', 'expiry-time'],
          ),
          l(
            sa,
            {
              modelValue: z.value,
              'onUpdate:modelValue': F[2] || (F[2] = (s) => (z.value = s)),
              'exam-date': E.value?.date || '',
              'exam-time': E.value?.time || '',
              onConfirm: _e,
            },
            null,
            8,
            ['modelValue', 'exam-date', 'exam-time'],
          ),
          p(H)
            ? (m(),
              k('div', fa, [
                l(He, { data: p(L), 'regulations-en': p(j), 'regulations-th': p(v) }, null, 8, [
                  'data',
                  'regulations-en',
                  'regulations-th',
                ]),
              ]))
            : w('', !0),
          p($) ? (m(), k('div', va, [l(Oe, { receipt: p(q) }, null, 8, ['receipt'])])) : w('', !0),
        ])
      );
    },
  }),
  Pa = M(ya, [['__scopeId', 'data-v-eb76d7c2']]);
export { Pa as default };
