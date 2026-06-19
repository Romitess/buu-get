import {
  ay as Ne,
  r as h,
  aq as ae,
  O as G,
  P as ie,
  a4 as be,
  u as Ve,
  t as ne,
  a5 as Te,
  Q as S,
  R as P,
  S as e,
  T as N,
  a3 as ee,
  V as s,
  ai as ce,
  W as C,
  a8 as z,
  $ as Q,
  a0 as Y,
  U as X,
  az as pe,
  av as J,
  a9 as te,
  a2 as j,
  w as de,
  o as Ie,
  _ as W,
  an as ue,
  a6 as Se,
  a7 as ke,
  au as me,
  f as H,
  I as oe,
  X as t,
  aA as B,
  ao as ge,
  aB as Ce,
  aC as _e,
  aD as se,
  ar as Ue,
  am as he,
  Y as qe,
  ap as Pe,
  aE as xe,
  at as Oe,
} from './index-CKSooU2k.js';
import { u as le } from './use-quasar-DaOT29F-.js';
import { u as K } from './vue-i18n-Bebkm_iB.js';
import { Q as fe } from './QForm-7Hg-hjp5.js';
import { u as we, Q as Me, A as Re, a as Ae } from './app-image-cropper-B7mLtgoP.js';
import { Q as Fe } from './QLinearProgress-ComgvJOP.js';
import { u as He } from './use-image-url-Bi9bxevq.js';
import { Q as Le } from './format-DnjzHs7F.js';
import { A as Be } from './app-select-DSldWHEY.js';
import { A as ze } from './app-calendar-3fcHCMzM.js';
import { T as De } from './form-options-Dk6dOt2o.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './image.service-iLwePKJ0.js';
import './TouchPan-CIOdv6jG.js';
import './touch-CAyG4izs.js';
import './position-engine-Bv76xS6k.js';
import './ClosePopup-D9BZcpVj.js';
import './QResizeObserver-C4jaR1Qo.js';
const Qe = '/assets/buu-get-logo-qwYoEG7g.png',
  ve = Ne('auth', () => {
    const l = h(!1),
      n = h(null),
      a = h(localStorage.getItem('access_token'));
    async function g(c) {
      ((l.value = !0), (n.value = null));
      try {
        return { success: !0, data: (await ae.post('/auth/register', c)).data };
      } catch (i) {
        const o = i.response?.data?.message || 'Registration failed';
        return ((n.value = o), { success: !1, message: o });
      } finally {
        l.value = !1;
      }
    }
    async function b(c) {
      ((l.value = !0), (n.value = null));
      try {
        const i = await ae.post('/auth/login', c),
          { accessToken: r, user: o } = i.data;
        return (
          (a.value = r),
          localStorage.setItem('access_token', r),
          localStorage.setItem('isLoggedIn', 'true'),
          o?.id && localStorage.setItem('user_id', String(o.id)),
          { success: !0, accessToken: r, user: o }
        );
      } catch (i) {
        const o = i.response?.data?.message || 'Login failed';
        return ((n.value = o), { success: !1, message: o });
      } finally {
        l.value = !1;
      }
    }
    async function y(c) {
      ((l.value = !0), (n.value = null));
      try {
        return (await ae.post('/auth/send-otp', { email: c }), { success: !0 });
      } catch (i) {
        const o = i.response?.data?.message || 'Failed to send OTP';
        return ((n.value = o), { success: !1, message: o });
      } finally {
        l.value = !1;
      }
    }
    async function f(c, i) {
      ((l.value = !0), (n.value = null));
      try {
        return (await ae.post('/auth/verify-otp', { email: c, otp: i }), { success: !0 });
      } catch (r) {
        const d = r.response?.data?.message || 'Invalid OTP';
        return ((n.value = d), { success: !1, message: d });
      } finally {
        l.value = !1;
      }
    }
    function v() {
      ((a.value = null),
        localStorage.removeItem('access_token'),
        localStorage.removeItem('isLoggedIn'),
        localStorage.removeItem('user_id'));
    }
    function w() {
      n.value = null;
    }
    return {
      isLoading: l,
      error: n,
      accessToken: a,
      register: g,
      login: b,
      sendOtp: y,
      verifyOtp: f,
      logout: v,
      clearError: w,
    };
  }),
  $e = '/assets/buu-logo-qkMljDtu.png',
  Ge = { class: 'login-card' },
  Ke = { class: 'card-header' },
  Xe = { class: 'type-toggle' },
  je = { key: 0, class: 'thaid-section' },
  We = { class: 'or-divider' },
  Je = { class: 'field-block' },
  Ye = { class: 'text-body2 text-weight-medium q-mb-xs field-label block' },
  Ze = { class: 'field-block' },
  et = { class: 'field-label-row' },
  tt = { class: 'text-body2 text-weight-medium q-mb-xs field-label block' },
  lt = { href: '#', class: 'forgot-link' },
  at = { class: 'register-row' },
  ot = G({
    __name: 'login-card',
    setup(l) {
      const n = ie(),
        a = be(),
        g = Ve(),
        b = le(),
        { t: y, locale: f } = K(),
        v = h('thai'),
        w = h(''),
        c = h(''),
        i = h(!1),
        r = h(!1);
      ne(() => {
        v.value = f.value === 'th' ? 'thai' : 'foreigner';
      });
      const o = (p) => {
          ((v.value = p), (f.value = p === 'thai' ? 'th' : 'en-US'));
        },
        d = async () => {
          if (!w.value || !c.value) {
            b.notify({ type: 'warning', message: y('auth.notify.required') });
            return;
          }
          r.value = !0;
          try {
            if (await g.login(w.value, c.value)) {
              if (
                (b.notify({ type: 'positive', message: y('auth.notify.success') }),
                a.query.redirect)
              ) {
                await n.push(a.query.redirect);
                return;
              }
              const $ = g.userRole?.toLowerCase();
              (console.log('Login successful. User Role:', $),
                $ === te.CANDIDATE
                  ? g.currentUser?.remark
                    ? await n.push({ name: 'user-profile', query: { from: 'email' } })
                    : await n.push({ name: 'exam-schedule' })
                  : $ === te.EXAM_OPERATIONS_OFFICER
                    ? await n.push({ name: 'admin-exam-management' })
                    : $ === te.ADMIN || $ === te.STAFF || $ === te.REGISTRATION_OFFICER
                      ? await n.push({ name: 'admin-exam-management' })
                      : await n.push({ name: 'admin-dashboard' }));
            } else b.notify({ type: 'negative', message: y('auth.notify.failed') });
          } catch (p) {
            (console.error('Login Error:', p),
              b.notify({ type: 'negative', message: y('auth.notify.error') }));
          } finally {
            r.value = !1;
          }
        };
      return (p, $) => {
        const O = Te('router-link');
        return (
          S(),
          P('div', Ge, [
            e('div', Ke, [
              $[5] || ($[5] = e('img', { src: $e, alt: 'BUU Logo', class: 'crest-img' }, null, -1)),
              e('h2', null, N(p.$t('auth.welcome')), 1),
              e('p', null, N(p.$t('auth.signInToContinue')), 1),
            ]),
            e('div', Xe, [
              e(
                'button',
                {
                  class: ee(['toggle-btn', { active: v.value === 'thai' }]),
                  onClick: $[0] || ($[0] = (x) => o('thai')),
                },
                N(p.$t('auth.thaiPerson')),
                3,
              ),
              e(
                'button',
                {
                  class: ee(['toggle-btn', { active: v.value === 'foreigner' }]),
                  onClick: $[1] || ($[1] = (x) => o('foreigner')),
                },
                N(p.$t('auth.foreigner')),
                3,
              ),
              e(
                'div',
                { class: ee(['toggle-slider', { right: v.value === 'foreigner' }]) },
                null,
                2,
              ),
            ]),
            s(
              ce,
              { name: 'expand' },
              {
                default: C(() => [
                  v.value === 'thai'
                    ? (S(),
                      P('div', je, [
                        s(
                          z,
                          { class: 'thaid-btn', unelevated: '', 'no-caps': '' },
                          {
                            default: C(() => [
                              s(Q, { name: 'fingerprint', size: '18px', class: 'q-mr-sm' }),
                              Y(' ' + N(p.$t('auth.loginThaID')), 1),
                            ]),
                            _: 1,
                          },
                        ),
                        e('div', We, [e('span', null, N(p.$t('auth.orUseEmail')), 1)]),
                      ]))
                    : X('', !0),
                ]),
                _: 1,
              },
            ),
            s(
              fe,
              { onSubmit: pe(d, ['prevent']), class: 'login-form' },
              {
                default: C(() => [
                  e('div', Je, [
                    e('div', Ye, N(p.$t('auth.email')), 1),
                    s(
                      J,
                      {
                        modelValue: w.value,
                        'onUpdate:modelValue': $[2] || ($[2] = (x) => (w.value = x)),
                        outlined: '',
                        dense: '',
                        placeholder: p.$t('auth.emailPlaceholder'),
                        class: 'custom-input',
                      },
                      { prepend: C(() => [s(Q, { name: 'mail', size: '18px' })]), _: 1 },
                      8,
                      ['modelValue', 'placeholder'],
                    ),
                  ]),
                  e('div', Ze, [
                    e('div', et, [
                      e('div', tt, N(p.$t('auth.password')), 1),
                      e('a', lt, N(p.$t('auth.forgotPassword')), 1),
                    ]),
                    s(
                      J,
                      {
                        modelValue: c.value,
                        'onUpdate:modelValue': $[4] || ($[4] = (x) => (c.value = x)),
                        type: i.value ? 'text' : 'password',
                        outlined: '',
                        dense: '',
                        placeholder: p.$t('auth.passwordPlaceholder'),
                        class: 'custom-input',
                      },
                      {
                        prepend: C(() => [s(Q, { name: 'lock_outline', size: '18px' })]),
                        append: C(() => [
                          s(
                            Q,
                            {
                              name: i.value ? 'visibility_off' : 'visibility',
                              size: '18px',
                              class: 'cursor-pointer',
                              onClick: $[3] || ($[3] = (x) => (i.value = !i.value)),
                            },
                            null,
                            8,
                            ['name'],
                          ),
                        ]),
                        _: 1,
                      },
                      8,
                      ['modelValue', 'type', 'placeholder'],
                    ),
                  ]),
                  s(
                    z,
                    {
                      type: 'submit',
                      class: 'submit-btn',
                      unelevated: '',
                      'no-caps': '',
                      loading: r.value,
                    },
                    { default: C(() => [Y(N(p.$t('auth.login')), 1)]), _: 1 },
                    8,
                    ['loading'],
                  ),
                ]),
                _: 1,
              },
            ),
            e('div', at, [
              s(
                O,
                { to: '/register', class: 'text-primary text-decoration-none text-body2' },
                { default: C(() => [Y(N(p.$t('auth.createAccount')), 1)]), _: 1 },
              ),
            ]),
          ])
        );
      };
    },
  }),
  st = j(ot, [['__scopeId', 'data-v-7267a5d4']]),
  it = { class: 'otp-icon-wrap' },
  nt = { class: 'otp-title' },
  rt = { class: 'otp-subtitle' },
  dt = { class: 'otp-timer' },
  ut = { class: 'otp-input-row' },
  ct = ['disabled'],
  Z = 6,
  ye = 300,
  pt = G({
    __name: 'otp-verification-dialog',
    props: {
      modelValue: { type: Boolean },
      isSending: { type: Boolean, default: !1 },
      isVerifying: { type: Boolean, default: !1 },
    },
    emits: ['update:modelValue', 'verify', 'resend'],
    setup(l, { emit: n }) {
      const a = l,
        g = n,
        b = K(),
        { t: y } = b,
        f = (I, V) => (b.te(I) ? y(I) : V),
        v = h(Array.from({ length: Z }, () => '')),
        w = h([]),
        c = h(ye);
      let i = null;
      const r = H(() => a.isSending || a.isVerifying),
        o = H(() => v.value.join('')),
        d = H(() => {
          const I = Math.floor(c.value / 60),
            V = c.value % 60;
          return `${String(I).padStart(2, '0')} : ${String(V).padStart(2, '0')}`;
        }),
        p = (I, V) => {
          w.value[V] = I;
        },
        $ = async (I) => {
          (await oe(), w.value[I]?.focus());
        },
        O = () => {
          ((v.value = Array.from({ length: Z }, () => '')), $(0));
        },
        x = () => {
          (i && window.clearInterval(i),
            (c.value = ye),
            (i = window.setInterval(() => {
              if (c.value <= 0) {
                (i !== null && window.clearInterval(i), (i = null));
                return;
              }
              c.value -= 1;
            }, 1e3)));
        },
        L = (I, V) => {
          const M = String(I ?? '')
            .replace(/\D/g, '')
            .slice(-1);
          ((v.value[V] = M), M && V < Z - 1 && $(V + 1));
        },
        m = (I, V) => {
          I.key === 'Backspace' && !v.value[V] && V > 0 && $(V - 1);
        },
        U = (I) => {
          const M = (I.clipboardData?.getData('text') ?? '')
            .replace(/\D/g, '')
            .slice(0, Z)
            .split('');
          M.length &&
            (I.preventDefault(),
            (v.value = Array.from({ length: Z }, (F, A) => M[A] ?? '')),
            $(Math.min(M.length, Z - 1)));
        },
        R = () => {
          (O(), x(), g('resend'));
        };
      return (
        de(
          () => a.modelValue,
          (I) => {
            if (I) {
              (O(), x());
              return;
            }
            i && (window.clearInterval(i), (i = null));
          },
        ),
        Ie(() => {
          i && window.clearInterval(i);
        }),
        (I, V) => (
          S(),
          W(
            me,
            {
              'model-value': l.modelValue,
              persistent: '',
              'onUpdate:modelValue': V[2] || (V[2] = (M) => g('update:modelValue', M)),
            },
            {
              default: C(() => [
                s(
                  ue,
                  { class: 'otp-card' },
                  {
                    default: C(() => [
                      s(
                        z,
                        {
                          flat: '',
                          round: '',
                          dense: '',
                          icon: 'close',
                          class: 'otp-close-btn',
                          disable: r.value,
                          onClick: V[0] || (V[0] = (M) => g('update:modelValue', !1)),
                        },
                        null,
                        8,
                        ['disable'],
                      ),
                      e('div', it, [s(Q, { name: 'mail', size: '32px', color: 'dark' })]),
                      e('div', nt, N(f('profile.otpTitle', 'ยืนยันรหัส OTP')), 1),
                      e(
                        'div',
                        rt,
                        N(f('profile.otpSubtitle', 'กรุณากรอกรหัส OTP ที่ส่งไปยังอีเมลของคุณ')),
                        1,
                      ),
                      e('div', dt, N(d.value), 1),
                      e('div', ut, [
                        (S(!0),
                        P(
                          Se,
                          null,
                          ke(
                            v.value,
                            (M, F) => (
                              S(),
                              W(
                                J,
                                {
                                  key: F,
                                  ref_for: !0,
                                  ref: (A) => p(A, F),
                                  'model-value': v.value[F] ?? '',
                                  outlined: '',
                                  dense: '',
                                  maxlength: '1',
                                  'input-class': 'text-center otp-digit-input',
                                  class: 'otp-digit',
                                  disable: r.value,
                                  'onUpdate:modelValue': (A) => L(A, F),
                                  onKeydown: (A) => m(A, F),
                                  onPaste: U,
                                },
                                null,
                                8,
                                ['model-value', 'disable', 'onUpdate:modelValue', 'onKeydown'],
                              )
                            ),
                          ),
                          128,
                        )),
                      ]),
                      s(
                        z,
                        {
                          unelevated: '',
                          color: 'primary',
                          class: 'otp-confirm-btn',
                          label: f('profile.otpConfirm', 'ยืนยัน'),
                          loading: l.isVerifying,
                          disable: o.value.length !== v.value.length || l.isSending,
                          onClick: V[1] || (V[1] = (M) => g('verify', o.value)),
                        },
                        null,
                        8,
                        ['label', 'loading', 'disable'],
                      ),
                      e(
                        'button',
                        { class: 'otp-resend-btn', type: 'button', disabled: r.value, onClick: R },
                        N(f('profile.otpResend', 'ส่งรหัสอีกครั้ง')),
                        9,
                        ct,
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
        )
      );
    },
  }),
  Ee = j(pt, [['__scopeId', 'data-v-a87661ef']]),
  mt = { class: 'register-card' },
  ft = { class: 'row justify-center q-mb-xs' },
  vt = ['alt'],
  gt = { class: 'text-center q-mb-sm' },
  ht = { class: 'register-title' },
  yt = { class: 'field-block' },
  bt = { class: 'text-body2 text-weight-medium q-mb-xs field-label block' },
  wt = { class: 'field-block' },
  $t = { class: 'text-body2 text-weight-medium q-mb-xs field-label block' },
  Et = { class: 'field-block' },
  Nt = { class: 'text-body2 text-weight-medium q-mb-xs field-label block' },
  Vt = { class: 'otp-helper-text' },
  Tt = { class: 'row q-col-gutter-sm' },
  It = { class: 'col-6' },
  St = { class: 'col-6' },
  kt = { key: 0, class: 'thaid-section' },
  Ct = { class: 'or-divider' },
  _t = G({
    __name: 'register-card',
    emits: ['register', 'thaid-register'],
    setup(l, { emit: n }) {
      const a = n,
        g = K(),
        { locale: b } = g,
        { t: y } = g,
        f = (k, q) => (g.te(k) ? y(k) : q),
        v = le(),
        w = ie(),
        c = ve(),
        i = h('thai'),
        r = h(null),
        o = h(''),
        d = h(''),
        p = h(''),
        $ = h(!1),
        O = h(!1),
        x = h(!1),
        L = h(!1),
        m = h(!1),
        { validateAndFocusFirstInvalid: U } = we(r);
      ne(() => {
        i.value = b.value === 'th' ? 'thai' : 'foreigner';
      });
      const R = () => {
          w.push('/login');
        },
        I = async () => {
          L.value = !0;
          try {
            const k = await c.sendOtp(o.value);
            return k.success
              ? (v.notify({
                  type: 'positive',
                  message: f('profile.otpSendSuccess', 'ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว'),
                  position: 'top',
                }),
                !0)
              : (v.notify({
                  type: 'negative',
                  message: k.message || f('profile.otpSendError', 'ไม่สามารถส่งรหัส OTP ได้'),
                  position: 'top',
                }),
                !1);
          } finally {
            L.value = !1;
          }
        },
        V = async () => {
          if (!(await U())) return;
          (await I()) && (x.value = !0);
        },
        M = async (k) => {
          m.value = !0;
          try {
            const q = await c.verifyOtp(o.value, k);
            if (!q.success) {
              v.notify({
                type: 'negative',
                message: q.message || f('profile.otpVerifyError', 'ไม่สามารถยืนยันรหัส OTP ได้'),
                position: 'top',
              });
              return;
            }
            ((x.value = !1),
              a('register', {
                email: o.value,
                password: d.value,
                confirmPassword: p.value,
                userType: i.value,
                registrationMethod: 'email',
              }));
          } finally {
            m.value = !1;
          }
        },
        F = async () => {
          await I();
        },
        A = () => {
          a('thaid-register', {
            email: '',
            password: '',
            userType: 'thai',
            registrationMethod: 'thaid',
          });
        };
      return (k, q) => (
        S(),
        P('div', mt, [
          e('div', ft, [
            e(
              'img',
              { src: $e, alt: k.$t('profile.buuLogoAlt'), class: 'buu-logo-img' },
              null,
              8,
              vt,
            ),
          ]),
          e('div', gt, [e('div', ht, N(k.$t('profile.register')), 1)]),
          s(
            fe,
            { ref_key: 'formRef', ref: r, onSubmit: pe(V, ['prevent']), class: 'register-form' },
            {
              default: C(() => [
                e('div', yt, [
                  e('div', bt, N(k.$t('profile.email')), 1),
                  s(
                    J,
                    {
                      modelValue: o.value,
                      'onUpdate:modelValue': q[0] || (q[0] = (u) => (o.value = u)),
                      outlined: '',
                      dense: '',
                      placeholder: k.$t('profile.emailPlaceholder'),
                      class: 'custom-input',
                      rules: [
                        (u) => !!u || k.$t('profile.requiredEmail'),
                        (u) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u) || 'รูปแบบอีเมลไม่ถูกต้อง',
                      ],
                      'lazy-rules': '',
                      'hide-bottom-space': '',
                    },
                    null,
                    8,
                    ['modelValue', 'placeholder', 'rules'],
                  ),
                ]),
                e('div', wt, [
                  e('div', $t, N(k.$t('profile.password')), 1),
                  s(
                    J,
                    {
                      modelValue: d.value,
                      'onUpdate:modelValue': q[2] || (q[2] = (u) => (d.value = u)),
                      type: $.value ? 'text' : 'password',
                      outlined: '',
                      dense: '',
                      class: 'custom-input',
                      rules: [
                        (u) => !!u || k.$t('profile.requiredPassword'),
                        (u) => u.length >= 8 || k.$t('profile.passwordFormat'),
                      ],
                      'lazy-rules': '',
                      'hide-bottom-space': '',
                    },
                    {
                      append: C(() => [
                        s(
                          Q,
                          {
                            name: $.value ? 'visibility_off' : 'visibility',
                            class: 'cursor-pointer field-icon',
                            onClick: q[1] || (q[1] = (u) => ($.value = !$.value)),
                          },
                          null,
                          8,
                          ['name'],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    ['modelValue', 'type', 'rules'],
                  ),
                ]),
                e('div', Et, [
                  e('div', Nt, N(k.$t('profile.confirmPassword')), 1),
                  s(
                    J,
                    {
                      modelValue: p.value,
                      'onUpdate:modelValue': q[4] || (q[4] = (u) => (p.value = u)),
                      type: O.value ? 'text' : 'password',
                      outlined: '',
                      dense: '',
                      class: 'custom-input',
                      rules: [
                        (u) => !!u || k.$t('profile.requiredConfirmPassword'),
                        (u) => u === d.value || k.$t('profile.passwordMismatch'),
                      ],
                      'lazy-rules': '',
                      'hide-bottom-space': '',
                    },
                    {
                      append: C(() => [
                        s(
                          Q,
                          {
                            name: O.value ? 'visibility_off' : 'visibility',
                            class: 'cursor-pointer field-icon',
                            onClick: q[3] || (q[3] = (u) => (O.value = !O.value)),
                          },
                          null,
                          8,
                          ['name'],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    ['modelValue', 'type', 'rules'],
                  ),
                ]),
                e('div', Vt, N(k.$t('profile.emailOtpHelper')), 1),
                e('div', Tt, [
                  e('div', It, [
                    s(
                      z,
                      {
                        type: 'button',
                        class: 'full-width cancel-btn',
                        label: k.$t('profile.cancel'),
                        'no-caps': '',
                        unelevated: '',
                        onClick: R,
                      },
                      null,
                      8,
                      ['label'],
                    ),
                  ]),
                  e('div', St, [
                    s(
                      z,
                      {
                        type: 'submit',
                        class: 'full-width submit-btn',
                        label: k.$t('profile.sendOtp'),
                        loading: L.value,
                        'no-caps': '',
                        unelevated: '',
                      },
                      null,
                      8,
                      ['label', 'loading'],
                    ),
                  ]),
                ]),
                s(
                  ce,
                  { name: 'expand' },
                  {
                    default: C(() => [
                      i.value === 'thai'
                        ? (S(),
                          P('div', kt, [
                            e('div', Ct, [e('span', null, N(k.$t('profile.or')), 1)]),
                            s(
                              z,
                              {
                                class: 'full-width thaid-btn',
                                unelevated: '',
                                'no-caps': '',
                                onClick: A,
                              },
                              {
                                default: C(() => [
                                  s(Q, { name: 'fingerprint', size: '20px', class: 'q-mr-sm' }),
                                  Y(' ' + N(k.$t('profile.thaidRegister')), 1),
                                ]),
                                _: 1,
                              },
                            ),
                          ]))
                        : X('', !0),
                    ]),
                    _: 1,
                  },
                ),
              ]),
              _: 1,
            },
            512,
          ),
          s(
            Ee,
            {
              modelValue: x.value,
              'onUpdate:modelValue': q[5] || (q[5] = (u) => (x.value = u)),
              'is-sending': L.value,
              'is-verifying': m.value,
              onVerify: M,
              onResend: F,
            },
            null,
            8,
            ['modelValue', 'is-sending', 'is-verifying'],
          ),
        ])
      );
    },
  }),
  Ut = j(_t, [['__scopeId', 'data-v-93dfa71d']]),
  qt = [
    { code: 'TH', nameEN: 'Thailand' },
    { code: 'CN', nameEN: 'China' },
    { code: 'JP', nameEN: 'Japan' },
    { code: 'KR', nameEN: 'South Korea' },
    { code: 'SG', nameEN: 'Singapore' },
    { code: 'MY', nameEN: 'Malaysia' },
    { code: 'US', nameEN: 'United States' },
    { code: 'GB', nameEN: 'United Kingdom' },
  ],
  Pt = [
    { code: 'AU', nameEN: 'Australia' },
    { code: 'AT', nameEN: 'Austria' },
    { code: 'BE', nameEN: 'Belgium' },
    { code: 'BR', nameEN: 'Brazil' },
    { code: 'KH', nameEN: 'Cambodia' },
    { code: 'CA', nameEN: 'Canada' },
    { code: 'CN', nameEN: 'China' },
    { code: 'DK', nameEN: 'Denmark' },
    { code: 'EG', nameEN: 'Egypt' },
    { code: 'FI', nameEN: 'Finland' },
    { code: 'FR', nameEN: 'France' },
    { code: 'DE', nameEN: 'Germany' },
    { code: 'GH', nameEN: 'Ghana' },
    { code: 'GR', nameEN: 'Greece' },
    { code: 'HK', nameEN: 'Hong Kong' },
    { code: 'HU', nameEN: 'Hungary' },
    { code: 'IN', nameEN: 'India' },
    { code: 'ID', nameEN: 'Indonesia' },
    { code: 'IE', nameEN: 'Ireland' },
    { code: 'IL', nameEN: 'Israel' },
    { code: 'IT', nameEN: 'Italy' },
    { code: 'JP', nameEN: 'Japan' },
    { code: 'KR', nameEN: 'South Korea' },
    { code: 'LA', nameEN: 'Laos' },
    { code: 'MY', nameEN: 'Malaysia' },
    { code: 'MX', nameEN: 'Mexico' },
    { code: 'MM', nameEN: 'Myanmar' },
    { code: 'NL', nameEN: 'Netherlands' },
    { code: 'NZ', nameEN: 'New Zealand' },
    { code: 'NG', nameEN: 'Nigeria' },
    { code: 'NO', nameEN: 'Norway' },
    { code: 'PK', nameEN: 'Pakistan' },
    { code: 'PH', nameEN: 'Philippines' },
    { code: 'PL', nameEN: 'Poland' },
    { code: 'PT', nameEN: 'Portugal' },
    { code: 'RU', nameEN: 'Russia' },
    { code: 'SA', nameEN: 'Saudi Arabia' },
    { code: 'SG', nameEN: 'Singapore' },
    { code: 'ZA', nameEN: 'South Africa' },
    { code: 'ES', nameEN: 'Spain' },
    { code: 'SE', nameEN: 'Sweden' },
    { code: 'CH', nameEN: 'Switzerland' },
    { code: 'TW', nameEN: 'Taiwan' },
    { code: 'TH', nameEN: 'Thailand' },
    { code: 'TR', nameEN: 'Turkey' },
    { code: 'AE', nameEN: 'UAE' },
    { code: 'UA', nameEN: 'Ukraine' },
    { code: 'GB', nameEN: 'United Kingdom' },
    { code: 'US', nameEN: 'United States' },
    { code: 'VN', nameEN: 'Vietnam' },
  ],
  xt = {
    นาย: 'Mr.',
    นาง: 'Mrs.',
    นางสาว: 'Miss',
    ด็อกเตอร์: 'Dr.',
    ศาสตราจารย์: 'Prof.',
    รองศาสตราจารย์: 'Assoc. Prof.',
    ผู้ช่วยศาสตราจารย์: 'Asst. Prof.',
  },
  re = { featured: qt, all: Pt, titleMap: xt };
function Ot() {
  const l = re.featured,
    n = [...re.all].sort((y, f) => y.nameEN.localeCompare(f.nameEN)),
    a = new Set(l.map((y) => y.code)),
    g = n.filter((y) => !a.has(y.code)),
    b = re.titleMap;
  return { featuredCountries: l, allCountries: n, otherCountries: g, titleMap: b };
}
function Mt(l, n) {
  const a = ie(),
    { t: g } = K(),
    { titleMap: b } = Ot(),
    y = {
      profileImage: '',
      nationalId: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: 'TH',
      titleTH: '',
      titleEN: '',
      fullName: '',
      englishName: '',
      birthdate: '',
      phone: '',
      educationLevel: '',
      faculty: '',
      institution: '',
      address: '',
    },
    f = h({ ...y }),
    v = h({ show: !1, type: '', message: '' }),
    w = H(() => f.value.country === 'TH');
  return {
    formData: f,
    dialog: v,
    isThailand: w,
    initFormData: (p) => {
      l &&
        p &&
        (f.value = {
          ...y,
          nationalId: p.nationalId,
          email: p.email,
          country: p.country ?? 'TH',
          titleTH: p.titleTH,
          titleEN: p.titleEN,
          fullName: p.fullNameTH,
          englishName: p.fullNameEN,
          birthdate: p.birthdate,
          phone: p.phone,
          educationLevel: p.educationLevel,
          faculty: p.faculty ?? '',
          institution: p.institution ?? '',
          address: p.address,
          userImagePath: p.userImagePath || void 0,
        });
    },
    handleCountryChange: () => {
      ((f.value.titleTH = ''), (f.value.titleEN = ''), (f.value.fullName = ''));
    },
    handleTitleTHChange: () => {
      f.value.titleEN = b[f.value.titleTH] || '';
    },
    submitForm: () => {
      try {
        (n({ ...f.value, address: f.value.address?.trim() || null }),
          l &&
            (v.value = { show: !0, type: 'success', message: g('profile.dialogUpdateSuccess') }));
      } catch (p) {
        console.error(p);
      }
    },
    onDialogClose: () => {
      ((v.value.show = !1), !l && v.value.type === 'success' && a.push('/exam-history'));
    },
  };
}
const Rt = { class: 'image-upload-container' },
  At = { key: 0, class: 'preview-wrapper' },
  Ft = { class: 'preview-image-container' },
  Ht = ['src', 'alt'],
  Lt = { class: 'preview-overlay' },
  Bt = { class: 'upload-zone-content' },
  zt = { key: 2, class: 'upload-progress' },
  Dt = { class: 'text-caption text-center q-mt-sm' },
  Qt = G({
    __name: 'image-upload',
    props: { modelValue: { default: null }, folder: {}, alt: { default: 'Uploaded image' } },
    emits: ['update:modelValue'],
    setup(l, { emit: n }) {
      const a = l,
        g = n,
        { t: b } = K(),
        y = le(),
        f = h(),
        v = h(null),
        w = h(!1),
        c = h(''),
        i = h('image/jpeg'),
        { isUploading: r, handleImageUpload: o } = Ae({
          onSuccess: (m) => {
            (g('update:modelValue', m), (v.value = null));
          },
          onError: (m) => {
            y.notify({
              type: 'negative',
              message: m.message || 'อัปโหลดรูปภาพไม่สำเร็จ',
              position: 'top',
            });
          },
        }),
        { displayUrl: d } = He(() => a.modelValue),
        p = H(() => b('image.upload.uploading') ?? 'Uploading...'),
        $ = () => {
          ((v.value = null), f.value?.pickFiles());
        },
        O = (m) => {
          if (!m) return;
          if (
            !(
              m.type === 'image/jpeg' ||
              m.name.toLowerCase().endsWith('.jpg') ||
              m.name.toLowerCase().endsWith('.jpeg')
            )
          ) {
            (y.notify({
              type: 'negative',
              message: 'กรุณาอัปโหลดรูปภาพนามสกุล JPG หรือ JPEG เท่านั้น',
              position: 'top',
            }),
              (v.value = null));
            return;
          }
          const R = 40 * 1024;
          if (m.size < R) {
            (y.notify({
              type: 'negative',
              message: 'ขนาดไฟล์ต้องมีขนาดไม่ต่ำกว่า 40 KB',
              position: 'top',
            }),
              (v.value = null));
            return;
          }
          i.value = 'image/jpeg';
          const I = new FileReader();
          ((I.onload = (V) => {
            V.target?.result && ((c.value = V.target.result), (w.value = !0));
          }),
            I.readAsDataURL(m),
            (v.value = null));
        },
        x = async (m) => {
          w.value = !1;
          try {
            await o(m, a.folder);
          } catch (U) {
            console.error('Error uploading image:', U);
          }
        },
        L = () => {
          g('update:modelValue', '');
        };
      return (m, U) => (
        S(),
        P('div', Rt, [
          s(
            Me,
            {
              ref_key: 'fileInputRef',
              ref: f,
              modelValue: v.value,
              'onUpdate:modelValue': [U[0] || (U[0] = (R) => (v.value = R)), O],
              accept: '.jpg,.jpeg',
              'max-file-size': '5242880',
              dense: '',
              filled: '',
              class: 'hidden-file-input',
              style: { display: 'none' },
            },
            null,
            8,
            ['modelValue'],
          ),
          t(d)
            ? (S(),
              P('div', At, [
                e('div', Ft, [
                  e('img', { src: t(d), alt: l.alt, class: 'preview-image' }, null, 8, Ht),
                  e('div', Lt, [
                    s(z, {
                      flat: '',
                      dense: '',
                      round: '',
                      icon: 'edit',
                      size: 'md',
                      color: 'white',
                      class: 'preview-edit-btn',
                      onClick: $,
                    }),
                    s(z, {
                      flat: '',
                      dense: '',
                      round: '',
                      icon: 'close',
                      size: 'md',
                      color: 'white',
                      class: 'preview-delete-btn',
                      onClick: L,
                    }),
                  ]),
                ]),
              ]))
            : (S(),
              P('div', { key: 1, class: 'upload-zone', onClick: $ }, [
                e('div', Bt, [s(Q, { name: 'add_photo_alternate', size: '48px', color: 'black' })]),
              ])),
          t(r)
            ? (S(),
              P('div', zt, [
                s(Fe, { indeterminate: '', color: 'primary' }),
                e('p', Dt, N(p.value), 1),
              ]))
            : X('', !0),
          s(
            me,
            {
              modelValue: w.value,
              'onUpdate:modelValue': U[2] || (U[2] = (R) => (w.value = R)),
              persistent: '',
            },
            {
              default: C(() => [
                s(
                  Re,
                  {
                    'image-src': c.value,
                    'file-type': i.value,
                    onConfirm: x,
                    onCancel: U[1] || (U[1] = (R) => (w.value = !1)),
                  },
                  null,
                  8,
                  ['image-src', 'file-type'],
                ),
              ]),
              _: 1,
            },
            8,
            ['modelValue'],
          ),
        ])
      );
    },
  }),
  Gt = j(Qt, [['__scopeId', 'data-v-dcf96aaa']]),
  Kt = { class: 'photo-section' },
  Xt = { class: 'photo-upload-cell' },
  jt = { class: 'requirements-cell' },
  Wt = { class: 'requirements-card bg-white' },
  Jt = { class: 'requirements-title' },
  Yt = { class: 'requirements-content' },
  Zt = { class: 'requirements-copy' },
  el = { class: 'requirements-list' },
  tl = { class: 'requirements-sample' },
  ll = { class: 'sample-photo-container' },
  al = ['alt'],
  ol = { class: 'sample-photo-text' },
  sl = G({
    __name: 'photo-section',
    props: { profileImage: { required: !0 }, profileImageModifiers: {} },
    emits: ['update:profileImage'],
    setup(l) {
      const { t: n } = K(),
        a = B(l, 'profileImage');
      return (g, b) => (
        S(),
        P('div', Kt, [
          e('div', Xt, [
            s(
              Gt,
              {
                modelValue: a.value,
                'onUpdate:modelValue': b[0] || (b[0] = (y) => (a.value = y)),
                folder: '/user_images',
                alt: t(n)('profile.photoRequirementsTitle'),
                class: 'photo-upload-box',
              },
              null,
              8,
              ['modelValue', 'alt'],
            ),
          ]),
          e('div', jt, [
            e('div', Wt, [
              e('div', Jt, N(t(n)('profile.photoRequirementsTitle')), 1),
              e('div', Yt, [
                e('div', Zt, [
                  e('ul', el, [
                    e('li', null, N(t(n)('profile.photoReq1')), 1),
                    e('li', null, N(t(n)('profile.photoReq2')), 1),
                    e('li', null, N(t(n)('profile.photoReq3')), 1),
                    e('li', null, N(t(n)('profile.photoReq4')), 1),
                    e('li', null, N(t(n)('profile.photoReq5')), 1),
                    e('li', null, N(t(n)('profile.photoReq6')), 1),
                  ]),
                ]),
                e('div', tl, [
                  e('div', ll, [
                    e(
                      'img',
                      {
                        src: '/sample-img.png',
                        alt: t(n)('profile.samplePhotoAlt'),
                        class: 'sample-photo-img',
                      },
                      null,
                      8,
                      al,
                    ),
                  ]),
                  e('div', ol, N(t(n)('profile.samplePhoto')), 1),
                ]),
              ]),
            ]),
          ]),
        ])
      );
    },
  }),
  il = j(sl, [['__scopeId', 'data-v-0a841c72']]),
  nl = { class: 'text-body2 text-weight-medium q-mb-xs field-label' },
  rl = { key: 0, class: 'text-negative' },
  D = G({
    inheritAttrs: !1,
    __name: 'app-form-field',
    props: {
      label: {},
      modelValue: {},
      type: { default: 'text' },
      placeholder: {},
      options: {},
      readonly: { type: Boolean, default: !1 },
      required: { type: Boolean, default: !1 },
      rules: {},
      inputClass: {},
      reserveBottomSpace: { type: Boolean, default: !1 },
    },
    emits: ['update:modelValue'],
    setup(l) {
      return (n, a) => (
        S(),
        P('div', null, [
          e('div', nl, [
            Y(N(l.label) + ' ', 1),
            l.required ? (S(), P('span', rl, '*')) : X('', !0),
          ]),
          l.type === 'select'
            ? (S(),
              W(
                Be,
                ge(
                  {
                    key: 0,
                    'model-value': l.modelValue ?? null,
                    'onUpdate:modelValue': a[0] || (a[0] = (g) => n.$emit('update:modelValue', g)),
                    options: l.options ? [...l.options] : void 0,
                    'emit-value': '',
                    'map-options': '',
                    outlined: '',
                    dense: '',
                    readonly: l.readonly,
                    rules: l.rules ? [...l.rules] : void 0,
                    'hide-bottom-space': !l.reserveBottomSpace,
                    class: ['custom-input', l.inputClass],
                  },
                  n.$attrs,
                ),
                null,
                16,
                ['model-value', 'options', 'readonly', 'rules', 'hide-bottom-space', 'class'],
              ))
            : (S(),
              W(
                J,
                ge(
                  {
                    key: 1,
                    'model-value': l.modelValue ?? null,
                    'onUpdate:modelValue': a[1] || (a[1] = (g) => n.$emit('update:modelValue', g)),
                    type: l.type === 'date' ? 'text' : l.type,
                    placeholder: l.placeholder,
                    outlined: '',
                    dense: '',
                    'stack-label': l.type === 'date',
                    readonly: l.readonly || l.type === 'date',
                    rules: l.rules ? [...l.rules] : void 0,
                    'hide-bottom-space': !l.reserveBottomSpace,
                    rows: l.type === 'textarea' ? 5 : void 0,
                    class: ['custom-input', l.inputClass],
                  },
                  n.$attrs,
                ),
                Ce({ _: 2 }, [
                  l.type === 'date'
                    ? {
                        name: 'append',
                        fn: C(() => [
                          s(
                            Q,
                            { name: 'event', class: 'cursor-pointer' },
                            { default: C(() => [_e(n.$slots, 'append-inner')]), _: 3 },
                          ),
                        ]),
                        key: '0',
                      }
                    : void 0,
                ]),
                1040,
                [
                  'model-value',
                  'type',
                  'placeholder',
                  'stack-label',
                  'readonly',
                  'rules',
                  'hide-bottom-space',
                  'rows',
                  'class',
                ],
              )),
        ])
      );
    },
  }),
  dl = { class: 'education-section' },
  ul = { class: 'relative-position' },
  cl = G({
    __name: 'education-section',
    props: {
      birthdate: { required: !0 },
      birthdateModifiers: {},
      educationLevel: { required: !0 },
      educationLevelModifiers: {},
      faculty: { required: !0 },
      facultyModifiers: {},
    },
    emits: ['update:birthdate', 'update:educationLevel', 'update:faculty'],
    setup(l) {
      const { t: n } = K(),
        a = h(!1),
        g = H(() => {
          const w = new Date();
          return (w.setDate(w.getDate() - 1), w.toISOString().split('T')[0]);
        }),
        b = B(l, 'birthdate'),
        y = B(l, 'educationLevel'),
        f = B(l, 'faculty'),
        v = H(() => [
          { label: n('profile.eduHighSchool'), value: 'มัธยมศึกษา' },
          { label: n('profile.eduBachelor'), value: 'ปริญญาตรี' },
          { label: n('profile.eduMaster'), value: 'ปริญญาโท' },
          { label: n('profile.eduDoctor'), value: 'ปริญญาเอก' },
        ]);
      return (w, c) => (
        S(),
        P('div', dl, [
          e('div', ul, [
            s(
              D,
              {
                modelValue: b.value,
                'onUpdate:modelValue': c[3] || (c[3] = (i) => (b.value = i)),
                type: 'date',
                label: t(n)('profile.birthdate'),
                placeholder: t(n)('profile.birthdatePlaceholder'),
                required: !0,
                rules: [(i) => !!i || t(n)('profile.requiredBirthdate')],
                'reserve-bottom-space': '',
                onDblclick: c[4] || (c[4] = (i) => (a.value = !0)),
              },
              {
                'append-inner': C(() => [
                  s(
                    Le,
                    {
                      modelValue: a.value,
                      'onUpdate:modelValue': c[2] || (c[2] = (i) => (a.value = i)),
                      anchor: 'top left',
                      self: 'bottom left',
                      class: 'shadow-5 calendar-menu',
                    },
                    {
                      default: C(() => [
                        s(
                          ze,
                          {
                            modelValue: b.value,
                            'onUpdate:modelValue': c[0] || (c[0] = (i) => (b.value = i)),
                            'max-date': g.value,
                            onClickDate: c[1] || (c[1] = (i) => (a.value = !1)),
                          },
                          null,
                          8,
                          ['modelValue', 'max-date'],
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
              8,
              ['modelValue', 'label', 'placeholder', 'rules'],
            ),
          ]),
          s(
            D,
            {
              modelValue: y.value,
              'onUpdate:modelValue': c[5] || (c[5] = (i) => (y.value = i)),
              type: 'select',
              label: t(n)('profile.education'),
              options: v.value,
              placeholder: t(n)('profile.education'),
              'reserve-bottom-space': '',
            },
            null,
            8,
            ['modelValue', 'label', 'options', 'placeholder'],
          ),
          s(
            D,
            {
              modelValue: f.value,
              'onUpdate:modelValue': c[6] || (c[6] = (i) => (f.value = i)),
              label: t(n)('profile.faculty'),
              placeholder: t(n)('profile.facultyPlaceholder'),
              'reserve-bottom-space': '',
            },
            null,
            8,
            ['modelValue', 'label', 'placeholder'],
          ),
        ])
      );
    },
  }),
  pl = j(cl, [['__scopeId', 'data-v-62e5709d']]),
  ml = { class: 'identity-fields' },
  fl = 13,
  vl = G({
    __name: 'identity-fields',
    props: se(
      { isThai: { type: Boolean }, isEditMode: { type: Boolean } },
      {
        nationalId: { required: !0 },
        nationalIdModifiers: {},
        country: { required: !0 },
        countryModifiers: {},
        titleTH: { required: !0 },
        titleTHModifiers: {},
        fullName: { required: !0 },
        fullNameModifiers: {},
        englishName: { required: !0 },
        englishNameModifiers: {},
      },
    ),
    emits: se(
      ['title-th-change'],
      [
        'update:nationalId',
        'update:country',
        'update:titleTH',
        'update:fullName',
        'update:englishName',
      ],
    ),
    setup(l, { emit: n }) {
      const { t: a } = K(),
        g = n,
        b = B(l, 'nationalId'),
        y = B(l, 'country'),
        f = B(l, 'titleTH'),
        v = B(l, 'fullName'),
        w = B(l, 'englishName'),
        c = () => {
          g('title-th-change');
        },
        i = [
          (r) => !!r || a('profile.requiredNationalId'),
          (r) => /^\d+$/.test(String(r ?? '')) || a('profile.nationalIdDigitsOnly'),
          (r) => String(r ?? '').length === fl || a('profile.nationalIdLength'),
        ];
      return (r, o) => (
        S(),
        P('div', ml, [
          l.isThai
            ? (S(),
              W(
                D,
                {
                  key: 0,
                  modelValue: b.value,
                  'onUpdate:modelValue': o[0] || (o[0] = (d) => (b.value = d)),
                  label: t(a)('profile.nationalId'),
                  placeholder: t(a)('profile.nationalIdPlaceholder'),
                  readonly: l.isEditMode,
                  required: !0,
                  rules: i,
                  mask: '#-####-#####-##-#',
                  'unmasked-value': '',
                  'lazy-rules': '',
                  'reserve-bottom-space': '',
                },
                null,
                8,
                ['modelValue', 'label', 'placeholder', 'readonly'],
              ))
            : (S(),
              W(
                D,
                {
                  key: 1,
                  modelValue: b.value,
                  'onUpdate:modelValue': o[1] || (o[1] = (d) => (b.value = d)),
                  label: t(a)('profile.passportNo'),
                  placeholder: t(a)('profile.passportPlaceholder'),
                  readonly: l.isEditMode,
                  required: !0,
                  rules: [(d) => !!d || t(a)('profile.requiredNationalId')],
                  mask: 'XXXXXXXXX',
                  'lazy-rules': '',
                  'reserve-bottom-space': '',
                },
                null,
                8,
                ['modelValue', 'label', 'placeholder', 'readonly', 'rules'],
              )),
          l.isThai
            ? X('', !0)
            : (S(),
              W(
                D,
                {
                  key: 2,
                  modelValue: y.value,
                  'onUpdate:modelValue': o[2] || (o[2] = (d) => (y.value = d)),
                  label: t(a)('profile.nationality'),
                  placeholder: t(a)('profile.nationalityPlaceholder'),
                  required: !0,
                  rules: [(d) => !!d || t(a)('profile.required')],
                  'lazy-rules': '',
                  'reserve-bottom-space': '',
                },
                null,
                8,
                ['modelValue', 'label', 'placeholder', 'rules'],
              )),
          s(
            D,
            {
              modelValue: f.value,
              'onUpdate:modelValue': [o[3] || (o[3] = (d) => (f.value = d)), c],
              type: 'select',
              label: t(a)('profile.prefix'),
              options: t(De).map((d) => ({
                label: t(a)(`profile.prefixes.${d.i18nKey}`),
                value: d.value,
              })),
              required: !0,
              rules: [(d) => !!d || t(a)('profile.requiredPrefix')],
              'lazy-rules': '',
              'reserve-bottom-space': '',
            },
            null,
            8,
            ['modelValue', 'label', 'options', 'rules'],
          ),
          l.isThai
            ? (S(),
              W(
                D,
                {
                  key: 3,
                  modelValue: v.value,
                  'onUpdate:modelValue': o[4] || (o[4] = (d) => (v.value = d)),
                  label: t(a)('profile.fullName'),
                  required: !0,
                  rules: [(d) => !!d || t(a)('profile.requiredFullName')],
                  'lazy-rules': '',
                  'reserve-bottom-space': '',
                },
                null,
                8,
                ['modelValue', 'label', 'rules'],
              ))
            : X('', !0),
          s(
            D,
            {
              modelValue: w.value,
              'onUpdate:modelValue': o[5] || (o[5] = (d) => (w.value = d)),
              label: t(a)('profile.fullNameEn'),
              placeholder: t(a)('profile.fullNameEnPlaceholder'),
              required: !0,
              rules: [(d) => !!d || t(a)('profile.requiredFullNameEn')],
              'lazy-rules': '',
              'reserve-bottom-space': '',
            },
            null,
            8,
            ['modelValue', 'label', 'placeholder', 'rules'],
          ),
        ])
      );
    },
  }),
  gl = j(vl, [['__scopeId', 'data-v-82fba3c4']]),
  hl = { class: 'contact-fields' },
  yl = { class: 'manual-field-wrapper address-wrapper' },
  bl = { class: 'field-label-row text-body2 text-weight-medium q-mb-xs field-label' },
  wl = { key: 0, class: 'manual-field-wrapper email-wrapper' },
  $l = { class: 'field-label-row text-body2 text-weight-medium q-mb-xs field-label' },
  El = { class: 'email-helper text-caption text-weight-regular' },
  Nl = G({
    __name: 'contact-fields',
    props: se(
      { email: {}, showEmailField: { type: Boolean }, showAddressCheckbox: { type: Boolean } },
      {
        institution: { required: !0 },
        institutionModifiers: {},
        address: { required: !0 },
        addressModifiers: {},
        phone: { required: !0 },
        phoneModifiers: {},
      },
    ),
    emits: se(['update:email'], ['update:institution', 'update:address', 'update:phone']),
    setup(l, { emit: n }) {
      const a = K(),
        { t: g } = a,
        b = h(!1),
        y = (i, r) => (a.te(i) ? g(i) : r),
        f = n,
        v = B(l, 'institution'),
        w = B(l, 'address'),
        c = B(l, 'phone');
      return (i, r) => (
        S(),
        P('div', hl, [
          s(
            D,
            {
              modelValue: v.value,
              'onUpdate:modelValue': r[0] || (r[0] = (o) => (v.value = o)),
              label: t(g)('profile.institution'),
              placeholder: t(g)('profile.institutionPlaceholder'),
              rules: [() => !0],
              'reserve-bottom-space': '',
            },
            null,
            8,
            ['modelValue', 'label', 'placeholder'],
          ),
          e('div', yl, [
            e('div', bl, [
              e('div', null, N(t(g)('profile.address')), 1),
              l.showAddressCheckbox
                ? (S(),
                  W(
                    Ue,
                    {
                      key: 0,
                      modelValue: b.value,
                      'onUpdate:modelValue': r[1] || (r[1] = (o) => (b.value = o)),
                      dense: '',
                      size: 'sm',
                      class: 'id-card-address-checkbox',
                      label: y('profile.useIdCardAddress', 'ใช้ที่อยู่ตามบัตรประชาชน'),
                    },
                    null,
                    8,
                    ['modelValue', 'label'],
                  ))
                : X('', !0),
            ]),
            s(
              J,
              {
                modelValue: w.value,
                'onUpdate:modelValue': r[2] || (r[2] = (o) => (w.value = o)),
                type: l.showEmailField ? 'text' : 'textarea',
                placeholder: t(g)('profile.addressPlaceholder'),
                outlined: '',
                dense: '',
                rules: [() => !0],
                'hide-bottom-space': !1,
                class: ee(['custom-input', { 'expanded-address': !l.showEmailField }]),
              },
              null,
              8,
              ['modelValue', 'type', 'placeholder', 'class'],
            ),
          ]),
          s(
            D,
            {
              modelValue: c.value,
              'onUpdate:modelValue': r[3] || (r[3] = (o) => (c.value = o)),
              type: 'tel',
              label: t(g)('profile.phone'),
              placeholder: t(g)('profile.phonePlaceholder'),
              required: !0,
              rules: [(o) => !!o || t(g)('profile.requiredPhone')],
              'reserve-bottom-space': '',
              mask: '###-###-####',
              'unmasked-value': '',
            },
            null,
            8,
            ['modelValue', 'label', 'placeholder', 'rules'],
          ),
          l.showEmailField
            ? (S(),
              P('div', wl, [
                e('div', $l, [
                  e('div', null, [
                    Y(N(t(g)('profile.email')) + ' ', 1),
                    r[5] || (r[5] = e('span', { class: 'text-negative' }, '*', -1)),
                  ]),
                  e(
                    'div',
                    El,
                    N(
                      y(
                        'profile.emailOtpHelper',
                        'ระบบจะส่งรหัส OTP ไปยังอีเมลของคุณเพื่อยืนยันตัวตน',
                      ),
                    ),
                    1,
                  ),
                ]),
                s(
                  J,
                  {
                    'model-value': l.email,
                    placeholder: t(g)('profile.emailPlaceholder'),
                    outlined: '',
                    dense: '',
                    rules: [
                      (o) => !!o || t(g)('profile.requiredEmail'),
                      (o) =>
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o) ||
                        y('profile.invalidEmail', 'รูปแบบอีเมลไม่ถูกต้อง'),
                    ],
                    'lazy-rules': '',
                    'hide-bottom-space': !1,
                    class: 'custom-input',
                    'onUpdate:modelValue':
                      r[4] || (r[4] = (o) => f('update:email', String(o ?? ''))),
                  },
                  null,
                  8,
                  ['model-value', 'placeholder', 'rules'],
                ),
              ]))
            : X('', !0),
        ])
      );
    },
  }),
  Vl = j(Nl, [['__scopeId', 'data-v-7af0a197']]),
  Tl = { class: 'register-profile-form' },
  Il = { class: 'profile-form-title' },
  Sl = { class: 'text-h6 text-weight-medium' },
  kl = { class: 'profile-form-grid' },
  Cl = { class: 'profile-grid-cell profile-grid-cell--fill' },
  _l = { class: 'profile-grid-cell' },
  Ul = { class: 'profile-grid-cell' },
  ql = { class: 'profile-grid-cell' },
  Pl = { class: 'profile-actions' },
  xl = { class: 'q-ml-sm text-h6' },
  Ol = G({
    __name: 'register-and-edit-profile',
    props: {
      initialEditMode: { type: Boolean },
      isThai: { type: Boolean, default: !0 },
      credentials: {},
      userData: {},
      registrationMethod: { default: 'email' },
    },
    emits: ['close', 'save'],
    setup(l, { emit: n }) {
      const a = l,
        g = n,
        b = K(),
        { t: y } = b,
        f = le(),
        v = ve(),
        w = (_, E) => (b.te(_) ? y(_) : E),
        c = h(a.initialEditMode),
        i = h(null),
        r = h(!1),
        o = h(!1),
        d = h(!1),
        { validateAndFocusFirstInvalid: p } = we(i),
        $ = H(() => a.isThai),
        O = H(() => a.registrationMethod === 'thaid'),
        x = H(() => a.registrationMethod === 'email'),
        L = H(() =>
          c.value
            ? y('profile.saveEdit')
            : x.value
              ? w('profile.register', 'สมัครสมาชิก')
              : w('profile.sendOtp', 'ส่งรหัส OTP'),
        ),
        {
          formData: m,
          dialog: U,
          initFormData: R,
          handleTitleTHChange: I,
          submitForm: V,
          onDialogClose: M,
        } = Mt(c.value, (_) => {
          g('save', _);
        }),
        F = (_) => {
          m.value.email = _;
        },
        A = async () => {
          o.value = !0;
          try {
            const _ = await v.sendOtp(m.value.email);
            return _.success
              ? (f.notify({
                  type: 'positive',
                  message: w('profile.otpSendSuccess', 'ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว'),
                  position: 'top',
                }),
                !0)
              : (f.notify({
                  type: 'negative',
                  message: _.message || w('profile.otpSendError', 'ไม่สามารถส่งรหัส OTP ได้'),
                  position: 'top',
                }),
                !1);
          } finally {
            o.value = !1;
          }
        },
        k = async () => {
          if (!(await p())) {
            f.notify({
              type: 'warning',
              message: y('profile.validationError', 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง'),
              position: 'top',
            });
            return;
          }
          if (c.value) {
            V();
            return;
          }
          if (x.value) {
            V();
            return;
          }
          (await A()) && (r.value = !0);
        },
        q = async () => {
          await A();
        },
        u = async (_) => {
          d.value = !0;
          try {
            const E = await v.verifyOtp(m.value.email, _);
            if (!E.success) {
              f.notify({
                type: 'negative',
                message: E.message || w('profile.otpVerifyError', 'ไม่สามารถยืนยันรหัส OTP ได้'),
                position: 'top',
              });
              return;
            }
            ((r.value = !1), V());
          } finally {
            d.value = !1;
          }
        };
      return (
        ne(() => {
          (R(a.userData),
            a.credentials &&
              ((m.value.email = a.credentials.email),
              (m.value.password = a.credentials.password),
              (m.value.confirmPassword = a.credentials.confirmPassword || a.credentials.password),
              (m.value.country = a.isThai ? 'TH' : '')));
        }),
        (_, E) => (
          S(),
          P('div', Tl, [
            s(
              ue,
              { class: 'shadow-0 profile-card' },
              {
                default: C(() => [
                  s(
                    fe,
                    {
                      ref_key: 'formRef',
                      ref: i,
                      class: 'profile-form',
                      onSubmit: pe(k, ['prevent']),
                    },
                    {
                      default: C(() => [
                        e('div', Il, [
                          s(Q, { name: 'people', size: '20px', color: 'dark' }),
                          e('div', Sl, N(t(y)('profile.personalInfo')), 1),
                        ]),
                        e('div', kl, [
                          e('div', Cl, [
                            s(
                              il,
                              {
                                'profile-image': t(m).profileImage,
                                'onUpdate:profileImage':
                                  E[0] || (E[0] = (T) => (t(m).profileImage = T)),
                              },
                              null,
                              8,
                              ['profile-image'],
                            ),
                          ]),
                          e('div', _l, [
                            s(
                              pl,
                              {
                                birthdate: t(m).birthdate,
                                'onUpdate:birthdate': E[1] || (E[1] = (T) => (t(m).birthdate = T)),
                                'education-level': t(m).educationLevel,
                                'onUpdate:educationLevel':
                                  E[2] || (E[2] = (T) => (t(m).educationLevel = T)),
                                faculty: t(m).faculty,
                                'onUpdate:faculty': E[3] || (E[3] = (T) => (t(m).faculty = T)),
                              },
                              null,
                              8,
                              ['birthdate', 'education-level', 'faculty'],
                            ),
                          ]),
                          e('div', Ul, [
                            s(
                              gl,
                              {
                                'is-thai': $.value,
                                'is-edit-mode': c.value,
                                'national-id': t(m).nationalId,
                                'onUpdate:nationalId':
                                  E[4] || (E[4] = (T) => (t(m).nationalId = T)),
                                country: t(m).country,
                                'onUpdate:country': E[5] || (E[5] = (T) => (t(m).country = T)),
                                'title-t-h': t(m).titleTH,
                                'onUpdate:titleTH': E[6] || (E[6] = (T) => (t(m).titleTH = T)),
                                'full-name': t(m).fullName,
                                'onUpdate:fullName': E[7] || (E[7] = (T) => (t(m).fullName = T)),
                                'english-name': t(m).englishName,
                                'onUpdate:englishName':
                                  E[8] || (E[8] = (T) => (t(m).englishName = T)),
                                onTitleThChange: t(I),
                              },
                              null,
                              8,
                              [
                                'is-thai',
                                'is-edit-mode',
                                'national-id',
                                'country',
                                'title-t-h',
                                'full-name',
                                'english-name',
                                'onTitleThChange',
                              ],
                            ),
                          ]),
                          e('div', ql, [
                            s(
                              Vl,
                              {
                                email: t(m).email,
                                'show-email-field': O.value,
                                'show-address-checkbox': O.value,
                                institution: t(m).institution,
                                'onUpdate:institution':
                                  E[9] || (E[9] = (T) => (t(m).institution = T)),
                                address: t(m).address,
                                'onUpdate:address': E[10] || (E[10] = (T) => (t(m).address = T)),
                                phone: t(m).phone,
                                'onUpdate:phone': E[11] || (E[11] = (T) => (t(m).phone = T)),
                                'onUpdate:email': F,
                              },
                              null,
                              8,
                              [
                                'email',
                                'show-email-field',
                                'show-address-checkbox',
                                'institution',
                                'address',
                                'phone',
                              ],
                            ),
                          ]),
                        ]),
                        e('div', Pl, [
                          s(
                            z,
                            {
                              unelevated: '',
                              class: 'bg-grey-4 text-black text-weight-bold profile-action-btn',
                              label: t(y)('profile.back'),
                              onClick: E[12] || (E[12] = (T) => g('close')),
                            },
                            null,
                            8,
                            ['label'],
                          ),
                          s(
                            z,
                            {
                              type: 'submit',
                              color: 'primary',
                              class: 'text-weight-bold profile-action-btn',
                              label: L.value,
                              loading: o.value,
                              unelevated: '',
                            },
                            null,
                            8,
                            ['label', 'loading'],
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
            s(
              Ee,
              {
                modelValue: r.value,
                'onUpdate:modelValue': E[13] || (E[13] = (T) => (r.value = T)),
                'is-sending': o.value,
                'is-verifying': d.value,
                onVerify: u,
                onResend: q,
              },
              null,
              8,
              ['modelValue', 'is-sending', 'is-verifying'],
            ),
            s(
              me,
              {
                modelValue: t(U).show,
                'onUpdate:modelValue': E[14] || (E[14] = (T) => (t(U).show = T)),
                persistent: '',
              },
              {
                default: C(() => [
                  s(
                    ue,
                    { class: 'profile-dialog-card' },
                    {
                      default: C(() => [
                        s(
                          he,
                          { class: 'row items-center' },
                          {
                            default: C(() => [
                              s(
                                qe,
                                {
                                  icon: t(U).type === 'success' ? 'check_circle' : 'error',
                                  color: t(U).type === 'success' ? 'positive' : 'negative',
                                  'text-color': 'white',
                                },
                                null,
                                8,
                                ['icon', 'color'],
                              ),
                              e(
                                'span',
                                xl,
                                N(
                                  t(U).type === 'success'
                                    ? t(y)('profile.dialogSuccess')
                                    : t(y)('profile.dialogError'),
                                ),
                                1,
                              ),
                            ]),
                            _: 1,
                          },
                        ),
                        s(
                          he,
                          { class: 'q-pt-none' },
                          { default: C(() => [Y(N(t(U).message), 1)]), _: 1 },
                        ),
                        s(
                          Pe,
                          { align: 'right' },
                          {
                            default: C(() => [
                              s(
                                z,
                                {
                                  flat: '',
                                  label: t(y)('profile.dialogClose'),
                                  color: 'primary',
                                  onClick: t(M),
                                },
                                null,
                                8,
                                ['label', 'onClick'],
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
          ])
        )
      );
    },
  }),
  Ml = j(Ol, [['__scopeId', 'data-v-cb875aef']]),
  Rl = { class: 'login-root' },
  Al = { key: 0 },
  Fl = { key: 1 },
  Hl = { class: 'register-card-shell' },
  Ll = { key: 2 },
  Bl = { class: 'register-profile-shell' },
  zl = G({
    __name: 'login-page',
    setup(l) {
      const n = be(),
        a = ie(),
        g = le(),
        { t: b } = K(),
        y = ve(),
        f = H(() => n.path.includes('register')),
        v = h('credentials'),
        w = h(!0),
        c = h({ email: '', password: '', userType: 'thai', registrationMethod: 'email' }),
        i = h('right'),
        r = h('login'),
        o = h(!1),
        d = h('login'),
        p = h(!1),
        $ = h(null),
        O = h(null),
        x = H(() => ({
          'pos-right': i.value === 'right',
          'pos-center': i.value === 'center',
          'size-login': r.value === 'login',
          'size-credentials': r.value === 'credentials',
          'size-profile': r.value === 'profile',
          animating: p.value,
        })),
        L = H(() => ($.value !== null ? { minHeight: `${$.value}px` } : {})),
        m = () => {
          O.value && ($.value = O.value.offsetHeight);
        },
        U = () => {
          $.value = null;
        };
      ne(() => {
        (f.value
          ? ((i.value = 'center'),
            (r.value = v.value === 'profile' ? 'profile' : 'credentials'),
            (d.value = v.value === 'profile' ? 'profile' : 'credentials'))
          : ((i.value = 'right'), (r.value = 'login'), (d.value = 'login')),
          (o.value = !0));
      });
      const R = h(null),
        I = (u) => {
          ((p.value = !0),
            m(),
            (o.value = !1),
            u
              ? (setTimeout(() => {
                  ((i.value = 'center'), (r.value = 'credentials'));
                }, 150),
                setTimeout(() => {
                  ((d.value = 'credentials'),
                    U(),
                    oe(() => {
                      ((o.value = !0), (p.value = !1), F());
                    }));
                }, 600))
              : (setTimeout(() => {
                  ((r.value = 'login'), (i.value = 'right'));
                }, 150),
                setTimeout(() => {
                  ((d.value = 'login'),
                    U(),
                    oe(() => {
                      ((o.value = !0), (p.value = !1), F());
                    }));
                }, 600)));
        };
      de(f, (u) => {
        ((R.value = u), !p.value && I(u));
      });
      const V = h(null),
        M = (u) => {
          ((p.value = !0),
            m(),
            (o.value = !1),
            setTimeout(() => {
              ((r.value = u === 'profile' ? 'profile' : 'credentials'),
                (d.value = u === 'profile' ? 'profile' : 'credentials'));
            }, 150),
            setTimeout(() => {
              (U(),
                oe(() => {
                  ((o.value = !0), (p.value = !1), F());
                }));
            }, 500));
        };
      de(v, (u) => {
        if (!f.value) {
          ((r.value = u === 'profile' ? 'profile' : 'credentials'),
            (d.value = u === 'profile' ? 'profile' : 'credentials'));
          return;
        }
        ((V.value = u), !p.value && M(u));
      });
      const F = () => {
          if (R.value !== null && R.value !== f.value) {
            ((R.value = f.value), I(f.value));
            return;
          }
          if (f.value && d.value === 'login') {
            I(!0);
            return;
          }
          if (!f.value && d.value !== 'login') {
            I(!1);
            return;
          }
          if (V.value !== null && f.value) {
            const u = V.value === 'profile' ? 'profile' : 'credentials';
            if (d.value !== u) {
              M(V.value);
              return;
            }
          }
        },
        A = (u) => {
          ((c.value = u), (w.value = u.userType === 'thai'), (v.value = 'profile'));
        },
        k = () => {
          v.value = 'credentials';
        },
        q = async (u) => {
          let _ = c.value.password;
          if (!_) {
            const T = Math.random().toString().slice(2, 8);
            ((_ = `${u.nationalId}${T}`), _.length < 8 && (_ = _.padEnd(8, '0')));
          }
          const E = {
            email: (u.email || c.value.email).trim().toLowerCase(),
            password: _,
            confirmPassword: _,
            userType: c.value.userType,
            profileImage: u.profileImage || void 0,
            nationalId: u.nationalId,
            country: u.country,
            titleTH: u.titleTH,
            titleEN: u.titleEN,
            fullName: u.fullName,
            englishName: u.englishName,
            phone: u.phone,
            birthdate: u.birthdate,
            educationLevel: u.educationLevel,
            faculty: u.faculty,
            institution: u.institution,
            address: u.address,
          };
          g.loading.show();
          try {
            const T = await y.register(E);
            T.success
              ? (g.notify({
                  type: 'positive',
                  message: b('auth.notify.registerSuccess', 'สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ'),
                  position: 'top',
                }),
                await a.push('/login'),
                (v.value = 'credentials'))
              : g.notify({
                  type: 'negative',
                  message:
                    T.message || b('auth.notify.registerFailed', 'เกิดข้อผิดพลาดในการสมัครสมาชิก'),
                  position: 'top',
                });
          } catch {
            g.notify({
              type: 'negative',
              message: b('auth.notify.connectionError', 'เกิดข้อผิดพลาดในการเชื่อมต่อ'),
              position: 'top',
            });
          } finally {
            g.loading.hide();
          }
        };
      return (u, _) => (
        S(),
        P('div', Rl, [
          _[1] ||
            (_[1] = xe(
              '<div class="geo geo-1" data-v-82dae163></div><div class="geo geo-2" data-v-82dae163></div><div class="geo geo-3" data-v-82dae163></div><div class="geo geo-4" data-v-82dae163></div><div class="geo geo-5" data-v-82dae163></div><div class="geo geo-6" data-v-82dae163></div><div class="grid-lines" data-v-82dae163></div>',
              7,
            )),
          e(
            'div',
            { class: ee(['left-panel', { hidden: i.value === 'center' }]) },
            [
              ...(_[0] ||
                (_[0] = [
                  e(
                    'div',
                    { class: 'left-content' },
                    [
                      e('div', { class: 'brand-logo-wrap' }, [
                        e('img', { src: Qe, alt: 'BUU-GET Logo', class: 'brand-logo-img' }),
                      ]),
                    ],
                    -1,
                  ),
                ])),
            ],
            2,
          ),
          e(
            'div',
            {
              ref_key: 'cardWrapperRef',
              ref: O,
              class: ee(['card-wrapper', x.value]),
              style: Oe(L.value),
            },
            [
              s(
                ce,
                { name: 'fade', mode: 'out-in' },
                {
                  default: C(() => [
                    o.value
                      ? (S(),
                        P('div', { key: d.value }, [
                          d.value === 'login'
                            ? (S(), P('div', Al, [s(st)]))
                            : d.value === 'credentials'
                              ? (S(),
                                P('div', Fl, [
                                  e('div', Hl, [s(Ut, { onRegister: A, onThaidRegister: A })]),
                                ]))
                              : d.value === 'profile'
                                ? (S(),
                                  P('div', Ll, [
                                    e('div', Bl, [
                                      s(
                                        Ml,
                                        {
                                          'initial-edit-mode': !1,
                                          'is-thai': w.value,
                                          credentials: c.value,
                                          'registration-method': c.value.registrationMethod,
                                          onClose: k,
                                          onSave: q,
                                        },
                                        null,
                                        8,
                                        ['is-thai', 'credentials', 'registration-method'],
                                      ),
                                    ]),
                                  ]))
                                : X('', !0),
                        ]))
                      : X('', !0),
                  ]),
                  _: 1,
                },
              ),
            ],
            6,
          ),
        ])
      );
    },
  }),
  ua = j(zl, [['__scopeId', 'data-v-82dae163']]);
export { ua as default };
