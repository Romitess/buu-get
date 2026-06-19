import {
  O as f,
  Q as n,
  _,
  W as t,
  S as s,
  V as a,
  an as l,
  $ as d,
  am as i,
  Z as c,
  R as Q,
  a6 as g,
  a7 as x,
  a0 as m,
  T as v,
  ap as y,
  a8 as o,
  a2 as b,
} from './index-CKSooU2k.js';
import { Q as S, a as u } from './QItem-D-DX6y8A.js';
import { Q as p } from './QItemLabel-Ca36qfFu.js';
import { Q as k } from './QList-fArhXj97.js';
import { Q as q } from './QPage-CM3LWBRo.js';
const C = { class: 'row q-col-gutter-md' },
  w = { class: 'col-12' },
  B = { class: 'col-12 col-md-6' },
  I = { class: 'col-12 col-md-6' },
  h = f({
    __name: 'dashboard-page',
    setup(A) {
      return (V, e) => (
        n(),
        _(
          q,
          { class: 'q-pa-md' },
          {
            default: t(() => [
              s('div', C, [
                s('div', w, [
                  a(
                    l,
                    { class: 'bg-primary text-white text-center q-pa-xl' },
                    {
                      default: t(() => [
                        a(d, { name: 'admin_panel_settings', size: '4rem' }),
                        e[0] ||
                          (e[0] = s('div', { class: 'text-h4 q-mt-md' }, 'Staff Dashboard', -1)),
                        e[1] ||
                          (e[1] = s(
                            'div',
                            { class: 'text-subtitle1' },
                            'Manage exams and view statistics (Mock Page)',
                            -1,
                          )),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                s('div', B, [
                  a(l, null, {
                    default: t(() => [
                      a(i, null, {
                        default: t(() => [
                          ...(e[2] ||
                            (e[2] = [s('div', { class: 'text-h6' }, 'Recent Activity', -1)])),
                        ]),
                        _: 1,
                      }),
                      a(c),
                      a(k, null, {
                        default: t(() => [
                          (n(),
                          Q(
                            g,
                            null,
                            x(3, (r) =>
                              a(
                                S,
                                { key: r },
                                {
                                  default: t(() => [
                                    a(
                                      u,
                                      { avatar: '' },
                                      {
                                        default: t(() => [
                                          a(d, { name: 'history', color: 'primary' }),
                                        ]),
                                        _: 1,
                                      },
                                    ),
                                    a(
                                      u,
                                      null,
                                      {
                                        default: t(() => [
                                          a(
                                            p,
                                            null,
                                            { default: t(() => [m('Activity ' + v(r), 1)]), _: 2 },
                                            1024,
                                          ),
                                          a(
                                            p,
                                            { caption: '' },
                                            {
                                              default: t(() => [
                                                ...(e[3] || (e[3] = [m('System update', -1)])),
                                              ]),
                                              _: 1,
                                            },
                                          ),
                                        ]),
                                        _: 2,
                                      },
                                      1024,
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1024,
                              ),
                            ),
                            64,
                          )),
                        ]),
                        _: 1,
                      }),
                    ]),
                    _: 1,
                  }),
                ]),
                s('div', I, [
                  a(l, null, {
                    default: t(() => [
                      a(i, null, {
                        default: t(() => [
                          ...(e[4] ||
                            (e[4] = [s('div', { class: 'text-h6' }, 'Quick Actions', -1)])),
                        ]),
                        _: 1,
                      }),
                      a(c),
                      a(
                        y,
                        { align: 'center', class: 'q-pa-md q-gutter-md' },
                        {
                          default: t(() => [
                            a(o, { color: 'primary', icon: 'add', label: 'Create Exam' }),
                            a(o, { color: 'secondary', icon: 'people', label: 'Manage Users' }),
                            a(o, { color: 'warning', icon: 'settings', label: 'Settings' }),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    _: 1,
                  }),
                ]),
              ]),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  E = b(h, [['__scopeId', 'data-v-5f24f7ca']]);
export { E as default };
