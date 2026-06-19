import { Q as p } from './QPage-CM3LWBRo.js';
import { A as a, a as e } from './app-breadcrumbs-C0oZOPYe.js';
import { u as i, E as s } from './exam-form-DOG4bHZk.js';
import {
  O as c,
  Q as n,
  _ as f,
  W as u,
  V as t,
  ax as l,
  X as _,
  a2 as x,
} from './index-CKSooU2k.js';
import './QBanner-4afwbSQX.js';
import './use-quasar-DaOT29F-.js';
import './exam.store-DCbxmgyM.js';
import './vue-i18n-Bebkm_iB.js';
import './transaction.service-Cj5D4WKX.js';
import './exam.service-0p8xz0zq.js';
import './app-button-D_cMl4aM.js';
import './QTooltip-BUG2ohUJ.js';
import './position-engine-Bv76xS6k.js';
import './QSelect-CcXwe87O.js';
import './QItem-D-DX6y8A.js';
import './QItemLabel-Ca36qfFu.js';
import './format-DnjzHs7F.js';
import './app-select-DSldWHEY.js';
import './app-calendar-3fcHCMzM.js';
import './QResizeObserver-C4jaR1Qo.js';
import './thai-date-DNnHYwmb.js';
import './QSpace-BPMiD-JH.js';
import './export-file-BbXX5Gbn.js';
import './base-table-DuGvP-XM.js';
import './QTable-B4W-6HCk.js';
import './QList-fArhXj97.js';
import './QLinearProgress-ComgvJOP.js';
import './QSpinnerDots-Dwh4MvNX.js';
import './QInnerLoading-CAwPoqSH.js';
import './dialog-csv-import-hY7lHQia.js';
import './ClosePopup-D9BZcpVj.js';
const d = c({
    __name: 'create-exam-page',
    setup(g) {
      const { form: r } = i();
      return (E, o) => (
        n(),
        f(
          p,
          { class: 'page-container create-exam-page surface-page-bg' },
          {
            default: u(() => [
              t(a),
              t(e, {
                title: 'สร้างรอบสอบ',
                subtitle: 'ดำเนินการสร้างรอบสอบและกำหนดรายละเอียดการสอบ',
              }),
              t(
                s,
                {
                  form: _(r),
                  'onUpdate:form': o[0] || (o[0] = (m) => (l(r) ? (r.value = m) : null)),
                },
                null,
                8,
                ['form'],
              ),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  T = x(d, [['__scopeId', 'data-v-1366c687']]);
export { T as default };
