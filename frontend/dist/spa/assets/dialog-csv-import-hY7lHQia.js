import { Q as D } from './QSpace-BPMiD-JH.js';
import {
  O as I,
  Q,
  _ as w,
  au as U,
  W as d,
  V as a,
  an as k,
  am as v,
  S as o,
  a8 as u,
  J as B,
  $ as S,
  az as r,
  a3 as _,
  av as z,
  r as p,
  a2 as F,
} from './index-CKSooU2k.js';
import { C as $ } from './ClosePopup-D9BZcpVj.js';
const q = { class: 'csv-upload-zone__content column items-center' },
  y = { class: 'url-section' },
  M = { class: 'row q-gutter-sm items-center' },
  R = 10 * 1024 * 1024,
  L = I({
    __name: 'dialog-csv-import',
    props: { modelValue: { type: Boolean } },
    emits: ['update:modelValue', 'file-selected', 'url-submitted', 'download-sample'],
    setup(f, { emit: b }) {
      const n = b,
        c = p(null),
        t = p(''),
        i = p(!1),
        g = () => {
          c.value?.click();
        },
        m = (l) => {
          if (l.size > R) {
            console.error('File exceeds 10MB limit');
            return;
          }
          (n('file-selected', l), n('update:modelValue', !1));
        },
        C = (l) => {
          const e = l.target,
            s = e.files?.[0];
          (s && m(s), e && (e.value = ''));
        },
        V = (l) => {
          i.value = !1;
          const e = l.dataTransfer?.files?.[0];
          e && m(e);
        },
        x = () => {
          const l = t.value.trim();
          l && (n('url-submitted', l), (t.value = ''), n('update:modelValue', !1));
        };
      return (l, e) => (
        Q(),
        w(
          U,
          {
            'model-value': f.modelValue,
            persistent: '',
            'onUpdate:modelValue': e[4] || (e[4] = (s) => l.$emit('update:modelValue', s)),
            'transition-show': 'scale',
            'transition-hide': 'scale',
          },
          {
            default: d(() => [
              a(
                k,
                { class: 'dialog-csv-card' },
                {
                  default: d(() => [
                    a(
                      v,
                      { class: 'row items-center q-pb-none header-section' },
                      {
                        default: d(() => [
                          e[5] || (e[5] = o('div', { class: 'dialog-heading' }, 'Upload CSV', -1)),
                          a(D),
                          a(u, {
                            unelevated: '',
                            dense: '',
                            'no-caps': '',
                            label: 'ตัวอย่างไฟล์',
                            class: 'sample-btn',
                            onClick: e[0] || (e[0] = (s) => l.$emit('download-sample')),
                          }),
                          B(
                            a(
                              u,
                              {
                                icon: 'close',
                                flat: '',
                                round: '',
                                dense: '',
                                class: 'close-btn q-ml-sm',
                              },
                              null,
                              512,
                            ),
                            [[$]],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                    a(
                      v,
                      { class: 'q-pt-md body-section' },
                      {
                        default: d(() => [
                          o(
                            'div',
                            {
                              class: _([
                                'csv-upload-zone',
                                { 'csv-upload-zone--dragover': i.value },
                              ]),
                              onDragover: e[1] || (e[1] = r((s) => (i.value = !0), ['prevent'])),
                              onDragleave: e[2] || (e[2] = r((s) => (i.value = !1), ['prevent'])),
                              onDrop: r(V, ['prevent']),
                              onClick: g,
                            },
                            [
                              o(
                                'input',
                                {
                                  ref_key: 'fileInputRef',
                                  ref: c,
                                  type: 'file',
                                  accept: '.csv,.xlsx,.xls',
                                  class: 'hidden-file-input',
                                  onChange: C,
                                },
                                null,
                                544,
                              ),
                              o('div', q, [
                                a(S, { name: 'cloud_upload', class: 'upload-icon' }),
                                e[6] ||
                                  (e[6] = o(
                                    'div',
                                    { class: 'upload-main-text' },
                                    'ลากและวางไฟล์ CSV ที่นี่ หรือคลิกเพื่อเลือกไฟล์',
                                    -1,
                                  )),
                                e[7] ||
                                  (e[7] = o(
                                    'div',
                                    { class: 'upload-hint-text' },
                                    'รองรับเฉพาะไฟล์รูปแบบ .csv / .xlsx (ขนาดสูงสุด 10MB)',
                                    -1,
                                  )),
                              ]),
                            ],
                            34,
                          ),
                          o('div', y, [
                            e[8] ||
                              (e[8] = o('div', { class: 'url-label' }, 'หรือนำเข้าจาก URL', -1)),
                            o('div', M, [
                              a(
                                z,
                                {
                                  modelValue: t.value,
                                  'onUpdate:modelValue': e[3] || (e[3] = (s) => (t.value = s)),
                                  outlined: '',
                                  dense: '',
                                  placeholder: 'Add File URL',
                                  class: 'col url-input',
                                  'hide-bottom-space': '',
                                },
                                null,
                                8,
                                ['modelValue'],
                              ),
                              a(
                                u,
                                {
                                  label: 'Upload',
                                  unelevated: '',
                                  dense: '',
                                  'no-caps': '',
                                  class: 'url-upload-btn',
                                  disable: !t.value.trim(),
                                  onClick: x,
                                },
                                null,
                                8,
                                ['disable'],
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
            ]),
            _: 1,
          },
          8,
          ['model-value'],
        )
      );
    },
  }),
  O = F(L, [['__scopeId', 'data-v-b7379be4']]);
export { O as D };
