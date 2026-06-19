import { u as $, r as u, f } from './index-CKSooU2k.js';
const D = u([]),
  L = u(null);
function b() {
  const n = $(),
    t = D,
    s = L,
    o = u(!1),
    l = u(null),
    i = u(''),
    p = u('สำนักคอมพิวเตอร์ (82994)'),
    m = f(() => {
      const e = n.currentUser;
      return (e && (e.fullNameTH || e.fullNameEN || e.email)) || 'ไม่ระบุชื่อ';
    }),
    v = f(() => {
      const e = i.value.toLowerCase().trim();
      return e
        ? t.value.filter(
            (a) =>
              a.applicantId.toLowerCase().includes(e) ||
              a.referenceNo.toLowerCase().includes(e) ||
              a.payerName.toLowerCase().includes(e) ||
              a.amount.toLowerCase().includes(e),
          )
        : t.value;
    }),
    g = f(() => t.value.length);
  return {
    importedRows: t,
    filteredRows: v,
    isLoading: o,
    error: l,
    searchQuery: i,
    selectedFile: s,
    departmentLabel: p,
    totalCount: g,
    parseFile: async (e) => {
      ((o.value = !0), (l.value = null), (s.value = e));
      try {
        const y = (await e.text())
            .split(
              `
`,
            )
            .map((r) => r.trim())
            .filter((r) => r.length > 0)
            .slice(1),
          w = x(new Date()),
          d = y.map((r, h) => {
            const c = r.split(',').map((N) => N.trim().replace(/^"|"$/g, ''));
            return {
              index: h + 1,
              applicantId: c[0] || '-',
              referenceNo: c[1] || '-',
              payerName: c[2] || '-',
              paymentDate: c[3] || '-',
              paymentTime: c[4] || '-',
              amount: c[5] || '0.00',
              importedAt: w,
              importedBy: m.value,
            };
          });
        for (const r of d) {
          if (r.applicantId.length > 20)
            throw new Error(
              `Ref 1 (รหัสผู้สมัคร) "${r.applicantId}" ในแถวที่ ${r.index} มีความยาวเกิน 20 ตัวอักษร (สูงสุด 20 ตัวอักษร)`,
            );
          if (r.referenceNo.length > 20)
            throw new Error(
              `Ref 2 (เลขที่อ้างอิง) "${r.referenceNo}" ในแถวที่ ${r.index} มีความยาวเกิน 20 ตัวอักษร (สูงสุด 20 ตัวอักษร)`,
            );
        }
        t.value = d;
      } catch (a) {
        (console.error('Failed to parse payment file:', a),
          (l.value =
            a instanceof Error ? a.message : 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์'),
          (t.value = []),
          (s.value = null));
      } finally {
        o.value = !1;
      }
    },
    clearAllData: () => {
      ((t.value = []), (s.value = null), (l.value = null));
    },
    verifyData: () => {
      o.value = !0;
      try {
        console.log('Verifying data:', t.value.length, 'records');
      } catch (e) {
        (console.error('Verification failed:', e), (l.value = 'การตรวจสอบข้อมูลล้มเหลว'));
      } finally {
        o.value = !1;
      }
    },
  };
}
function x(n) {
  const t = (m) => String(m).padStart(2, '0'),
    s = t(n.getDate()),
    o = t(n.getMonth() + 1),
    l = n.getFullYear() + 543,
    i = t(n.getHours()),
    p = t(n.getMinutes());
  return `${s}/${o}/${l} ${i}:${p}`;
}
export { D as g, b as u };
