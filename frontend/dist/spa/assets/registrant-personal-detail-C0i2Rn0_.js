import {
  O as m,
  Q as g,
  _ as v,
  an as b,
  W as $,
  S as t,
  V as r,
  $ as E,
  T as o,
  Z as y,
  f as d,
  a2 as I,
} from './index-CKSooU2k.js';
import { I as S } from './image-display-9myJRY3L.js';
const P = { class: 'row items-center q-px-xl q-py-lg' },
  T = { class: 'text-subtitle1 text-weight-bold text-black q-ma-none' },
  D = { class: 'registrant-content row q-px-xl q-col-gutter-x-xl q-col-gutter-y-lg' },
  A = { class: 'col-12 col-sm-4 col-md-3' },
  R = { class: 'flex column items-center q-ma-none' },
  q = { class: 'photo-container' },
  N = { class: 'text-center q-mt-md' },
  O = { class: 'text-subtitle2 text-weight-bold text-black' },
  U = { class: 'text-caption text-grey-6' },
  w = { class: 'col-12 col-sm-8 col-md-9' },
  x = { class: 'row q-col-gutter-x-lg q-col-gutter-y-md' },
  B = { class: 'col-12 col-sm-6' },
  M = { class: 'column q-gutter-y-md' },
  F = { class: 'info-field' },
  L = { class: 'info-label' },
  k = { class: 'info-value' },
  C = { class: 'info-field' },
  H = { class: 'info-label' },
  j = { class: 'info-value' },
  Q = { class: 'info-field' },
  G = { class: 'info-label' },
  V = { class: 'info-value' },
  Y = { class: 'info-field' },
  z = { class: 'info-label' },
  W = { class: 'info-value' },
  Z = { class: 'info-field' },
  J = { class: 'info-label' },
  K = { class: 'info-value' },
  X = { class: 'col-12 col-sm-6' },
  tt = { class: 'column q-gutter-y-md' },
  st = { class: 'info-field' },
  et = { class: 'info-label' },
  ot = { class: 'info-value' },
  at = { class: 'info-field' },
  nt = { class: 'info-label' },
  lt = { class: 'info-value' },
  it = { class: 'info-field' },
  ct = { class: 'info-label' },
  rt = { class: 'info-value' },
  dt = { class: 'info-field' },
  ut = { class: 'info-label' },
  _t = { class: 'info-value' },
  ft = { class: 'info-field' },
  pt = { class: 'info-label' },
  ht = { class: 'info-value' },
  mt = m({
    __name: 'registrant-personal-detail',
    props: { enrollment: {} },
    setup(u) {
      const n = u,
        _ = (s) => {
          if (!s || s === '-') return '-';
          const e = s.replace(/-/g, '');
          return e.length === 13
            ? `${e[0]}-${e.substring(1, 5)}-${e.substring(5, 10)}-${e.substring(10, 12)}-${e[12]}`
            : s;
        },
        f = (s) => {
          if (!s || s === '-') return '-';
          const e = s.replace(/-/g, '');
          return e.length === 10
            ? `${e.substring(0, 3)}-${e.substring(3, 6)}-${e.substring(6, 10)}`
            : s;
        },
        p = (s) => {
          if (!s) return '-';
          const e = new Date(s);
          if (isNaN(e.getTime())) return '-';
          const l = String(e.getDate()).padStart(2, '0'),
            i = String(e.getMonth() + 1).padStart(2, '0'),
            c = e.getFullYear() + 543;
          return `${l}/${i}/${c}`;
        },
        a = d(() => {
          const s = n.enrollment?.USER?.PROFILE,
            e = n.enrollment?.USER,
            l = e?.USER_NATIONAL_ID?.trim() || '',
            i = e?.USER_PASSPORT_NO?.trim() || '',
            c = !l && !!i;
          return {
            identityNumber: c ? i : _(l),
            isPassport: c,
            titleTh: s?.userTitleTh || '-',
            fullnameTh: s?.userFullnameTh || '-',
            fullnameEn: s?.userFullnameEn || '-',
            birthDate: p(s?.userDateOfBirth),
            education: s?.userEducation || '-',
            faculty: s?.userFaculty || '-',
            institution: s?.userInstitution || '-',
            address: s?.userAddress || '-',
            phone: f(s?.userPhone || ''),
            profileImagePath:
              e?.USER_IMAGE || e?.PROFILE?.userImagePath || e?.IMAGE?.USER_IMAGE_URL || null,
            physicalStatus: n.enrollment?.ERM_PHYSICAL_STATUS || '-',
          };
        }),
        h = d(() => {
          const s = n.enrollment?.CREATED_AT;
          return s
            ? new Date(s).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '';
        });
      return (s, e) => (
        g(),
        v(
          b,
          { flat: '', bordered: '', class: 'registrant-card' },
          {
            default: $(() => [
              t('header', P, [
                r(E, { name: 'person_outline', size: '24px', color: 'black', class: 'q-mr-sm' }),
                t('h2', T, o(s.$t('admin.registrantManagement.detail.personalInfo')), 1),
              ]),
              r(y),
              t('section', D, [
                t('div', A, [
                  t('figure', R, [
                    t('div', q, [
                      r(
                        S,
                        {
                          'image-path': a.value.profileImagePath,
                          class: 'profile-img',
                          'object-fit': 'cover',
                          height: '100%',
                          'cache-bust': '',
                          alt: s.$t('admin.registrantManagement.detail.photoAlt'),
                        },
                        null,
                        8,
                        ['image-path', 'alt'],
                      ),
                    ]),
                    t('figcaption', N, [
                      t(
                        'div',
                        O,
                        o(
                          a.value.profileImagePath
                            ? 'user_photo.jpg'
                            : s.$t('profileEditHistory.dialog.noPhoto'),
                        ),
                        1,
                      ),
                      t(
                        'div',
                        U,
                        o(
                          a.value.profileImagePath
                            ? s.$t('profileEditHistory.dialog.uploadedAt', {
                                size: '1.2 MB',
                                date: h.value,
                              })
                            : s.$t('profileEditHistory.dialog.notUploaded'),
                        ),
                        1,
                      ),
                    ]),
                  ]),
                ]),
                t('div', w, [
                  t('div', x, [
                    t('div', B, [
                      t('div', M, [
                        t('div', F, [
                          t(
                            'span',
                            L,
                            o(
                              s.$t(
                                a.value.isPassport ? 'profile.passportNo' : 'profile.nationalId',
                              ),
                            ),
                            1,
                          ),
                          t('span', k, o(a.value.identityNumber), 1),
                        ]),
                        t('div', C, [
                          t('span', H, o(s.$t('profile.prefix')), 1),
                          t('span', j, o(a.value.titleTh), 1),
                        ]),
                        t('div', Q, [
                          t('span', G, o(s.$t('profile.fullName')), 1),
                          t('span', V, o(a.value.fullnameTh), 1),
                        ]),
                        t('div', Y, [
                          t('span', z, o(s.$t('profile.fullNameEn')), 1),
                          t('span', W, o(a.value.fullnameEn), 1),
                        ]),
                        t('div', Z, [
                          t('span', J, o(s.$t('profile.birthdate')), 1),
                          t('span', K, o(a.value.birthDate), 1),
                        ]),
                      ]),
                    ]),
                    t('div', X, [
                      t('div', tt, [
                        t('div', st, [
                          t('span', et, o(s.$t('profile.education')), 1),
                          t('span', ot, o(a.value.education), 1),
                        ]),
                        t('div', at, [
                          t('span', nt, o(s.$t('profile.faculty')), 1),
                          t('span', lt, o(a.value.faculty), 1),
                        ]),
                        t('div', it, [
                          t('span', ct, o(s.$t('profile.institution')), 1),
                          t('span', rt, o(a.value.institution), 1),
                        ]),
                        t('div', dt, [
                          t('span', ut, o(s.$t('profile.address')), 1),
                          t('span', _t, o(a.value.address), 1),
                        ]),
                        t('div', ft, [
                          t('span', pt, o(s.$t('profile.phone')), 1),
                          t('span', ht, o(a.value.phone), 1),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  bt = I(mt, [['__scopeId', 'data-v-c47291ef']]);
export { bt as R };
