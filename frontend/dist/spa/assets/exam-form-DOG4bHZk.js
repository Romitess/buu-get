import {
  P as it,
  f as fe,
  a$ as dt,
  a9 as ut,
  r as P,
  I as Re,
  O as Se,
  aA as Ne,
  Q as g,
  _ as z,
  an as Ve,
  W as h,
  V as r,
  am as Te,
  S as s,
  $ as C,
  a3 as U,
  R as A,
  a0 as Q,
  T as q,
  U as $,
  av as ue,
  b0 as mt,
  aD as me,
  a2 as be,
  ao as He,
  az as ge,
  at as ct,
  a6 as he,
  a7 as Pe,
  X as b,
  w as We,
  a8 as Ce,
  au as vt,
  t as ft,
  ax as pt,
} from './index-CKSooU2k.js';
import { Q as gt } from './QBanner-4afwbSQX.js';
import { u as St } from './use-quasar-DaOT29F-.js';
import { u as bt } from './exam.store-DCbxmgyM.js';
import {
  B as _e,
  a as Le,
  b as yt,
  c as qe,
  E as Fe,
  N as re,
  u as Et,
  d as xt,
  M as Qe,
  e as Ue,
  g as Tt,
  h as wt,
  i as Dt,
  V as oe,
  j as Xe,
} from './exam.service-0p8xz0zq.js';
import { A as ze } from './app-button-D_cMl4aM.js';
import { Q as Ge } from './QTooltip-BUG2ohUJ.js';
import { a as kt } from './QSelect-CcXwe87O.js';
import { A as Ae } from './app-select-DSldWHEY.js';
import { Q as xe } from './format-DnjzHs7F.js';
import { Q as $t } from './QItemLabel-Ca36qfFu.js';
import { Q as It, a as Ke } from './QItem-D-DX6y8A.js';
import { A as ke } from './app-calendar-3fcHCMzM.js';
import { c as $e, b as Ie } from './thai-date-DNnHYwmb.js';
import { Q as ht } from './QSpace-BPMiD-JH.js';
import { e as Ct } from './export-file-BbXX5Gbn.js';
import { B as At } from './base-table-DuGvP-XM.js';
import { D as Nt } from './dialog-csv-import-hY7lHQia.js';
function Vt(t, G) {
  const L = it(),
    c = St(),
    f = bt(),
    S = G?.examId,
    x = fe(() => !!S),
    B = P(!1),
    _ = P(''),
    V = fe(() => x.value && (B.value || e.value.isPublished)),
    m = fe(() => !1),
    a = fe(() => e.value.timeSlots.some((o) => o.rooms.some((l) => (l.enrollmentCount || 0) > 0))),
    p = (() => {
      const o = new Date(),
        l = String(o.getDate()).padStart(2, '0'),
        i = String(o.getMonth() + 1).padStart(2, '0'),
        n = o.getFullYear() + _e;
      return `${l}/${i}/${n}`;
    })(),
    J = [qe, Fe],
    K = [Le, yt],
    k = P([]),
    R = P([]),
    F = P([]),
    T = P(!1),
    u = P(null),
    d = P(0),
    E = P(''),
    e =
      t ||
      P({
        examName: '',
        examRound: '',
        examType: qe,
        examFormat: Le,
        fundSourceId: null,
        fee: '',
        isPublished: !1,
        examDate: p,
        timeSlots: [
          {
            startTime: '08:00',
            endTime: '10:00',
            rooms: [{ locationId: null, proctorName: '', proctors: [], seats: 40 }],
          },
        ],
        regStartDate: p,
        regEndDate: p,
        payStartDate: p,
        payEndDate: p,
        eligibleCandidates: [],
      }),
    le = fe(() => e.value.examType === Fe),
    we = fe(() => {
      const o = E.value.trim().toLowerCase();
      return o
        ? e.value.eligibleCandidates.filter((l) => {
            const i = l.nationalId?.toLowerCase() ?? '',
              n = l.fullName?.toLowerCase() ?? '',
              D = l.passportNo?.toLowerCase() ?? '',
              y = l.fullNameEn?.toLowerCase() ?? '';
            return (
              i.includes(o) ||
              D.includes(o) ||
              n.includes(o) ||
              y.includes(o) ||
              l.passcode.toLowerCase().includes(o)
            );
          })
        : e.value.eligibleCandidates;
    }),
    H = (o) => {
      if (!o || !o.includes('/')) return 0;
      const l = o.split('/');
      if (l.length !== 3) return 0;
      const i = l[0],
        n = l[1],
        D = l[2];
      return !i || !n || !D ? 0 : parseInt(D, 10) * 1e4 + parseInt(n, 10) * 100 + parseInt(i, 10);
    },
    ce = fe(() => {
      const o = {
          regStartDate: '',
          regEndDate: '',
          payStartDate: '',
          payEndDate: '',
          examDate: '',
        },
        l = H(p),
        i = H(e.value.regStartDate),
        n = H(e.value.regEndDate),
        D = H(e.value.payStartDate),
        y = H(e.value.payEndDate),
        N = H(e.value.examDate);
      (!x.value &&
        i > 0 &&
        i < l &&
        (o.regStartDate = 'วันที่เริ่มต้นลงทะเบียนต้องไม่เป็นวันที่ผ่านไปแล้ว'),
        n > 0 &&
          i > 0 &&
          n < i &&
          (o.regEndDate = 'วันที่สิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน'),
        !le.value &&
          D > 0 &&
          i > 0 &&
          D < i &&
          (o.payStartDate = 'วันที่เริ่มต้นชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน'),
        !le.value &&
          y > 0 &&
          D > 0 &&
          y < D &&
          (o.payEndDate = 'วันที่สิ้นสุดการชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นชำระเงิน'),
        N > 0 && n > 0 && N < n && (o.examDate = 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการลงทะเบียน'),
        !le.value &&
          N > 0 &&
          y > 0 &&
          N < y &&
          (o.examDate
            ? (o.examDate += ' และต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน')
            : (o.examDate = 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน')));
      const M = !x.value || e.value.examDate !== _.value;
      return (
        N > 0 &&
          N < l &&
          M &&
          (o.examDate
            ? (o.examDate += ' และต้องไม่เป็นวันที่ผ่านไปแล้ว')
            : (o.examDate = 'วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว')),
        o
      );
    }),
    ye = (o) => {
      if (!o) return 9999;
      const l = R.value.find((n) => n.value === o);
      if (!l || !l.raw) return 9999;
      const i = l.raw.SEATS;
      return i
        ? i.filter((n) => n.LS_SEAT_STATUS !== 1 && n.LS_SEAT_STATUS !== 2).length
        : l.raw.LOCATION_SEAT_CAPACITY !== void 0 && l.raw.LOCATION_SEAT_CAPACITY !== null
          ? l.raw.LOCATION_SEAT_CAPACITY
          : 0;
    },
    ie = P({}),
    ve = P(0),
    se = (o) => {
      if (!o) return 9999;
      const l = o.replace(/\s/g, '');
      if (!l) return 9999;
      const i = l.split(':'),
        n = parseInt(i[0] || '0', 10),
        D = parseInt(i[1] || '0', 10);
      return n * 60 + D;
    },
    Ee = () => {
      const o = {};
      return (
        (!e.value.examName || !e.value.examName.trim()) && (o.examName = oe.EXAM_NAME),
        (!e.value.examRound || !e.value.examRound.trim()) && (o.examRound = oe.EXAM_ROUND),
        e.value.examType || (o.examType = oe.EXAM_TYPE),
        e.value.examFormat || (o.examFormat = oe.EXAM_FORMAT),
        !le.value && !e.value.fundSourceId && (o.fundSourceId = oe.FUND_SOURCE),
        (!e.value.examDate || !e.value.examDate.trim()) && (o.examDate = oe.EXAM_DATE),
        e.value.timeSlots.forEach((l, i) => {
          const n = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          let D = !1,
            y = !1;
          const N = new Set();
          (!l.startTime || !l.startTime.trim()
            ? (o[`startTime_${i}`] = oe.START_TIME)
            : n.test(l.startTime)
              ? (D = !0)
              : (o[`startTime_${i}`] = 'รูปแบบเวลาไม่ถูกต้อง (ต้องอยู่ระหว่าง 00:00 - 23:59)'),
            !l.endTime || !l.endTime.trim()
              ? (o[`endTime_${i}`] = oe.END_TIME)
              : n.test(l.endTime)
                ? (y = !0)
                : (o[`endTime_${i}`] = 'รูปแบบเวลาไม่ถูกต้อง (ต้องอยู่ระหว่าง 00:00 - 23:59)'),
            D &&
              y &&
              se(l.endTime) <= se(l.startTime) &&
              (o[`endTime_${i}`] = 'เวลาสิ้นสุดต้องหลังจากเวลาเริ่ม'),
            l.rooms.forEach((M, W) => {
              if (
                (M.locationId
                  ? N.has(M.locationId)
                    ? (o[`locationId_${i}_${W}`] = 'ไม่สามารถเลือกห้องสอบซ้ำในช่วงเวลาเดียวกันได้')
                    : N.add(M.locationId)
                  : (o[`locationId_${i}_${W}`] = oe.LOCATION),
                !M.seats || M.seats <= 0)
              )
                o[`seats_${i}_${W}`] = oe.SEATS;
              else if (M.locationId) {
                const te = ye(M.locationId);
                M.seats > te &&
                  (o[`seats_${i}_${W}`] =
                    `เกินขอบเขตความจุที่นั่งของห้องสอบ มีที่นั่งได้ไม่เกิน ${te} ที่นั่ง ในสถานที่นี้`);
              }
            }));
        }),
        (!e.value.regStartDate || !e.value.regStartDate.trim()) &&
          (o.regStartDate = oe.REG_START_DATE),
        (!e.value.regEndDate || !e.value.regEndDate.trim()) && (o.regEndDate = oe.REG_END_DATE),
        le.value ||
          ((!e.value.payStartDate || !e.value.payStartDate.trim()) &&
            (o.payStartDate = oe.PAY_START_DATE),
          (!e.value.payEndDate || !e.value.payEndDate.trim()) && (o.payEndDate = oe.PAY_END_DATE)),
        (ie.value = o),
        Object.keys(o).length === 0
      );
    },
    pe = () => {
      ve.value++;
    },
    w = (o) => {
      if (ie.value[o]) {
        const l = { ...ie.value };
        (delete l[o], (ie.value = l));
      }
    },
    v = async () => {
      await Re();
      const o = Object.keys(ie.value)[0];
      if (!o) return;
      const l = document.querySelector(`[data-field="${o}"]`);
      if (l) {
        (l.scrollIntoView({ behavior: 'smooth', block: 'center' }), await Re());
        const i = l.querySelector('input, select, .q-field__native');
        i && typeof i.focus == 'function' && i.focus();
      }
    },
    I = (o) => {
      if (!o) return p;
      const l = new Date(o);
      if (isNaN(l.getTime())) return p;
      const i = String(l.getDate()).padStart(2, '0'),
        n = String(l.getMonth() + 1).padStart(2, '0'),
        D = l.getFullYear() + _e;
      return `${i}/${n}/${D}`;
    },
    ee = async () => {
      ((T.value = !0), (u.value = null));
      try {
        const [o, l, i] = await Promise.all([Tt(), wt(), dt(ut.PROCTOR)]);
        if (
          ((R.value = o),
          (F.value = l.map((n) => ({
            label: `${n.FS_NAME} (${n.FS_ACCOUNT_CODE})`,
            value: n.FS_ID,
          }))),
          (k.value = i.map((n) => {
            const y =
              (n.fullNameTH ? `${n.titleTH || ''} ${n.fullNameTH}`.trim() : n.email) ||
              'ไม่ระบุชื่อ';
            return { label: y, value: y };
          })),
          S)
        ) {
          const n = await Dt(S);
          if (
            ((e.value.examName = n.EXAM_NAME || ''),
            (e.value.examRound = n.EXAM_ROUND || ''),
            (e.value.examType = n.EXAM_TYPE || qe),
            (e.value.examFormat = n.EXAM_FORMAT || Le),
            (e.value.fee = Number(n.EXAM_FEE ?? 0).toFixed(2)),
            (e.value.isPublished = n.EXAM_PUBLISHED ?? !1),
            (B.value = n.EXAM_PUBLISHED ?? !1),
            (e.value.examDate = I(n.EXAM_DATE)),
            (_.value = e.value.examDate),
            (e.value.regStartDate = I(n.EXAM_REG_START_DATE)),
            (e.value.regEndDate = I(n.EXAM_REG_END_DATE)),
            (e.value.payStartDate = I(n.EXAM_PAY_START_DATE)),
            (e.value.payEndDate = I(n.EXAM_PAY_END_DATE)),
            (e.value.fundSourceId = n.FUND_SOURCE_ID ?? null),
            n.SESSIONS && n.SESSIONS.length > 0)
          ) {
            const D = new Map();
            (n.SESSIONS.forEach((y) => {
              const N = y.SS_START_TIME ? y.SS_START_TIME.substring(0, 5) : '',
                M = y.SS_END_TIME ? y.SS_END_TIME.substring(0, 5) : '',
                W = `${N}-${M}`;
              D.has(W) || D.set(W, { startTime: N, endTime: M, rooms: [] });
              const te = D.get(W),
                ne = y.SESSION_LOCATIONS || [];
              if (ne.length > 0) {
                ne.filter((O) => O.LOCATION).forEach((O) => {
                  const ae = [];
                  if (O.SS_NAME) {
                    const Y = O.SS_NAME.split(',')
                      .map((j) => j.trim())
                      .filter(Boolean);
                    ae.push(...Y);
                  }
                  te.rooms.push({
                    locationId: O.LOCATION_ID ?? O.LOCATION.LOCATION_ID ?? null,
                    proctorName: O.SS_NAME || '',
                    proctors: Array.from(new Set(ae)),
                    seats:
                      O.LOCATION.SEATS?.filter(
                        (Y) => Y.LS_SEAT_STATUS !== 1 && Y.LS_SEAT_STATUS !== 2,
                      ).length ||
                      O.LOCATION.LOCATION_SEAT_CAPACITY ||
                      40,
                    sessionId: y.SS_ID,
                    enrollmentCount: y.ENROLLMENTS?.filter((Y) => Y.SL_ID === O.SL_ID).length || 0,
                  });
                });
                return;
              }
              te.rooms.push({
                locationId: y.LOCATION?.LOCATION_ID ?? y.LOCATION_ID ?? null,
                proctorName: '',
                proctors: [],
                seats: y.SS_CAPACITY ?? 40,
                sessionId: y.SS_ID,
                enrollmentCount: y.ENROLLMENTS?.length || 0,
              });
            }),
              (e.value.timeSlots = Array.from(D.values())),
              Z());
          }
          n.PASSCODES &&
            n.PASSCODES.length > 0 &&
            (e.value.eligibleCandidates = n.PASSCODES.map((D, y) => ({
              index: y + 1,
              nationalId: D.NATIONAL_ID,
              fullName: D.FULL_NAME,
              passcode: D.PASSCODE,
            })));
        }
      } catch (o) {
        console.error('Failed to load initial data:', o);
        const l = re.LOAD_ERROR;
        ((u.value = l), c.notify({ type: 'negative', message: l, position: 'top' }));
      } finally {
        T.value = !1;
      }
    },
    Z = () => {
      if (e.value.timeSlots.length <= 1) return;
      const o = e.value.timeSlots[d.value];
      if (
        (e.value.timeSlots.sort((l, i) => {
          const n = se(l.startTime),
            D = se(i.startTime);
          if (n !== D) return n - D;
          const y = se(l.endTime),
            N = se(i.endTime);
          return y - N;
        }),
        o)
      ) {
        const l = e.value.timeSlots.indexOf(o);
        l !== -1 && (d.value = l);
      }
    },
    X = () => {
      m.value ||
        (e.value.timeSlots.length < Ue
          ? (e.value.timeSlots.push({
              startTime: '',
              endTime: '',
              rooms: [{ locationId: null, proctorName: '', proctors: [], seats: 40 }],
            }),
            Z(),
            (d.value = e.value.timeSlots.length - 1))
          : c.notify({ type: 'warning', message: re.MAX_SESSIONS(Ue), position: 'top' }));
    },
    de = (o) => {
      m.value ||
        (e.value.timeSlots.length > Qe
          ? (e.value.timeSlots.splice(o, 1),
            d.value >= e.value.timeSlots.length && (d.value = e.value.timeSlots.length - 1),
            Z())
          : c.notify({ type: 'warning', message: re.MIN_SESSIONS(Qe), position: 'top' }));
    },
    Je = (o) => {
      m.value ||
        e.value.timeSlots[o]?.rooms.push({
          locationId: null,
          proctorName: '',
          proctors: [],
          seats: 40,
        });
    },
    Ze = (o, l) => {
      if (m.value) return;
      const i = e.value.timeSlots[o];
      i && i.rooms.length > 1
        ? i.rooms.splice(l, 1)
        : c.notify({ type: 'warning', message: 'ต้องมีห้องสอบอย่างน้อย 1 ห้อง', position: 'top' });
    },
    et = (o) => (o.charCodeAt(0) === 65279 ? o.slice(1) : o),
    tt = (o) => {
      const l = [];
      let i = [],
        n = '',
        D = !1;
      for (let y = 0; y < o.length; y++) {
        const N = o[y],
          M = o[y + 1];
        D
          ? N === '"'
            ? M === '"'
              ? ((n += '"'), y++)
              : (D = !1)
            : (n += N)
          : N === '"'
            ? (D = !0)
            : N === ','
              ? (i.push(n.trim()), (n = ''))
              : N ===
                    `
` ||
                  (N === '\r' &&
                    M ===
                      `
`)
                ? (i.push(n.trim()), l.push(i), (i = []), (n = ''), N === '\r' && y++)
                : (n += N);
      }
      return (
        (i.length > 0 || n !== '') && (i.push(n.trim()), l.push(i)),
        l.filter((y) => y.some((N) => N !== ''))
      );
    },
    Be = (o, l) =>
      o.findIndex((i) => {
        const n = i.replace(/["\s]/g, '').toLowerCase();
        return l.some((D) => n.includes(D));
      }),
    at = (o) => {
      try {
        if (!o) return;
        c.loading.show({ message: 'กำลังเตรียมนำเข้าข้อมูล...' });
        const l = new FileReader();
        ((l.onload = (i) => {
          try {
            const n = i.target?.result,
              D = et(n),
              y = tt(D);
            if (y.length < 2) {
              (c.notify({
                type: 'warning',
                message: 'ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย header + 1 แถว)',
              }),
                c.loading.hide());
              return;
            }
            const N = y[0] ?? [],
              M = ['รหัสประชาชน', 'รหัสประจำตัว', 'รหัส', 'nationalid', 'studentid', 'id'],
              W = ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'ชื่อ', 'fullname', 'name'];
            let te = Be(N, M),
              ne = Be(N, W);
            if (te === -1 || ne === -1)
              if (N.length === 2) ((te = 0), (ne = 1));
              else if (N.length >= 3) ((te = 1), (ne = 2));
              else {
                (c.notify({
                  type: 'negative',
                  message: 'ไฟล์ต้องมีอย่างน้อย 2 คอลัมน์ (รหัสประจำตัว, ชื่อ-นามสกุล)',
                }),
                  c.loading.hide());
                return;
              }
            const O = [];
            for (let ae = 1; ae < y.length; ae++) {
              const Y = y[ae];
              if (!Y) continue;
              const j = Y[te],
                De = Y[ne];
              j &&
                De &&
                j.trim().length > 0 &&
                O.push({ nationalId: j.trim(), fullName: De.trim(), passcode: '' });
            }
            if (O.length === 0) {
              (c.notify({ type: 'warning', message: 'ไม่พบข้อมูลรายชื่อในไฟล์' }),
                c.loading.hide());
              return;
            }
            ((e.value.eligibleCandidates = O),
              c.notify({
                type: 'positive',
                message: `นำเข้าข้อมูลรายชื่อสำเร็จ ${O.length} รายการ`,
              }));
          } catch {
            c.notify({ type: 'negative', message: 'รูปแบบไฟล์ไม่ถูกต้อง' });
          } finally {
            c.loading.hide();
          }
        }),
          l.readAsText(o, 'UTF-8'));
      } catch {
        (c.loading.hide(),
          c.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' }));
      }
    },
    ot = () => {
      if (e.value.eligibleCandidates.length === 0) {
        c.notify({ type: 'warning', message: 'ไม่มีข้อมูลให้ส่งออก', position: 'top' });
        return;
      }
      const o = '\uFEFF',
        l = '"ลำดับ","รหัสประชาชน","ชื่อ-นามสกุล","Passcode"',
        i = e.value.eligibleCandidates.map((M, W) => {
          const te = W + 1,
            ne = `"${M.nationalId || ''}"`,
            O = `"${M.fullName || ''}"`,
            ae = `"${M.passcode || ''}"`;
          return `${te},${ne},${O},${ae}`;
        }),
        n =
          o +
          [l, ...i].join(`\r
`),
        D = new Blob([n], { type: 'text/csv;charset=utf-8;' }),
        y = document.createElement('a'),
        N = URL.createObjectURL(D);
      (y.setAttribute('href', N),
        y.setAttribute('download', `passcodes_${S || 'new'}.csv`),
        (y.style.visibility = 'hidden'),
        document.body.appendChild(y),
        y.click(),
        document.body.removeChild(y));
    },
    lt = (o = 'individual') => {
      if (e.value.eligibleCandidates.length === 0) {
        c.notify({
          type: 'warning',
          message: 'กรุณานำเข้ารายชื่อก่อนสร้าง Passcode',
          position: 'top',
        });
        return;
      }
      if (o === 'single') {
        const l = String(Math.floor(1e5 + Math.random() * 9e5));
        e.value.eligibleCandidates = e.value.eligibleCandidates.map((i) => ({ ...i, passcode: l }));
      } else
        e.value.eligibleCandidates = e.value.eligibleCandidates.map((l) => ({
          ...l,
          passcode: String(Math.floor(1e5 + Math.random() * 9e5)),
        }));
      c.notify({
        type: 'positive',
        message: `สร้าง Passcode สำเร็จ ${e.value.eligibleCandidates.length} รายการ`,
        position: 'top',
        timeout: 2e3,
      });
    },
    st = () => {
      L.push('/admin/exam-management');
    },
    nt = (o) => {
      if (!o) return '';
      const l = o.replace(/\D/g, '');
      let i = 0,
        n = 0;
      if (l.length === 1 || l.length === 2) ((i = parseInt(l, 10)), (n = 0));
      else if (l.length === 3)
        ((i = parseInt(l.substring(0, 1), 10)), (n = parseInt(l.substring(1, 3), 10)));
      else if (l.length >= 4)
        ((i = parseInt(l.substring(0, 2), 10)), (n = parseInt(l.substring(2, 4), 10)));
      else return o;
      return (
        i > 23 && (i = 23),
        n > 59 && (n = 59),
        `${String(i).padStart(2, '0')}:${String(n).padStart(2, '0')}`
      );
    },
    rt = () => {
      const o = [];
      return (
        e.value.timeSlots.forEach((l) => {
          !l.startTime ||
            !l.endTime ||
            l.rooms.forEach((i) => {
              const n = i.proctors && i.proctors.length > 0 ? i.proctors.join(', ') : null;
              o.push({
                startTime: Xe(l.startTime),
                endTime: Xe(l.endTime),
                locationId: Number(i.locationId),
                seats: Number(i.seats),
                proctorName: n,
                ...(i.sessionId != null ? { sessionId: i.sessionId } : {}),
              });
            });
        }),
        o
      );
    };
  return {
    form: e,
    examTypeOptions: J,
    examFormatOptions: K,
    proctorOptions: k,
    locationOptions: R,
    fundSourceOptions: F,
    isLoadingData: T,
    error: u,
    isEditMode: x,
    isPublishedSectionLocked: V,
    isScheduleLocked: m,
    isLockedByEnrollment: a,
    isSpecialRound: le,
    wasOriginallyPublished: B,
    activeSlotIndex: d,
    candidateSearch: E,
    filteredCandidates: we,
    fieldErrors: ie,
    shakeKey: ve,
    loadInitialData: ee,
    addTimeSlot: X,
    removeTimeSlot: de,
    addRoom: Je,
    removeRoom: Ze,
    importCandidates: at,
    generatePasscodes: lt,
    exportCandidates: ot,
    handleCancel: st,
    handleSave: async () => {
      if (!Ee()) return (pe(), await v(), !1);
      const l = rt();
      if (l.length === 0)
        return (c.notify({ type: 'warning', message: re.PROVIDE_TIME, position: 'top' }), !1);
      if (l.some((O) => !O.locationId))
        return (c.notify({ type: 'warning', message: re.SELECT_LOCATION, position: 'top' }), !1);
      if (!le.value && !e.value.fundSourceId)
        return (c.notify({ type: 'warning', message: re.SELECT_FUND, position: 'top' }), !1);
      const n = H(p),
        D = H(e.value.regStartDate),
        y = H(e.value.regEndDate),
        N = H(e.value.payStartDate),
        M = H(e.value.payEndDate),
        W = H(e.value.examDate);
      if (!x.value && D < n)
        return (
          c.notify({
            type: 'warning',
            message: 'วันที่เริ่มต้นลงทะเบียนต้องไม่เป็นวันที่ผ่านไปแล้ว',
            position: 'top',
          }),
          !1
        );
      if (y < D)
        return (
          c.notify({
            type: 'warning',
            message: 'วันที่สิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน',
            position: 'top',
          }),
          !1
        );
      if (!le.value) {
        if (N < D)
          return (
            c.notify({
              type: 'warning',
              message: 'วันที่เริ่มต้นชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน',
              position: 'top',
            }),
            !1
          );
        if (M < N)
          return (
            c.notify({
              type: 'warning',
              message: 'วันที่สิ้นสุดการชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นชำระเงิน',
              position: 'top',
            }),
            !1
          );
      }
      if (W < y)
        return (
          c.notify({
            type: 'warning',
            message: 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการลงทะเบียน',
            position: 'top',
          }),
          !1
        );
      if (!le.value && W < M)
        return (
          c.notify({
            type: 'warning',
            message: 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน',
            position: 'top',
          }),
          !1
        );
      const te = !x.value || e.value.examDate !== _.value;
      if (W < n && te)
        return (
          c.notify({
            type: 'warning',
            message: 'วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว',
            position: 'top',
          }),
          !1
        );
      const ne = l.map((O) => ({
        startTime: O.startTime,
        endTime: O.endTime,
        locationId: O.locationId,
        seats: O.seats,
        proctorName: O.proctorName,
        ...(O.sessionId != null ? { sessionId: O.sessionId } : {}),
      }));
      try {
        let O = x.value ? S : null;
        const ae = e.value.examName.trim();
        if (x.value && S) {
          const Y = l.filter((j) => j.sessionId).map((j) => j.sessionId);
          (await Et({
            examId: S,
            examName: ae,
            locationId: Number(l[0]?.locationId || 0),
            examType: e.value.examType,
            examFormat: e.value.examFormat,
            fee: Number(e.value.fee),
            seats: Number(l[0]?.seats || 1),
            isPublished: e.value.isPublished,
            examDate: e.value.examDate,
            regStartDate: e.value.regStartDate,
            regEndDate: e.value.regEndDate,
            payStartDate: e.value.payStartDate,
            payEndDate: e.value.payEndDate,
            timeRanges: ne,
            fundSourceId: Number(e.value.fundSourceId || 0),
            examRound: e.value.examRound,
            existingSessionIds: Y,
          }),
            await f.loadManagementSchedules(!0),
            c.notify({
              type: 'positive',
              message: re.UPDATE_SUCCESS,
              position: 'top',
              timeout: 2e3,
            }));
        } else {
          const Y = {
            examName: ae,
            locationId: l[0]?.locationId || 0,
            examType: e.value.examType,
            examFormat: e.value.examFormat,
            fee: e.value.fee === '' ? 0 : e.value.fee,
            seats: l[0]?.seats || 1,
            isPublished: e.value.isPublished,
            examDate: e.value.examDate,
            regStartDate: e.value.regStartDate,
            regEndDate: e.value.regEndDate,
            payStartDate: e.value.payStartDate,
            payEndDate: e.value.payEndDate,
            timeRanges: ne,
            fundSourceId: e.value.fundSourceId,
            examRound: e.value.examRound,
          };
          ((O = await f.addExamRound(Y)),
            await f.loadManagementSchedules(!0),
            c.notify({
              type: 'positive',
              message: re.CREATE_SUCCESS,
              position: 'top',
              timeout: 2e3,
            }));
        }
        if (O && e.value.examType === Fe && e.value.eligibleCandidates.length > 0) {
          const Y = e.value.eligibleCandidates.map((j) => ({
            nationalId: j.nationalId ?? void 0,
            passportNo: j.passportNo ?? void 0,
            fullName: j.fullName ?? void 0,
            fullNameEn: j.fullNameEn ?? void 0,
            passcode: j.passcode,
          }));
          await xt(O, Y);
        }
        return (L.push('/admin/exam-management'), !0);
      } catch (O) {
        console.error('Save error:', O);
        const ae = O,
          Y = ae.response?.data?.message,
          j = Array.isArray(Y) ? Y.join(', ') : Y || ae.message,
          De = j
            ? `${x.value ? re.UPDATE_ERROR : re.CREATE_ERROR}: ${j}`
            : x.value
              ? re.UPDATE_ERROR
              : re.CREATE_ERROR;
        return ((u.value = De), c.notify({ type: 'negative', message: De, position: 'top' }), !1);
      }
    },
    autoFormatTime: nt,
    sortTimeSlots: Z,
    dateErrors: ce,
    clearFieldError: w,
  };
}
const Ot = { class: 'row items-center q-mb-md' },
  Rt = { class: 'row q-col-gutter-lg' },
  Pt = { class: 'col-12 col-md-6 row q-col-gutter-y-md content-start' },
  Lt = { class: 'col-12', 'data-field': 'examType' },
  qt = { class: 'col-12 row no-wrap exam-name-round-row' },
  Ft = { class: 'col', 'data-field': 'examName' },
  Mt = { class: 'col', 'data-field': 'examRound' },
  Ut = { key: 0, class: 'col-12', 'data-field': 'fee' },
  Bt = { class: 'col-12 col-md-6 row q-col-gutter-y-md content-start' },
  _t = { class: 'col-12', 'data-field': 'examFormat' },
  Qt = { key: 0, class: 'col-12', 'data-field': 'fundSourceId' },
  Xt = { class: 'col-12 self-end' },
  zt = { class: 'full-width row items-center justify-between no-wrap' },
  Kt = Se({
    __name: 'create-exam-details-card',
    props: me(
      {
        examTypeOptions: {},
        examFormatOptions: {},
        fundSourceOptions: {},
        isLoadingData: { type: Boolean },
        isLocked: { type: Boolean },
        isSpecialRound: { type: Boolean },
        fieldErrors: {},
        shakeKey: {},
      },
      { form: { required: !0 }, formModifiers: {} },
    ),
    emits: me(['clearFieldError'], ['update:form']),
    setup(t, { emit: G }) {
      const L = t,
        c = G,
        f = Ne(t, 'form'),
        S = (V) => !!(L.fieldErrors && L.fieldErrors[V]),
        x = (V) => {
          let m = String(V ?? '').replace(/[^\d.]/g, '');
          const a = m.indexOf('.');
          (a !== -1 && (m = m.slice(0, a + 1) + m.slice(a + 1).replace(/\./g, '')),
            (f.value.fee = m));
        },
        B = (V) => {
          if (!/[0-9.]/.test(V.key)) {
            V.preventDefault();
            return;
          }
          V.key === '.' && String(f.value.fee ?? '').includes('.') && V.preventDefault();
        },
        _ = () => {
          const V = String(f.value.fee ?? '').trim();
          if (V === '' || V === '.') {
            f.value.fee = '';
            return;
          }
          const m = Number(V);
          f.value.fee = Number.isNaN(m) ? '' : m.toFixed(2);
        };
      return (V, m) => (
        g(),
        z(
          Ve,
          { flat: '', bordered: '', class: 'q-mb-xl exam-card buu-premium-card' },
          {
            default: h(() => [
              r(Te, null, {
                default: h(() => [
                  s('div', Ot, [
                    r(C, { name: 'assignment', size: '20px', class: 'q-mr-sm text-dark' }),
                    m[11] ||
                      (m[11] = s(
                        'div',
                        { class: 'text-subtitle1 text-weight-bold text-dark' },
                        'ข้อมูลพื้นฐาน',
                        -1,
                      )),
                  ]),
                  s('div', Rt, [
                    s('div', Pt, [
                      s('div', Lt, [
                        m[12] ||
                          (m[12] = s(
                            'div',
                            { class: 'buu-label-muted q-mb-xs' },
                            'ประเภทการสอบ',
                            -1,
                          )),
                        r(
                          Ae,
                          {
                            modelValue: f.value.examType,
                            'onUpdate:modelValue': [
                              m[0] || (m[0] = (a) => (f.value.examType = a)),
                              m[1] || (m[1] = (a) => c('clearFieldError', 'examType')),
                            ],
                            options: t.examTypeOptions,
                            outlined: '',
                            dense: '',
                            'bg-color': 'white',
                            'dropdown-icon': 'keyboard_arrow_down',
                            class: U(['buu-input-muted', { 'buu-field-error': S('examType') }]),
                            disable: t.isLocked,
                          },
                          null,
                          8,
                          ['modelValue', 'options', 'class', 'disable'],
                        ),
                        S('examType')
                          ? (g(),
                            A('div', { key: `examType-${t.shakeKey}`, class: 'buu-error-msg' }, [
                              r(C, { name: 'error', class: 'buu-error-icon' }),
                              Q(' ' + q(t.fieldErrors?.examType), 1),
                            ]))
                          : $('', !0),
                      ]),
                      s('div', qt, [
                        s('div', Ft, [
                          m[13] ||
                            (m[13] = s(
                              'div',
                              { class: 'buu-label-muted q-mb-xs' },
                              'ชื่อการสอบ',
                              -1,
                            )),
                          r(
                            ue,
                            {
                              modelValue: f.value.examName,
                              'onUpdate:modelValue': [
                                m[2] || (m[2] = (a) => (f.value.examName = a)),
                                m[3] || (m[3] = (a) => c('clearFieldError', 'examName')),
                              ],
                              placeholder: 'BUU-GET',
                              outlined: '',
                              dense: '',
                              'bg-color': 'white',
                              class: U(['buu-input-muted', { 'buu-field-error': S('examName') }]),
                              disable: t.isLocked,
                            },
                            null,
                            8,
                            ['modelValue', 'class', 'disable'],
                          ),
                          S('examName')
                            ? (g(),
                              A('div', { key: `examName-${t.shakeKey}`, class: 'buu-error-msg' }, [
                                r(C, { name: 'error', class: 'buu-error-icon' }),
                                Q(' ' + q(t.fieldErrors?.examName), 1),
                              ]))
                            : $('', !0),
                        ]),
                        s('div', Mt, [
                          m[14] ||
                            (m[14] = s(
                              'div',
                              { class: 'buu-label-muted q-mb-xs' },
                              'รอบการสอบ',
                              -1,
                            )),
                          r(
                            ue,
                            {
                              modelValue: f.value.examRound,
                              'onUpdate:modelValue': [
                                m[4] || (m[4] = (a) => (f.value.examRound = a)),
                                m[5] || (m[5] = (a) => c('clearFieldError', 'examRound')),
                              ],
                              placeholder: '1/2026',
                              outlined: '',
                              dense: '',
                              'bg-color': 'white',
                              class: U(['buu-input-muted', { 'buu-field-error': S('examRound') }]),
                              disable: t.isLocked,
                            },
                            null,
                            8,
                            ['modelValue', 'class', 'disable'],
                          ),
                          S('examRound')
                            ? (g(),
                              A('div', { key: `examRound-${t.shakeKey}`, class: 'buu-error-msg' }, [
                                r(C, { name: 'error', class: 'buu-error-icon' }),
                                Q(' ' + q(t.fieldErrors?.examRound), 1),
                              ]))
                            : $('', !0),
                        ]),
                      ]),
                      t.isSpecialRound
                        ? $('', !0)
                        : (g(),
                          A('div', Ut, [
                            m[15] ||
                              (m[15] = s(
                                'div',
                                { class: 'buu-label-muted q-mb-xs' },
                                'ค่าธรรมเนียม',
                                -1,
                              )),
                            r(
                              ue,
                              {
                                'model-value': f.value.fee,
                                placeholder: '0.00',
                                inputmode: 'decimal',
                                suffix: 'THB',
                                outlined: '',
                                dense: '',
                                'bg-color': 'white',
                                class: 'buu-input-muted',
                                disable: t.isLocked,
                                onKeypress: B,
                                'onUpdate:modelValue': x,
                                onBlur: _,
                              },
                              null,
                              8,
                              ['model-value', 'disable'],
                            ),
                          ])),
                    ]),
                    s('div', Bt, [
                      s('div', _t, [
                        m[16] ||
                          (m[16] = s(
                            'div',
                            { class: 'buu-label-muted q-mb-xs' },
                            'รูปแบบการสอบ',
                            -1,
                          )),
                        r(
                          Ae,
                          {
                            modelValue: f.value.examFormat,
                            'onUpdate:modelValue': [
                              m[6] || (m[6] = (a) => (f.value.examFormat = a)),
                              m[7] || (m[7] = (a) => c('clearFieldError', 'examFormat')),
                            ],
                            options: t.examFormatOptions,
                            outlined: '',
                            dense: '',
                            'bg-color': 'white',
                            'dropdown-icon': 'keyboard_arrow_down',
                            class: U(['buu-input-muted', { 'buu-field-error': S('examFormat') }]),
                            disable: t.isLocked,
                          },
                          null,
                          8,
                          ['modelValue', 'options', 'class', 'disable'],
                        ),
                        S('examFormat')
                          ? (g(),
                            A('div', { key: `examFormat-${t.shakeKey}`, class: 'buu-error-msg' }, [
                              r(C, { name: 'error', class: 'buu-error-icon' }),
                              Q(' ' + q(t.fieldErrors?.examFormat), 1),
                            ]))
                          : $('', !0),
                      ]),
                      t.isSpecialRound
                        ? $('', !0)
                        : (g(),
                          A('div', Qt, [
                            m[17] ||
                              (m[17] = s(
                                'div',
                                { class: 'buu-label-muted q-mb-xs' },
                                'รหัสผังแหล่งเงิน',
                                -1,
                              )),
                            r(
                              Ae,
                              {
                                modelValue: f.value.fundSourceId,
                                'onUpdate:modelValue': [
                                  m[8] || (m[8] = (a) => (f.value.fundSourceId = a)),
                                  m[9] || (m[9] = (a) => c('clearFieldError', 'fundSourceId')),
                                ],
                                options: t.fundSourceOptions,
                                'option-label': 'label',
                                'option-value': 'value',
                                'emit-value': '',
                                'map-options': '',
                                outlined: '',
                                dense: '',
                                'bg-color': 'white',
                                loading: t.isLoadingData,
                                placeholder: 'ผังแหล่งเงิน',
                                'dropdown-icon': 'keyboard_arrow_down',
                                class: U([
                                  'buu-input-muted',
                                  { 'buu-field-error': S('fundSourceId') },
                                ]),
                                disable: t.isLocked,
                              },
                              null,
                              8,
                              ['modelValue', 'options', 'loading', 'class', 'disable'],
                            ),
                            S('fundSourceId')
                              ? (g(),
                                A(
                                  'div',
                                  { key: `fundSourceId-${t.shakeKey}`, class: 'buu-error-msg' },
                                  [
                                    r(C, { name: 'error', class: 'buu-error-icon' }),
                                    Q(' ' + q(t.fieldErrors?.fundSourceId), 1),
                                  ],
                                ))
                              : $('', !0),
                          ])),
                      s('div', Xt, [
                        r(
                          kt,
                          {
                            outlined: '',
                            'bg-color': 'white',
                            class: 'buu-field-large buu-input-muted',
                          },
                          {
                            control: h(() => [
                              s('div', zt, [
                                m[19] ||
                                  (m[19] = s(
                                    'span',
                                    { class: 'buu-label-muted' },
                                    'สถานะเผยแพร่',
                                    -1,
                                  )),
                                r(
                                  mt,
                                  {
                                    modelValue: f.value.isPublished,
                                    'onUpdate:modelValue':
                                      m[10] || (m[10] = (a) => (f.value.isPublished = a)),
                                    color: 'primary',
                                    class: 'buu-toggle-muted',
                                    disable: t.isLocked,
                                  },
                                  {
                                    default: h(() => [
                                      t.isLocked
                                        ? (g(),
                                          z(
                                            Ge,
                                            { key: 0, class: 'bg-amber-9 text-body2' },
                                            {
                                              default: h(() => [
                                                ...(m[18] ||
                                                  (m[18] = [
                                                    Q(
                                                      ' ไม่สามารถปิดสถานะเผยแพร่ได้เนื่องจากมีการเผยแพร่ไปแล้ว ',
                                                      -1,
                                                    ),
                                                  ])),
                                              ]),
                                              _: 1,
                                            },
                                          ))
                                        : $('', !0),
                                    ]),
                                    _: 1,
                                  },
                                  8,
                                  ['modelValue', 'disable'],
                                ),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                    ]),
                  ]),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  Yt = be(Kt, [['__scopeId', 'data-v-881abaaa']]),
  jt = { class: 'time-wheel' },
  Ht = { class: 'time-wheel__body' },
  Wt = ['onClick'],
  Gt = ['onClick'],
  Oe = 36,
  Jt = Se({
    inheritAttrs: !1,
    __name: 'app-time-picker',
    props: { modelValue: {} },
    emits: ['update:modelValue', 'select'],
    setup(t, { emit: G }) {
      const L = t,
        c = G,
        f = Array.from({ length: 24 }, (w, v) => String(v).padStart(2, '0')),
        S = Array.from({ length: 60 }, (w, v) => String(v).padStart(2, '0')),
        x = P(null),
        B = P(null),
        _ = P(220),
        V = P(),
        m = P(null),
        a = P(null),
        p = P('08'),
        J = P('00'),
        K = P(!1),
        k = P(null),
        R = {};
      let F = 0,
        T = 0,
        u = !1,
        d = null;
      const E = () => {
          const w = B.value?.$el,
            v = w?.querySelector('.q-field__control');
          if (w && v) {
            const I = v.getBoundingClientRect();
            ((_.value = I.width), (V.value = v));
          }
          ((K.value = !0), x.value?.show());
        },
        e = (w, v, I) => {
          const ee = w === 'hour' ? f : S,
            Z = w === 'hour' ? m.value : a.value,
            X = ee.indexOf(v);
          if (Z && X >= 0) {
            if (I === 'auto') {
              ((Z.style.scrollBehavior = 'auto'),
                (Z.scrollTop = X * Oe),
                Z.style.removeProperty('scroll-behavior'));
              return;
            }
            Z.scrollTo({ top: X * Oe, behavior: I });
          }
        },
        le = async () => {
          const [w = '08', v = '00'] = (L.modelValue || '08:00').split(':');
          ((p.value = f.includes(w) ? w : '08'),
            (J.value = S.includes(v) ? v : '00'),
            await Re(),
            e('hour', p.value, 'auto'),
            e('minute', J.value, 'auto'));
        },
        we = () => {
          const w = x.value?.$el;
          if (!w) return;
          const v = `${_.value}px`;
          (w.style.setProperty('width', v, 'important'),
            w.style.setProperty('min-width', v, 'important'),
            w.style.setProperty('max-width', v, 'important'),
            w.style.setProperty('box-sizing', 'border-box', 'important'));
        },
        H = async () => {
          (await le(), await Re(), we());
        },
        ce = (w, v = !1) => {
          const I = w === 'hour' ? f : S,
            ee = w === 'hour' ? m.value : a.value;
          if (!ee) return;
          const Z = Math.max(0, Math.min(I.length - 1, Math.round(ee.scrollTop / Oe))),
            X = I[Z];
          X &&
            (w === 'hour' ? (p.value = X) : (J.value = X),
            ve(!1),
            v &&
              ((u = !0),
              ee.scrollTo({ top: Z * Oe, behavior: 'smooth' }),
              ve(!0),
              window.setTimeout(() => {
                u = !1;
              }, 180)));
        },
        ye = (w) => {
          if (u) return;
          ce(w);
          const v = R[w];
          (v && clearTimeout(v), (R[w] = setTimeout(() => ce(w, !0), 140)));
        },
        ie = (w, v) => {
          (w === 'hour' ? (p.value = v) : (J.value = v), e(w, v, 'smooth'), ve(!0));
        },
        ve = (w) => {
          const v = `${p.value}:${J.value}`;
          (c('update:modelValue', v), w && c('select', v));
        },
        se = (w) => {
          if (!k.value) return;
          const v = k.value;
          ((v === 'hour' ? m.value : a.value)?.releasePointerCapture(w.pointerId),
            ce(v, !0),
            (k.value = null),
            d !== null && (cancelAnimationFrame(d), (d = null)),
            window.removeEventListener('pointermove', Ee),
            window.removeEventListener('pointerup', se),
            window.removeEventListener('pointercancel', se));
        },
        Ee = (w) => {
          if (!k.value || d !== null) return;
          const v = k.value,
            I = T + F - w.clientY;
          d = requestAnimationFrame(() => {
            const ee = v === 'hour' ? m.value : a.value;
            (ee && ((ee.scrollTop = I), ce(v)), (d = null));
          });
        },
        pe = (w, v) => {
          if (v.pointerType === 'touch') return;
          const I = w === 'hour' ? m.value : a.value;
          I &&
            ((k.value = w),
            (F = v.clientY),
            (T = I.scrollTop),
            I.setPointerCapture(v.pointerId),
            window.addEventListener('pointermove', Ee),
            window.addEventListener('pointerup', se),
            window.addEventListener('pointercancel', se));
        };
      return (w, v) => (
        g(),
        z(
          ue,
          He({ ref_key: 'inputRef', ref: B }, w.$attrs, {
            'model-value': t.modelValue,
            readonly: '',
            class: ['app-time-picker cursor-pointer', { 'app-time-picker--open': K.value }],
            onClick: E,
          }),
          {
            append: h(() => [
              r(C, { name: 'schedule', class: 'cursor-pointer', onClick: ge(E, ['stop']) }),
              r(
                xe,
                {
                  ref_key: 'menuRef',
                  ref: x,
                  target: V.value,
                  'no-parent-event': '',
                  anchor: 'bottom left',
                  self: 'top left',
                  class: 'app-time-picker__menu',
                  style: ct({ '--app-time-picker-width': `${_.value}px` }),
                  offset: [0, 0],
                  onShow: H,
                  onHide: v[4] || (v[4] = (I) => (K.value = !1)),
                },
                {
                  default: h(() => [
                    s('div', jt, [
                      s('div', Ht, [
                        v[9] ||
                          (v[9] = s(
                            'div',
                            { class: 'time-wheel__fade time-wheel__fade--top' },
                            null,
                            -1,
                          )),
                        v[10] ||
                          (v[10] = s(
                            'div',
                            { class: 'time-wheel__fade time-wheel__fade--bottom' },
                            null,
                            -1,
                          )),
                        s(
                          'div',
                          {
                            ref_key: 'hourWheelRef',
                            ref: m,
                            class: U([
                              'time-wheel__column',
                              { 'time-wheel__column--dragging': k.value === 'hour' },
                            ]),
                            onScroll: v[0] || (v[0] = (I) => ye('hour')),
                            onPointerdown: v[1] || (v[1] = (I) => pe('hour', I)),
                          },
                          [
                            v[5] || (v[5] = s('div', { class: 'time-wheel__spacer' }, null, -1)),
                            (g(!0),
                            A(
                              he,
                              null,
                              Pe(
                                b(f),
                                (I) => (
                                  g(),
                                  A(
                                    'button',
                                    {
                                      key: I,
                                      type: 'button',
                                      class: U([
                                        'time-wheel__option',
                                        { 'time-wheel__option--active': I === p.value },
                                      ]),
                                      onClick: (ee) => ie('hour', I),
                                    },
                                    q(I),
                                    11,
                                    Wt,
                                  )
                                ),
                              ),
                              128,
                            )),
                            v[6] || (v[6] = s('div', { class: 'time-wheel__spacer' }, null, -1)),
                          ],
                          34,
                        ),
                        v[11] || (v[11] = s('div', { class: 'time-wheel__separator' }, ':', -1)),
                        s(
                          'div',
                          {
                            ref_key: 'minuteWheelRef',
                            ref: a,
                            class: U([
                              'time-wheel__column',
                              { 'time-wheel__column--dragging': k.value === 'minute' },
                            ]),
                            onScroll: v[2] || (v[2] = (I) => ye('minute')),
                            onPointerdown: v[3] || (v[3] = (I) => pe('minute', I)),
                          },
                          [
                            v[7] || (v[7] = s('div', { class: 'time-wheel__spacer' }, null, -1)),
                            (g(!0),
                            A(
                              he,
                              null,
                              Pe(
                                b(S),
                                (I) => (
                                  g(),
                                  A(
                                    'button',
                                    {
                                      key: I,
                                      type: 'button',
                                      class: U([
                                        'time-wheel__option',
                                        { 'time-wheel__option--active': I === J.value },
                                      ]),
                                      onClick: (ee) => ie('minute', I),
                                    },
                                    q(I),
                                    11,
                                    Gt,
                                  )
                                ),
                              ),
                              128,
                            )),
                            v[8] || (v[8] = s('div', { class: 'time-wheel__spacer' }, null, -1)),
                          ],
                          34,
                        ),
                        v[12] || (v[12] = s('div', { class: 'time-wheel__selection' }, null, -1)),
                      ]),
                    ]),
                  ]),
                  _: 1,
                },
                8,
                ['target', 'style'],
              ),
            ]),
            _: 1,
          },
          16,
          ['model-value', 'class'],
        )
      );
    },
  }),
  Ye = be(Jt, [['__scopeId', 'data-v-fbbdaf78']]),
  Zt = { class: 'row items-center justify-between q-mb-md section-header' },
  ea = { class: 'row items-center no-wrap' },
  ta = { class: 'slot-tabs-row q-mb-lg' },
  aa = ['onClick'],
  oa = { class: 'slot-tab__label' },
  la = { key: 0, class: 'active-slot-content' },
  sa = { class: 'row q-col-gutter-md q-mb-lg' },
  na = { class: 'col-12 col-md-6', 'data-field': 'examDate' },
  ra = { key: 1, class: 'text-caption text-negative q-mt-xs row items-center no-wrap' },
  ia = ['data-field'],
  da = ['data-field'],
  ua = { class: 'rooms-section' },
  ma = { class: 'row items-center justify-between q-mb-sm' },
  ca = ['data-field'],
  va = { class: 'col-12 col-md-3' },
  fa = ['data-field'],
  pa = { class: 'row no-wrap items-center' },
  ga = { class: 'col' },
  Sa = { key: 0, class: 'col-auto q-ml-sm', style: { width: '24px' } },
  ba = { key: 0, class: 'buu-error-msg' },
  ya = '40',
  Me = 9999,
  Ea = 1,
  xa = 2,
  je = 50,
  Ta = Se({
    __name: 'create-exam-schedule-card',
    props: me(
      {
        locked: { type: Boolean },
        locationOptions: {},
        proctorOptions: {},
        activeSlotIndex: {},
        dateErrors: {},
        fieldErrors: {},
        shakeKey: {},
      },
      { form: { required: !0 }, formModifiers: {} },
    ),
    emits: me(
      [
        'add-time-slot',
        'remove-time-slot',
        'add-room',
        'remove-room',
        'update:activeSlotIndex',
        'sort-time-slots',
        'clearFieldError',
      ],
      ['update:form'],
    ),
    setup(t, { emit: G }) {
      const L = t,
        c = Ne(t, 'form'),
        f = G,
        S = P(!1),
        x = P([]);
      We(
        () => L.proctorOptions,
        (T) => {
          x.value = T;
        },
        { immediate: !0 },
      );
      const B = (T, u) => {
          if (T === '') {
            u(() => {
              x.value = L.proctorOptions;
            });
            return;
          }
          u(() => {
            const d = T.toLowerCase();
            x.value = L.proctorOptions.filter((E) => E.label.toLowerCase().includes(d));
          });
        },
        _ = (T) => {
          setTimeout(() => {
            const u = document.querySelector(`.proctors-select-${T} .q-field__native`);
            u && u.scrollTo({ left: 0, behavior: 'smooth' });
          }, je);
        },
        V = (T) => {
          setTimeout(() => {
            const u = document.querySelector(`.proctors-select-${T} .q-field__native`);
            u && u.scrollTo({ left: u.scrollWidth, behavior: 'smooth' });
          }, je);
        },
        m = (T) => {
          ['-', '+', 'e', 'E', '.', ','].includes(T.key) && T.preventDefault();
        },
        a = (T) => {
          if (!T) return Me;
          const u = L.locationOptions.find((E) => E.value === T);
          if (!u || !u.raw) return Me;
          const d = u.raw.SEATS;
          return d
            ? d.filter((E) => E.LS_SEAT_STATUS !== Ea && E.LS_SEAT_STATUS !== xa).length
            : u.raw.LOCATION_SEAT_CAPACITY !== void 0 && u.raw.LOCATION_SEAT_CAPACITY !== null
              ? u.raw.LOCATION_SEAT_CAPACITY
              : 0;
        },
        p = (T) => {
          if (!K.value) return L.locationOptions;
          const u = new Set(
            K.value.rooms
              .filter((d, E) => E !== T)
              .map((d) => d.locationId)
              .filter((d) => d !== null),
          );
          return L.locationOptions.filter((d) => !u.has(d.value));
        },
        J = (T, u, d) => {
          f('clearFieldError', `locationId_${u}_${d}`);
          const E = a(T.locationId);
          E > 0 && E !== Me && (T.seats = E);
        },
        K = fe(() => c.value.timeSlots[L.activeSlotIndex]),
        k = (T) => !!(L.fieldErrors && L.fieldErrors[T]),
        R = (T) => {
          (f('clearFieldError', `${T}_${L.activeSlotIndex}`), f('sort-time-slots'));
        },
        F = (T, u) => {
          const d = T.startTime?.trim(),
            E = T.endTime?.trim();
          return d && E ? `${d.replace(/\s/g, '')}-${E.replace(/\s/g, '')}` : `รอบที่ ${u + 1}`;
        };
      return (T, u) => (
        g(),
        z(
          Ve,
          { flat: '', bordered: '', class: 'buu-premium-card q-mb-xl' },
          {
            default: h(() => [
              r(Te, null, {
                default: h(() => [
                  s('div', Zt, [
                    s('div', ea, [
                      r(C, { name: 'calendar_today', size: '20px', class: 'q-mr-sm text-dark' }),
                      u[12] ||
                        (u[12] = s(
                          'div',
                          { class: 'text-subtitle1 text-weight-bold text-dark' },
                          'กำหนดการสอบ',
                          -1,
                        )),
                    ]),
                    t.locked
                      ? $('', !0)
                      : (g(),
                        z(
                          Ce,
                          {
                            key: 0,
                            label: 'เพิ่มรอบเวลาสอบ',
                            color: 'primary',
                            outline: '',
                            dense: '',
                            icon: 'add_circle',
                            class: 'q-px-md add-slot-btn',
                            disabled: c.value.timeSlots.length >= b(Ue),
                            onClick: u[0] || (u[0] = (d) => T.$emit('add-time-slot')),
                          },
                          null,
                          8,
                          ['disabled'],
                        )),
                  ]),
                  s('div', ta, [
                    (g(!0),
                    A(
                      he,
                      null,
                      Pe(
                        c.value.timeSlots,
                        (d, E) => (
                          g(),
                          A(
                            'div',
                            {
                              key: E,
                              class: U([
                                'slot-tab',
                                { 'slot-tab--active': t.activeSlotIndex === E },
                              ]),
                              onClick: (e) => T.$emit('update:activeSlotIndex', E),
                            },
                            [
                              s('span', oa, q(F(d, E)), 1),
                              !t.locked && c.value.timeSlots.length > 1
                                ? (g(),
                                  z(
                                    C,
                                    {
                                      key: 0,
                                      name: 'close',
                                      size: '14px',
                                      class: 'slot-tab__close',
                                      onClick: ge((e) => T.$emit('remove-time-slot', E), ['stop']),
                                    },
                                    null,
                                    8,
                                    ['onClick'],
                                  ))
                                : $('', !0),
                            ],
                            10,
                            aa,
                          )
                        ),
                      ),
                      128,
                    )),
                  ]),
                  K.value
                    ? (g(),
                      A('div', la, [
                        s('div', sa, [
                          s('div', na, [
                            u[13] ||
                              (u[13] = s(
                                'div',
                                { class: 'buu-label-muted q-mb-xs' },
                                'วันที่สอบ',
                                -1,
                              )),
                            r(
                              ue,
                              {
                                modelValue: c.value.examDate,
                                'onUpdate:modelValue':
                                  u[5] || (u[5] = (d) => (c.value.examDate = d)),
                                outlined: '',
                                dense: '',
                                class: U([
                                  'custom-input cursor-pointer',
                                  { 'buu-field-error': k('examDate') },
                                ]),
                                readonly: '',
                                disable: t.locked,
                                'hide-bottom-space': '',
                                onClick: u[6] || (u[6] = (d) => !t.locked && (S.value = !0)),
                              },
                              {
                                append: h(() => [
                                  t.locked
                                    ? (g(),
                                      z(C, { key: 1, name: 'lock', size: 'xs', color: 'grey-5' }))
                                    : (g(),
                                      A(
                                        he,
                                        { key: 0 },
                                        [
                                          r(C, {
                                            name: 'calendar_today',
                                            class: 'cursor-pointer',
                                            size: 'xs',
                                            color: 'grey-8',
                                            onClick:
                                              u[1] || (u[1] = ge((d) => (S.value = !0), ['stop'])),
                                          }),
                                          r(
                                            xe,
                                            {
                                              modelValue: S.value,
                                              'onUpdate:modelValue':
                                                u[4] || (u[4] = (d) => (S.value = d)),
                                              anchor: 'bottom left',
                                              self: 'top left',
                                              class: 'shadow-5 calendar-menu',
                                            },
                                            {
                                              default: h(() => [
                                                r(
                                                  ke,
                                                  {
                                                    'model-value': b(Ie)(c.value.examDate),
                                                    'onUpdate:modelValue':
                                                      u[2] ||
                                                      (u[2] = (d) => {
                                                        ((c.value.examDate = b($e)(d)),
                                                          f('clearFieldError', 'examDate'));
                                                      }),
                                                    onClickDate:
                                                      u[3] || (u[3] = (d) => (S.value = !1)),
                                                  },
                                                  null,
                                                  8,
                                                  ['model-value'],
                                                ),
                                              ]),
                                              _: 1,
                                            },
                                            8,
                                            ['modelValue'],
                                          ),
                                        ],
                                        64,
                                      )),
                                ]),
                                _: 1,
                              },
                              8,
                              ['modelValue', 'class', 'disable'],
                            ),
                            k('examDate')
                              ? (g(),
                                A(
                                  'div',
                                  { key: `examDate-${t.shakeKey}`, class: 'buu-error-msg' },
                                  [
                                    r(C, { name: 'error', class: 'buu-error-icon' }),
                                    Q(' ' + q(t.fieldErrors.examDate), 1),
                                  ],
                                ))
                              : $('', !0),
                            t.dateErrors?.examDate
                              ? (g(),
                                A('div', ra, [
                                  r(C, { name: 'error', size: '14px', class: 'q-mr-xs' }),
                                  Q(' ' + q(t.dateErrors.examDate), 1),
                                ]))
                              : $('', !0),
                          ]),
                          s(
                            'div',
                            {
                              class: 'col-6 col-md-3',
                              'data-field': `startTime_${t.activeSlotIndex}`,
                            },
                            [
                              u[14] ||
                                (u[14] = s(
                                  'div',
                                  { class: 'buu-label-muted q-mb-xs' },
                                  'เวลาเริ่ม',
                                  -1,
                                )),
                              r(
                                Ye,
                                {
                                  modelValue: K.value.startTime,
                                  'onUpdate:modelValue':
                                    u[7] || (u[7] = (d) => (K.value.startTime = d)),
                                  outlined: '',
                                  dense: '',
                                  class: U([
                                    'custom-input',
                                    { 'buu-field-error': k(`startTime_${t.activeSlotIndex}`) },
                                  ]),
                                  placeholder: '08:00',
                                  'hide-bottom-space': '',
                                  disable: t.locked,
                                  onSelect: u[8] || (u[8] = (d) => R('startTime')),
                                },
                                null,
                                8,
                                ['modelValue', 'class', 'disable'],
                              ),
                              k(`startTime_${t.activeSlotIndex}`)
                                ? (g(),
                                  A(
                                    'div',
                                    { key: `startTime-${t.shakeKey}`, class: 'buu-error-msg' },
                                    [
                                      r(C, { name: 'error', class: 'buu-error-icon' }),
                                      Q(
                                        ' ' + q(t.fieldErrors[`startTime_${t.activeSlotIndex}`]),
                                        1,
                                      ),
                                    ],
                                  ))
                                : $('', !0),
                            ],
                            8,
                            ia,
                          ),
                          s(
                            'div',
                            {
                              class: 'col-6 col-md-3',
                              'data-field': `endTime_${t.activeSlotIndex}`,
                            },
                            [
                              u[15] ||
                                (u[15] = s(
                                  'div',
                                  { class: 'buu-label-muted q-mb-xs' },
                                  'เวลาสิ้นสุด',
                                  -1,
                                )),
                              r(
                                Ye,
                                {
                                  modelValue: K.value.endTime,
                                  'onUpdate:modelValue':
                                    u[9] || (u[9] = (d) => (K.value.endTime = d)),
                                  outlined: '',
                                  dense: '',
                                  class: U([
                                    'custom-input',
                                    { 'buu-field-error': k(`endTime_${t.activeSlotIndex}`) },
                                  ]),
                                  placeholder: '10:00',
                                  'hide-bottom-space': '',
                                  disable: t.locked,
                                  onSelect: u[10] || (u[10] = (d) => R('endTime')),
                                },
                                null,
                                8,
                                ['modelValue', 'class', 'disable'],
                              ),
                              k(`endTime_${t.activeSlotIndex}`)
                                ? (g(),
                                  A(
                                    'div',
                                    { key: `endTime-${t.shakeKey}`, class: 'buu-error-msg' },
                                    [
                                      r(C, { name: 'error', class: 'buu-error-icon' }),
                                      Q(' ' + q(t.fieldErrors[`endTime_${t.activeSlotIndex}`]), 1),
                                    ],
                                  ))
                                : $('', !0),
                            ],
                            8,
                            da,
                          ),
                        ]),
                        s('div', ua, [
                          s('div', ma, [
                            u[16] ||
                              (u[16] = s(
                                'div',
                                { class: 'rooms-title' },
                                'สถานที่สอบ ผู้คุมสอบ และจำนวนที่นั่ง',
                                -1,
                              )),
                            t.locked
                              ? $('', !0)
                              : (g(),
                                z(Ce, {
                                  key: 0,
                                  label: 'เพิ่มห้องสอบ',
                                  color: 'primary',
                                  unelevated: '',
                                  dense: '',
                                  class: 'q-px-md add-room-btn',
                                  onClick:
                                    u[11] ||
                                    (u[11] = (d) => T.$emit('add-room', t.activeSlotIndex)),
                                })),
                          ]),
                          u[17] ||
                            (u[17] = s(
                              'div',
                              { class: 'room-header row q-col-gutter-sm q-mb-xs' },
                              [
                                s('div', { class: 'col-12 col-md-6' }, [
                                  s('span', { class: 'buu-label-muted' }, 'สถานที่สอบ'),
                                ]),
                                s('div', { class: 'col-12 col-md-3' }, [
                                  s('span', { class: 'buu-label-muted' }, 'ผู้คุมสอบ'),
                                ]),
                                s('div', { class: 'col-12 col-md-3' }, [
                                  s('span', { class: 'buu-label-muted' }, 'จำนวนที่นั่ง'),
                                ]),
                              ],
                              -1,
                            )),
                          (g(!0),
                          A(
                            he,
                            null,
                            Pe(
                              K.value.rooms,
                              (d, E) => (
                                g(),
                                A(
                                  'div',
                                  { key: E, class: 'row items-start q-col-gutter-sm q-mb-sm' },
                                  [
                                    s(
                                      'div',
                                      {
                                        class: 'col-12 col-md-6',
                                        'data-field': `locationId_${t.activeSlotIndex}_${E}`,
                                      },
                                      [
                                        r(
                                          Ae,
                                          {
                                            modelValue: d.locationId,
                                            'onUpdate:modelValue': [
                                              (e) => (d.locationId = e),
                                              (e) => J(d, t.activeSlotIndex, E),
                                            ],
                                            options: p(E),
                                            'option-label': 'label',
                                            'option-value': 'value',
                                            'emit-value': '',
                                            'map-options': '',
                                            outlined: '',
                                            dense: '',
                                            placeholder: 'เลือกสถานที่สอบ',
                                            'dropdown-icon': 'keyboard_arrow_down',
                                            class: U([
                                              'custom-input',
                                              {
                                                'buu-field-error': k(
                                                  `locationId_${t.activeSlotIndex}_${E}`,
                                                ),
                                              },
                                            ]),
                                            disable: t.locked,
                                          },
                                          null,
                                          8,
                                          [
                                            'modelValue',
                                            'onUpdate:modelValue',
                                            'options',
                                            'class',
                                            'disable',
                                          ],
                                        ),
                                        k(`locationId_${t.activeSlotIndex}_${E}`)
                                          ? (g(),
                                            A(
                                              'div',
                                              {
                                                key: `loc-${E}-${t.shakeKey}`,
                                                class: 'buu-error-msg',
                                              },
                                              [
                                                r(C, { name: 'error', class: 'buu-error-icon' }),
                                                Q(
                                                  ' ' +
                                                    q(
                                                      t.fieldErrors[
                                                        `locationId_${t.activeSlotIndex}_${E}`
                                                      ],
                                                    ),
                                                  1,
                                                ),
                                              ],
                                            ))
                                          : $('', !0),
                                      ],
                                      8,
                                      ca,
                                    ),
                                    s('div', va, [
                                      r(
                                        Ae,
                                        {
                                          modelValue: d.proctors,
                                          'onUpdate:modelValue': (e) => (d.proctors = e),
                                          multiple: '',
                                          'use-chips': '',
                                          'use-input': '',
                                          'new-value-mode': 'add-unique',
                                          options: x.value,
                                          'option-label': 'label',
                                          'option-value': 'value',
                                          'emit-value': '',
                                          'map-options': '',
                                          outlined: '',
                                          dense: '',
                                          placeholder: '',
                                          'dropdown-icon': 'keyboard_arrow_down',
                                          class: U([
                                            'custom-input proctors-select',
                                            `proctors-select-${E}`,
                                          ]),
                                          'input-debounce': '0',
                                          onFilter: B,
                                          onPopupShow: (e) => V(E),
                                          onPopupHide: (e) => _(E),
                                          onInputValue: (e) => V(E),
                                          onFocus: (e) => V(E),
                                          onBlur: (e) => _(E),
                                        },
                                        {
                                          option: h((e) => [
                                            r(
                                              It,
                                              He({ ref_for: !0 }, e.itemProps),
                                              {
                                                default: h(() => [
                                                  r(
                                                    Ke,
                                                    null,
                                                    {
                                                      default: h(() => [
                                                        r(
                                                          $t,
                                                          null,
                                                          {
                                                            default: h(() => [
                                                              Q(
                                                                q(
                                                                  typeof e.opt == 'object' && e.opt
                                                                    ? e.opt.label
                                                                    : e.opt,
                                                                ),
                                                                1,
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
                                                  e.selected
                                                    ? (g(),
                                                      z(
                                                        Ke,
                                                        { key: 0, side: '' },
                                                        {
                                                          default: h(() => [
                                                            r(C, {
                                                              name: 'check',
                                                              color: 'primary',
                                                              size: '20px',
                                                            }),
                                                          ]),
                                                          _: 1,
                                                        },
                                                      ))
                                                    : $('', !0),
                                                ]),
                                                _: 2,
                                              },
                                              1040,
                                            ),
                                          ]),
                                          _: 1,
                                        },
                                        8,
                                        [
                                          'modelValue',
                                          'onUpdate:modelValue',
                                          'options',
                                          'class',
                                          'onPopupShow',
                                          'onPopupHide',
                                          'onInputValue',
                                          'onFocus',
                                          'onBlur',
                                        ],
                                      ),
                                    ]),
                                    s(
                                      'div',
                                      {
                                        class: 'col-12 col-md-3',
                                        'data-field': `seats_${t.activeSlotIndex}_${E}`,
                                      },
                                      [
                                        s('div', pa, [
                                          s('div', ga, [
                                            r(
                                              ue,
                                              {
                                                modelValue: d.seats,
                                                'onUpdate:modelValue': [
                                                  (e) => (d.seats = e),
                                                  (e) => {
                                                    (f(
                                                      'clearFieldError',
                                                      `seats_${t.activeSlotIndex}_${E}`,
                                                    ),
                                                      typeof e == 'number' &&
                                                        e < 1 &&
                                                        (d.seats = 1));
                                                  },
                                                ],
                                                modelModifiers: { number: !0 },
                                                type: 'number',
                                                outlined: '',
                                                dense: '',
                                                class: U([
                                                  'custom-input seats-input',
                                                  {
                                                    'buu-field-error':
                                                      k(`seats_${t.activeSlotIndex}_${E}`) ||
                                                      (d.locationId && d.seats > a(d.locationId)),
                                                  },
                                                ]),
                                                placeholder: d.locationId
                                                  ? String(a(d.locationId))
                                                  : ya,
                                                min: '1',
                                                max: a(d.locationId),
                                                disable: t.locked,
                                                onKeydown: m,
                                              },
                                              {
                                                default: h(() => [
                                                  d.locationId
                                                    ? (g(),
                                                      z(
                                                        Ge,
                                                        { key: 0, class: 'bg-grey-8 text-body2' },
                                                        {
                                                          default: h(() => [
                                                            Q(
                                                              ' จำนวนที่นั่งสูงสุดของสถานที่นี้คือ ' +
                                                                q(a(d.locationId)) +
                                                                ' ที่นั่ง ',
                                                              1,
                                                            ),
                                                          ]),
                                                          _: 2,
                                                        },
                                                        1024,
                                                      ))
                                                    : $('', !0),
                                                ]),
                                                _: 2,
                                              },
                                              1032,
                                              [
                                                'modelValue',
                                                'onUpdate:modelValue',
                                                'class',
                                                'placeholder',
                                                'max',
                                                'disable',
                                              ],
                                            ),
                                          ]),
                                          !t.locked && K.value.rooms.length > 1
                                            ? (g(),
                                              A('div', Sa, [
                                                r(
                                                  C,
                                                  {
                                                    name: 'delete',
                                                    class: 'cursor-pointer',
                                                    size: 'sm',
                                                    color: 'dark',
                                                    onClick: (e) =>
                                                      T.$emit('remove-room', t.activeSlotIndex, E),
                                                  },
                                                  null,
                                                  8,
                                                  ['onClick'],
                                                ),
                                              ]))
                                            : $('', !0),
                                        ]),
                                        d.locationId && d.seats > a(d.locationId)
                                          ? (g(),
                                            A('div', ba, [
                                              r(C, { name: 'error', class: 'buu-error-icon' }),
                                              Q(
                                                ' เกินขอบเขตความจุที่นั่งของห้องสอบ มีที่นั่งได้ไม่เกิน ' +
                                                  q(a(d.locationId)) +
                                                  ' ที่นั่ง ในสถานที่นี้ ',
                                                1,
                                              ),
                                            ]))
                                          : k(`seats_${t.activeSlotIndex}_${E}`)
                                            ? (g(),
                                              A(
                                                'div',
                                                {
                                                  key: `seats-${E}-${t.shakeKey}`,
                                                  class: 'buu-error-msg',
                                                },
                                                [
                                                  r(C, { name: 'error', class: 'buu-error-icon' }),
                                                  Q(
                                                    ' ' +
                                                      q(
                                                        t.fieldErrors[
                                                          `seats_${t.activeSlotIndex}_${E}`
                                                        ],
                                                      ),
                                                    1,
                                                  ),
                                                ],
                                              ))
                                            : $('', !0),
                                      ],
                                      8,
                                      fa,
                                    ),
                                  ],
                                )
                              ),
                            ),
                            128,
                          )),
                        ]),
                      ]))
                    : $('', !0),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  wa = be(Ta, [['__scopeId', 'data-v-9a6d17ce']]),
  Da = { class: 'row items-center q-mb-md' },
  ka = { class: 'text-subtitle1 text-weight-bold text-dark' },
  $a = { class: 'row q-col-gutter-xl' },
  Ia = { class: 'row q-col-gutter-md' },
  ha = { key: 1, class: 'text-caption text-negative q-mt-xs row items-center no-wrap' },
  Ca = { key: 1, class: 'text-caption text-negative q-mt-xs row items-center no-wrap' },
  Aa = { key: 0, class: 'col-12 col-md-6' },
  Na = { class: 'row q-col-gutter-md' },
  Va = { class: 'col-12 q-mb-md', 'data-field': 'payStartDate' },
  Oa = { key: 1, class: 'text-caption text-negative q-mt-xs row items-center no-wrap' },
  Ra = { class: 'col-12', 'data-field': 'payEndDate' },
  Pa = { key: 1, class: 'text-caption text-negative q-mt-xs row items-center no-wrap' },
  La = Se({
    __name: 'create-exam-registration-card',
    props: me(
      {
        locked: { type: Boolean },
        isSpecialRound: { type: Boolean },
        dateErrors: {},
        fieldErrors: {},
        shakeKey: {},
      },
      { form: { required: !0 }, formModifiers: {} },
    ),
    emits: me(['clearFieldError'], ['update:form']),
    setup(t, { emit: G }) {
      const L = t,
        c = G,
        f = Ne(t, 'form'),
        S = (m) => !!(L.fieldErrors && L.fieldErrors[m]),
        x = P(!1),
        B = P(!1),
        _ = P(!1),
        V = P(!1);
      return (m, a) => (
        g(),
        z(
          Ve,
          { flat: '', bordered: '', class: 'buu-premium-card q-mb-md' },
          {
            default: h(() => [
              r(Te, null, {
                default: h(() => [
                  s('div', Da, [
                    r(C, { name: 'schedule', size: '20px', class: 'q-mr-sm text-dark' }),
                    s(
                      'div',
                      ka,
                      q(t.isSpecialRound ? 'กำหนดการลงทะเบียน' : 'กำหนดการลงทะเบียนและชำระเงิน'),
                      1,
                    ),
                  ]),
                  s('div', $a, [
                    s(
                      'div',
                      { class: U(['col-12', t.isSpecialRound ? '' : 'col-md-6']) },
                      [
                        a[26] ||
                          (a[26] = s(
                            'div',
                            { class: 'sub-section-title q-mb-sm' },
                            'ช่วงเวลาลงทะเบียน',
                            -1,
                          )),
                        s('div', Ia, [
                          s(
                            'div',
                            {
                              class: U(['col-12', t.isSpecialRound ? 'col-md-6' : 'q-mb-md']),
                              'data-field': 'regStartDate',
                            },
                            [
                              a[24] ||
                                (a[24] = s(
                                  'div',
                                  { class: 'buu-label-muted q-mb-xs' },
                                  'วันที่เริ่มต้น',
                                  -1,
                                )),
                              r(
                                ue,
                                {
                                  modelValue: f.value.regStartDate,
                                  'onUpdate:modelValue':
                                    a[4] || (a[4] = (p) => (f.value.regStartDate = p)),
                                  outlined: '',
                                  dense: '',
                                  class: U([
                                    'custom-input cursor-pointer',
                                    { 'buu-field-error': S('regStartDate') },
                                  ]),
                                  readonly: '',
                                  'hide-bottom-space': '',
                                  disable: t.locked,
                                  onClick: a[5] || (a[5] = (p) => !t.locked && (x.value = !0)),
                                },
                                {
                                  append: h(() => [
                                    t.locked
                                      ? $('', !0)
                                      : (g(),
                                        z(C, {
                                          key: 0,
                                          name: 'calendar_today',
                                          class: 'cursor-pointer',
                                          size: 'xs',
                                          color: 'grey-8',
                                          onClick:
                                            a[0] || (a[0] = ge((p) => (x.value = !0), ['stop'])),
                                        })),
                                    r(
                                      xe,
                                      {
                                        modelValue: x.value,
                                        'onUpdate:modelValue':
                                          a[3] || (a[3] = (p) => (x.value = p)),
                                        anchor: 'bottom left',
                                        self: 'top left',
                                        class: 'shadow-5 calendar-menu',
                                      },
                                      {
                                        default: h(() => [
                                          r(
                                            ke,
                                            {
                                              'model-value': b(Ie)(f.value.regStartDate),
                                              'onUpdate:modelValue':
                                                a[1] ||
                                                (a[1] = (p) => {
                                                  ((f.value.regStartDate = b($e)(p)),
                                                    c('clearFieldError', 'regStartDate'));
                                                }),
                                              onClickDate: a[2] || (a[2] = (p) => (x.value = !1)),
                                            },
                                            null,
                                            8,
                                            ['model-value'],
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
                                ['modelValue', 'class', 'disable'],
                              ),
                              S('regStartDate')
                                ? (g(),
                                  A(
                                    'div',
                                    { key: `regStartDate-${t.shakeKey}`, class: 'buu-error-msg' },
                                    [
                                      r(C, { name: 'error', class: 'buu-error-icon' }),
                                      Q(' ' + q(t.fieldErrors.regStartDate), 1),
                                    ],
                                  ))
                                : $('', !0),
                              t.dateErrors?.regStartDate
                                ? (g(),
                                  A('div', ha, [
                                    r(C, {
                                      name: 'error',
                                      size: '14px',
                                      class: 'q-mr-xs animate-bounce',
                                    }),
                                    Q(' ' + q(t.dateErrors.regStartDate), 1),
                                  ]))
                                : $('', !0),
                            ],
                            2,
                          ),
                          s(
                            'div',
                            {
                              class: U(['col-12', t.isSpecialRound ? 'col-md-6' : '']),
                              'data-field': 'regEndDate',
                            },
                            [
                              a[25] ||
                                (a[25] = s(
                                  'div',
                                  { class: 'buu-label-muted q-mb-xs' },
                                  'วันที่สิ้นสุด',
                                  -1,
                                )),
                              r(
                                ue,
                                {
                                  modelValue: f.value.regEndDate,
                                  'onUpdate:modelValue':
                                    a[10] || (a[10] = (p) => (f.value.regEndDate = p)),
                                  outlined: '',
                                  dense: '',
                                  class: U([
                                    'custom-input cursor-pointer',
                                    { 'buu-field-error': S('regEndDate') },
                                  ]),
                                  readonly: '',
                                  'hide-bottom-space': '',
                                  disable: t.locked,
                                  onClick: a[11] || (a[11] = (p) => !t.locked && (B.value = !0)),
                                },
                                {
                                  append: h(() => [
                                    t.locked
                                      ? $('', !0)
                                      : (g(),
                                        z(C, {
                                          key: 0,
                                          name: 'calendar_today',
                                          class: 'cursor-pointer',
                                          size: 'xs',
                                          color: 'grey-8',
                                          onClick:
                                            a[6] || (a[6] = ge((p) => (B.value = !0), ['stop'])),
                                        })),
                                    r(
                                      xe,
                                      {
                                        modelValue: B.value,
                                        'onUpdate:modelValue':
                                          a[9] || (a[9] = (p) => (B.value = p)),
                                        anchor: 'bottom left',
                                        self: 'top left',
                                        class: 'shadow-5 calendar-menu',
                                      },
                                      {
                                        default: h(() => [
                                          r(
                                            ke,
                                            {
                                              'model-value': b(Ie)(f.value.regEndDate),
                                              'onUpdate:modelValue':
                                                a[7] ||
                                                (a[7] = (p) => {
                                                  ((f.value.regEndDate = b($e)(p)),
                                                    c('clearFieldError', 'regEndDate'));
                                                }),
                                              onClickDate: a[8] || (a[8] = (p) => (B.value = !1)),
                                            },
                                            null,
                                            8,
                                            ['model-value'],
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
                                ['modelValue', 'class', 'disable'],
                              ),
                              S('regEndDate')
                                ? (g(),
                                  A(
                                    'div',
                                    { key: `regEndDate-${t.shakeKey}`, class: 'buu-error-msg' },
                                    [
                                      r(C, { name: 'error', class: 'buu-error-icon' }),
                                      Q(' ' + q(t.fieldErrors.regEndDate), 1),
                                    ],
                                  ))
                                : $('', !0),
                              t.dateErrors?.regEndDate
                                ? (g(),
                                  A('div', Ca, [
                                    r(C, { name: 'error', size: '14px', class: 'q-mr-xs' }),
                                    Q(' ' + q(t.dateErrors.regEndDate), 1),
                                  ]))
                                : $('', !0),
                            ],
                            2,
                          ),
                        ]),
                      ],
                      2,
                    ),
                    t.isSpecialRound
                      ? $('', !0)
                      : (g(),
                        A('div', Aa, [
                          a[29] ||
                            (a[29] = s(
                              'div',
                              { class: 'sub-section-title q-mb-sm' },
                              'ช่วงเวลาชำระเงิน',
                              -1,
                            )),
                          s('div', Na, [
                            s('div', Va, [
                              a[27] ||
                                (a[27] = s(
                                  'div',
                                  { class: 'buu-label-muted q-mb-xs' },
                                  'วันที่เริ่มต้น',
                                  -1,
                                )),
                              r(
                                ue,
                                {
                                  modelValue: f.value.payStartDate,
                                  'onUpdate:modelValue':
                                    a[16] || (a[16] = (p) => (f.value.payStartDate = p)),
                                  outlined: '',
                                  dense: '',
                                  class: U([
                                    'custom-input cursor-pointer',
                                    { 'buu-field-error': S('payStartDate') },
                                  ]),
                                  readonly: '',
                                  'hide-bottom-space': '',
                                  disable: t.locked,
                                  onClick: a[17] || (a[17] = (p) => !t.locked && (_.value = !0)),
                                },
                                {
                                  append: h(() => [
                                    t.locked
                                      ? $('', !0)
                                      : (g(),
                                        z(C, {
                                          key: 0,
                                          name: 'calendar_today',
                                          class: 'cursor-pointer',
                                          size: 'xs',
                                          color: 'grey-8',
                                          onClick:
                                            a[12] || (a[12] = ge((p) => (_.value = !0), ['stop'])),
                                        })),
                                    r(
                                      xe,
                                      {
                                        modelValue: _.value,
                                        'onUpdate:modelValue':
                                          a[15] || (a[15] = (p) => (_.value = p)),
                                        anchor: 'bottom left',
                                        self: 'top left',
                                        class: 'shadow-5 calendar-menu',
                                      },
                                      {
                                        default: h(() => [
                                          r(
                                            ke,
                                            {
                                              'model-value': b(Ie)(f.value.payStartDate),
                                              'onUpdate:modelValue':
                                                a[13] ||
                                                (a[13] = (p) => {
                                                  ((f.value.payStartDate = b($e)(p)),
                                                    c('clearFieldError', 'payStartDate'));
                                                }),
                                              onClickDate: a[14] || (a[14] = (p) => (_.value = !1)),
                                            },
                                            null,
                                            8,
                                            ['model-value'],
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
                                ['modelValue', 'class', 'disable'],
                              ),
                              S('payStartDate')
                                ? (g(),
                                  A(
                                    'div',
                                    { key: `payStartDate-${t.shakeKey}`, class: 'buu-error-msg' },
                                    [
                                      r(C, { name: 'error', class: 'buu-error-icon' }),
                                      Q(' ' + q(t.fieldErrors.payStartDate), 1),
                                    ],
                                  ))
                                : $('', !0),
                              t.dateErrors?.payStartDate
                                ? (g(),
                                  A('div', Oa, [
                                    r(C, { name: 'error', size: '14px', class: 'q-mr-xs' }),
                                    Q(' ' + q(t.dateErrors.payStartDate), 1),
                                  ]))
                                : $('', !0),
                            ]),
                            s('div', Ra, [
                              a[28] ||
                                (a[28] = s(
                                  'div',
                                  { class: 'buu-label-muted q-mb-xs' },
                                  'วันที่สิ้นสุด',
                                  -1,
                                )),
                              r(
                                ue,
                                {
                                  modelValue: f.value.payEndDate,
                                  'onUpdate:modelValue':
                                    a[22] || (a[22] = (p) => (f.value.payEndDate = p)),
                                  outlined: '',
                                  dense: '',
                                  class: U([
                                    'custom-input cursor-pointer',
                                    { 'buu-field-error': S('payEndDate') },
                                  ]),
                                  readonly: '',
                                  'hide-bottom-space': '',
                                  disable: t.locked,
                                  onClick: a[23] || (a[23] = (p) => !t.locked && (V.value = !0)),
                                },
                                {
                                  append: h(() => [
                                    t.locked
                                      ? $('', !0)
                                      : (g(),
                                        z(C, {
                                          key: 0,
                                          name: 'calendar_today',
                                          class: 'cursor-pointer',
                                          size: 'xs',
                                          color: 'grey-8',
                                          onClick:
                                            a[18] || (a[18] = ge((p) => (V.value = !0), ['stop'])),
                                        })),
                                    r(
                                      xe,
                                      {
                                        modelValue: V.value,
                                        'onUpdate:modelValue':
                                          a[21] || (a[21] = (p) => (V.value = p)),
                                        anchor: 'bottom left',
                                        self: 'top left',
                                        class: 'shadow-5 calendar-menu',
                                      },
                                      {
                                        default: h(() => [
                                          r(
                                            ke,
                                            {
                                              'model-value': b(Ie)(f.value.payEndDate),
                                              'onUpdate:modelValue':
                                                a[19] ||
                                                (a[19] = (p) => {
                                                  ((f.value.payEndDate = b($e)(p)),
                                                    c('clearFieldError', 'payEndDate'));
                                                }),
                                              onClickDate: a[20] || (a[20] = (p) => (V.value = !1)),
                                            },
                                            null,
                                            8,
                                            ['model-value'],
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
                                ['modelValue', 'class', 'disable'],
                              ),
                              S('payEndDate')
                                ? (g(),
                                  A(
                                    'div',
                                    { key: `payEndDate-${t.shakeKey}`, class: 'buu-error-msg' },
                                    [
                                      r(C, { name: 'error', class: 'buu-error-icon' }),
                                      Q(' ' + q(t.fieldErrors.payEndDate), 1),
                                    ],
                                  ))
                                : $('', !0),
                              t.dateErrors?.payEndDate
                                ? (g(),
                                  A('div', Pa, [
                                    r(C, { name: 'error', size: '14px', class: 'q-mr-xs' }),
                                    Q(' ' + q(t.dateErrors.payEndDate), 1),
                                  ]))
                                : $('', !0),
                            ]),
                          ]),
                        ])),
                  ]),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  qa = be(La, [['__scopeId', 'data-v-7a4b764f']]),
  Fa = { class: 'col-6' },
  Ma = { class: 'col-6' },
  Ua = Se({
    __name: 'dialog-passcode-type',
    props: { modelValue: { type: Boolean } },
    emits: ['update:modelValue', 'select'],
    setup(t, { emit: G }) {
      const L = G,
        c = P(null),
        f = (S) => {
          ((c.value = S), L('select', S), L('update:modelValue', !1));
        };
      return (S, x) => (
        g(),
        z(
          vt,
          {
            'model-value': t.modelValue,
            persistent: '',
            'onUpdate:modelValue': x[2] || (x[2] = (B) => S.$emit('update:modelValue', B)),
            'transition-show': 'scale',
            'transition-hide': 'scale',
          },
          {
            default: h(() => [
              r(
                Ve,
                { class: 'dialog-passcode-type-card' },
                {
                  default: h(() => [
                    r(
                      Te,
                      { class: 'q-pb-none' },
                      {
                        default: h(() => [
                          ...(x[3] ||
                            (x[3] = [
                              s(
                                'div',
                                { class: 'text-h6 text-weight-bold dialog-title' },
                                'เลือกรูปแบบของ PASSCODE',
                                -1,
                              ),
                            ])),
                        ]),
                        _: 1,
                      },
                    ),
                    r(
                      Te,
                      { class: 'row q-col-gutter-md q-pt-lg q-pb-xl' },
                      {
                        default: h(() => [
                          s('div', Fa, [
                            s(
                              'div',
                              {
                                class: U([
                                  'option-card column items-center q-pa-lg',
                                  { 'option-card--selected': c.value === 'single' },
                                ]),
                                onClick: x[0] || (x[0] = (B) => f('single')),
                              },
                              [
                                r(C, {
                                  name: 'groups',
                                  size: '48px',
                                  class: 'option-icon q-mb-md',
                                }),
                                x[4] ||
                                  (x[4] = s(
                                    'div',
                                    { class: 'option-title text-center' },
                                    'Passcode ชุดเดียวสำหรับผู้สอบทุกคน',
                                    -1,
                                  )),
                                x[5] ||
                                  (x[5] = s(
                                    'div',
                                    { class: 'option-subtitle text-center q-mt-xs' },
                                    'One Passcode for all candidates',
                                    -1,
                                  )),
                              ],
                              2,
                            ),
                          ]),
                          s('div', Ma, [
                            s(
                              'div',
                              {
                                class: U([
                                  'option-card column items-center q-pa-lg',
                                  { 'option-card--selected': c.value === 'individual' },
                                ]),
                                onClick: x[1] || (x[1] = (B) => f('individual')),
                              },
                              [
                                r(C, {
                                  name: 'person',
                                  size: '48px',
                                  class: 'option-icon q-mb-md',
                                }),
                                x[6] ||
                                  (x[6] = s(
                                    'div',
                                    { class: 'option-title text-center' },
                                    'Passcode เฉพาะตัวสำหรับผู้สอบแต่ละคน',
                                    -1,
                                  )),
                                x[7] ||
                                  (x[7] = s(
                                    'div',
                                    { class: 'option-subtitle text-center q-mt-xs' },
                                    'Individual Passcode per candidate',
                                    -1,
                                  )),
                              ],
                              2,
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
  Ba = be(Ua, [['__scopeId', 'data-v-4ab4d6f1']]),
  _a = { class: 'row items-center q-mb-md' },
  Qa = { class: 'row items-center q-mb-md q-col-gutter-sm' },
  Xa = { class: 'col-12 col-md-5' },
  za = { class: 'col-auto' },
  Ka = { class: 'col-12 col-md-auto row q-gutter-sm justify-end' },
  Ya = { class: 'text-center' },
  ja = { class: 'text-left q-pl-custom' },
  Ha = Se({
    __name: 'create-exam-candidates-card',
    props: me(
      { filteredCandidates: {}, locked: { type: Boolean } },
      { searchQuery: { required: !0 }, searchQueryModifiers: {} },
    ),
    emits: me(
      ['import-candidates', 'passcode-type-selected', 'url-submitted', 'export-candidates'],
      ['update:searchQuery'],
    ),
    setup(t, { emit: G }) {
      const L = t,
        c = Ne(t, 'searchQuery'),
        f = G,
        S = P({ page: 1, rowsPerPage: 10, rowsNumber: L.filteredCandidates.length });
      We(
        () => L.filteredCandidates,
        (k) => {
          S.value.rowsNumber = k.length;
          const R = Math.ceil(k.length / S.value.rowsPerPage) || 1;
          S.value.page > R && (S.value.page = 1);
        },
        { deep: !0 },
      );
      const x = (k) => {
          const R = S.value.page ?? 1,
            F = S.value.rowsPerPage ?? 10,
            T = L.filteredCandidates.indexOf(k);
          return (R - 1) * F + T + 1;
        },
        B = (k) => {
          k.pagination &&
            ((S.value.page = k.pagination.page), (S.value.rowsPerPage = k.pagination.rowsPerPage));
        },
        _ = P(!1),
        V = P(!1),
        m = (k) => {
          f('import-candidates', k);
        },
        a = (k) => {
          f('url-submitted', k);
        },
        p = () => {
          const T =
            '\uFEFF' +
            [
              '"รหัสประชาชน","ชื่อ-นามสกุล"',
              ...[
                '"1100000000000","สมชาย ใจดี"',
                '"1100000000001","สมหญิง ใจงาม"',
                '"1100000000002","สมศักดิ์ ใจเย็น"',
              ],
            ].join(`\r
`);
          Ct('ตัวอย่างไฟล์รายชื่อ.csv', T, 'text/csv;charset=utf-8') !== !0 &&
            console.error('Browser blocked the file download');
        },
        J = (k) => {
          f('passcode-type-selected', k);
        },
        K = [
          { name: 'index', label: 'ลำดับ', field: 'index', align: 'center', style: 'width: 80px' },
          { name: 'nationalId', label: 'รหัสประชาชน', field: 'nationalId', align: 'center' },
          {
            name: 'fullName',
            label: 'ชื่อ-นามสกุล',
            field: 'fullName',
            align: 'left',
            style: 'width: 30%',
          },
          { name: 'passcode', label: 'Passcode', field: 'passcode', align: 'center' },
        ];
      return (k, R) => (
        g(),
        z(
          Ve,
          { flat: '', bordered: '', class: 'buu-premium-card q-mb-md' },
          {
            default: h(() => [
              r(Te, null, {
                default: h(() => [
                  s('div', _a, [
                    r(C, { name: 'person_add', size: '20px', class: 'q-mr-sm text-dark' }),
                    R[6] ||
                      (R[6] = s(
                        'div',
                        { class: 'text-subtitle1 text-weight-bold text-dark' },
                        'รายชื่อผู้มีสิทธิ์สอบ',
                        -1,
                      )),
                  ]),
                  s('div', Qa, [
                    s('div', Xa, [
                      r(
                        ue,
                        {
                          modelValue: c.value,
                          'onUpdate:modelValue': R[0] || (R[0] = (F) => (c.value = F)),
                          outlined: '',
                          dense: '',
                          placeholder: 'ค้นหา',
                          'bg-color': 'white',
                          class: 'search-input',
                          'hide-bottom-space': '',
                        },
                        { append: h(() => [r(C, { name: 'search', color: 'grey-6' })]), _: 1 },
                        8,
                        ['modelValue'],
                      ),
                    ]),
                    r(ht),
                    s('div', za, [
                      t.locked
                        ? $('', !0)
                        : (g(),
                          z(Ce, {
                            key: 0,
                            label: 'สร้าง Passcode',
                            unelevated: '',
                            dense: '',
                            icon: 'vpn_key',
                            class: 'q-px-md action-btn passcode-btn',
                            onClick: R[1] || (R[1] = (F) => (V.value = !0)),
                          })),
                      t.locked
                        ? (g(),
                          z(Ce, {
                            key: 1,
                            label: 'ส่งออก (Export)',
                            color: 'secondary',
                            unelevated: '',
                            dense: '',
                            icon: 'download',
                            class: 'q-px-md action-btn',
                            onClick: R[2] || (R[2] = (F) => k.$emit('export-candidates')),
                          }))
                        : $('', !0),
                    ]),
                    s('div', Ka, [
                      t.locked
                        ? $('', !0)
                        : (g(),
                          z(Ce, {
                            key: 0,
                            label: 'นำเข้าไฟล์รายชื่อ',
                            color: 'primary',
                            unelevated: '',
                            dense: '',
                            icon: 'upload',
                            class: 'q-px-md action-btn',
                            onClick: R[3] || (R[3] = (F) => (_.value = !0)),
                          })),
                    ]),
                  ]),
                  r(
                    At,
                    {
                      columns: K,
                      rows: t.filteredCandidates,
                      pagination: S.value,
                      'empty-label': 'No data available in table',
                      class: 'candidates-table',
                      onRequest: B,
                    },
                    {
                      'body-cell-index': h(({ row: F }) => [s('div', Ya, q(x(F)), 1)]),
                      'body-cell-fullName': h(({ row: F }) => [s('div', ja, q(F.fullName), 1)]),
                      _: 1,
                    },
                    8,
                    ['rows', 'pagination'],
                  ),
                ]),
                _: 1,
              }),
              r(
                Nt,
                {
                  modelValue: _.value,
                  'onUpdate:modelValue': R[4] || (R[4] = (F) => (_.value = F)),
                  onFileSelected: m,
                  onUrlSubmitted: a,
                  onDownloadSample: p,
                },
                null,
                8,
                ['modelValue'],
              ),
              r(
                Ba,
                {
                  modelValue: V.value,
                  'onUpdate:modelValue': R[5] || (R[5] = (F) => (V.value = F)),
                  onSelect: J,
                },
                null,
                8,
                ['modelValue'],
              ),
            ]),
            _: 1,
          },
        )
      );
    },
  }),
  Wa = be(Ha, [['__scopeId', 'data-v-bd54b4a1']]),
  Ga = { class: 'exam-form-wrapper full-width' },
  Ja = { key: 1 },
  Za = { class: 'row justify-end q-mt-md q-gutter-sm action-container' },
  eo = Se({
    __name: 'exam-form',
    props: me({ examId: {} }, { form: { required: !0 }, formModifiers: {} }),
    emits: me(['save', 'cancel'], ['update:form']),
    setup(t, { emit: G }) {
      const L = t,
        c = Ne(t, 'form'),
        {
          examTypeOptions: f,
          examFormatOptions: S,
          proctorOptions: x,
          locationOptions: B,
          fundSourceOptions: _,
          isLoadingData: V,
          isEditMode: m,
          isPublishedSectionLocked: a,
          isScheduleLocked: p,
          isLockedByEnrollment: J,
          isSpecialRound: K,
          wasOriginallyPublished: k,
          activeSlotIndex: R,
          candidateSearch: F,
          filteredCandidates: T,
          fieldErrors: u,
          shakeKey: d,
          loadInitialData: E,
          addTimeSlot: e,
          removeTimeSlot: le,
          addRoom: we,
          removeRoom: H,
          importCandidates: ce,
          generatePasscodes: ye,
          exportCandidates: ie,
          handleCancel: ve,
          handleSave: se,
          sortTimeSlots: Ee,
          dateErrors: pe,
          clearFieldError: w,
        } = Vt(c, { examId: L.examId }),
        v = G,
        I = async () => {
          (await se()) && v('save');
        },
        ee = () => {
          (ve(), v('cancel'));
        };
      return (
        ft(E),
        (Z, X) => (
          g(),
          A('div', Ga, [
            r(
              Yt,
              {
                form: c.value,
                'onUpdate:form': X[0] || (X[0] = (de) => (c.value = de)),
                'exam-type-options': b(f),
                'exam-format-options': b(S),
                'fund-source-options': b(_),
                'is-loading-data': b(V),
                'is-locked': b(a),
                'is-special-round': b(K),
                'field-errors': b(u),
                'shake-key': b(d),
                onClearFieldError: b(w),
              },
              null,
              8,
              [
                'form',
                'exam-type-options',
                'exam-format-options',
                'fund-source-options',
                'is-loading-data',
                'is-locked',
                'is-special-round',
                'field-errors',
                'shake-key',
                'onClearFieldError',
              ],
            ),
            r(
              wa,
              {
                form: c.value,
                'onUpdate:form': X[1] || (X[1] = (de) => (c.value = de)),
                locked: b(p),
                'location-options': b(B),
                'proctor-options': b(x),
                'active-slot-index': b(R),
                'date-errors': b(pe),
                'field-errors': b(u),
                'shake-key': b(d),
                onAddTimeSlot: b(e),
                onRemoveTimeSlot: b(le),
                onAddRoom: b(we),
                onRemoveRoom: b(H),
                'onUpdate:activeSlotIndex': X[2] || (X[2] = (de) => (R.value = de)),
                onSortTimeSlots: b(Ee),
                onClearFieldError: b(w),
              },
              null,
              8,
              [
                'form',
                'locked',
                'location-options',
                'proctor-options',
                'active-slot-index',
                'date-errors',
                'field-errors',
                'shake-key',
                'onAddTimeSlot',
                'onRemoveTimeSlot',
                'onAddRoom',
                'onRemoveRoom',
                'onSortTimeSlots',
                'onClearFieldError',
              ],
            ),
            r(
              qa,
              {
                form: c.value,
                'onUpdate:form': X[3] || (X[3] = (de) => (c.value = de)),
                locked: b(a) || b(J),
                'is-special-round': b(K),
                'date-errors': b(pe),
                'field-errors': b(u),
                'shake-key': b(d),
                onClearFieldError: b(w),
              },
              null,
              8,
              [
                'form',
                'locked',
                'is-special-round',
                'date-errors',
                'field-errors',
                'shake-key',
                'onClearFieldError',
              ],
            ),
            b(K)
              ? (g(),
                z(
                  Wa,
                  {
                    key: 0,
                    'search-query': b(F),
                    'onUpdate:searchQuery':
                      X[4] || (X[4] = (de) => (pt(F) ? (F.value = de) : null)),
                    'filtered-candidates': b(T),
                    locked: b(a) || b(J),
                    onImportCandidates: b(ce),
                    onPasscodeTypeSelected: b(ye),
                    onExportCandidates: b(ie),
                  },
                  null,
                  8,
                  [
                    'search-query',
                    'filtered-candidates',
                    'locked',
                    'onImportCandidates',
                    'onPasscodeTypeSelected',
                    'onExportCandidates',
                  ],
                ))
              : $('', !0),
            b(a)
              ? (g(),
                A('div', Ja, [
                  b(a)
                    ? (g(),
                      z(
                        gt,
                        {
                          key: 0,
                          dense: '',
                          class: 'alert-banner-warning q-mb-md rounded-borders',
                        },
                        {
                          avatar: h(() => [r(C, { name: 'info', class: 'alert-icon-warning' })]),
                          default: h(() => [
                            X[5] ||
                              (X[5] = Q(
                                ' รอบสอบนี้เคยผ่านการเผยแพร่แล้ว ระบบจึงจำกัดการแก้ไขข้อมูล (อนุญาตให้แก้ไขเฉพาะข้อมูลผู้คุมสอบได้เท่านั้น) ',
                                -1,
                              )),
                          ]),
                          _: 1,
                        },
                      ))
                    : $('', !0),
                ]))
              : $('', !0),
            s('div', Za, [
              r(
                ze,
                {
                  label: b(k) ? 'กลับสู่หน้าจัดการ' : 'ยกเลิก',
                  onClick: ee,
                  class: 'action-btn cancel-btn text-weight-bold',
                },
                null,
                8,
                ['label'],
              ),
              r(
                ze,
                {
                  label: b(m) ? 'บันทึกการแก้ไข' : 'บันทึก',
                  onClick: I,
                  class: 'action-btn save-btn text-white text-weight-bold',
                },
                null,
                8,
                ['label'],
              ),
            ]),
          ])
        )
      );
    },
  }),
  xo = be(eo, [['__scopeId', 'data-v-4a952517']]);
export { xo as E, Vt as u };
