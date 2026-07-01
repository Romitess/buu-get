/* eslint-disable */
/**
 * seed-mock.cjs — Mock data seeder ที่ "เลียนแบบ business logic ของ frontend"
 *
 * ทำงาน 3 ขั้น (ลำดับ + payload เดียวกับ service ฝั่ง frontend):
 *   1) สร้าง candidate users test101..test200  → POST /auth/register
 *      (เทียบ authStore.register / RegisterPayload)
 *   2) ลงทะเบียนสอบ "รอบทั่วไป" ที่ published + วันสอบ >= วันนี้ ให้เต็มทุกรอบ
 *      → POST /exam-enrollments   (เทียบ exam.service.createEnrollment)
 *   3) จ่ายเงิน + บันทึก (จบ 1 enrollment)
 *      → POST /transactions/pending-payment (เทียบ transaction.service.createPendingPayment)
 *
 * ค่าทุกฟิลด์ valid ตาม "ตัวเลือก/กฎที่ frontend มีให้" (backend ไม่ได้ validate เอง):
 *   - คำนำหน้า: TITLE_TH_OPTIONS  (frontend/src/utils/form-options.ts)
 *   - titleEN: titleMap           (frontend/src/assets/data/countries.json)
 *   - ระดับการศึกษา: 4 ตัวเลือก    (education-section.vue)
 *   - เลขบัตร 13 หลักตัวเลข, เบอร์ 10 หลัก, วันเกิด < วันนี้ (register form rules)
 *   - หมายเหตุ: option จาก convenience-step.vue
 *
 * ⚠️ BUG NOTE (หมายเหตุ / ERM_PHYSICAL_STATUS):
 *   dialog ใน UI (convenience-step.vue) ส่งค่าเป็น "string ตัวเลข" '0'..'5'
 *   แต่ transformer ของ entity ฝั่ง backend
 *   (exam-enrollment.entity.ts → ERM_PHYSICAL_STATUS.transformer.to)
 *   map เฉพาะ "ข้อความไทย" (UserPhysicalStatus enum) เท่านั้น
 *   → ค่าตัวเลขจาก UI ทุกค่าจะ fallback เป็น 5 (ทั่วไป) เสมอ = หมายเหตุหายหมด
 *   script นี้จึงส่งเป็น "ข้อความไทย" เพื่อให้บันทึกถูกต้องตามเจตนา (60% ทั่วไป / 40% มีหมายเหตุ)
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const PASSWORD = 'password123';
const numEnv = (k, d) => (process.env[k] != null ? Number(process.env[k]) : d);
const NEW_USER_FROM = numEnv('NEW_USER_FROM', 101); // test101..test200 (test001..100 มีอยู่แล้ว)
const NEW_USER_TO = numEnv('NEW_USER_TO', 200);
const POOL_FROM = numEnv('POOL_FROM', 1); // pool ที่ใช้ลงทะเบียน = test001..test200
const POOL_TO = numEnv('POOL_TO', 200);
const MAX_USERS_PER_SESSION = numEnv('MAX_USERS_PER_SESSION', 200); // ความจุเกิน 200 ก็เติมแค่ 200 พอ
const ENROLL_ONLY_SESSION = process.env.ENROLL_ONLY_SESSION ? Number(process.env.ENROLL_ONLY_SESSION) : null;
const SPECIAL_EXAM_TYPE = 'รอบพิเศษ'; // ข้าม (ต้องมี passcode ผูกเลขบัตร)
const REMARK_PROBABILITY = 0.4; // 40% มีหมายเหตุ, 60% ทั่วไป

// ── ตัวเลือกที่ frontend อนุญาต ──────────────────────────────────────────────
const TITLE_TH_OPTIONS = [
  { value: 'นาย', en: 'Mr.' },
  { value: 'นาง', en: 'Mrs.' },
  { value: 'นางสาว', en: 'Miss' },
  { value: 'ด็อกเตอร์', en: 'Dr.' },
  { value: 'ศาสตราจารย์', en: 'Prof.' },
  { value: 'รองศาสตราจารย์', en: 'Assoc. Prof.' },
  { value: 'ผู้ช่วยศาสตราจารย์', en: 'Asst. Prof.' },
];
const EDUCATION_OPTIONS = ['มัธยมศึกษา', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'];
// หมายเหตุ — ตรงกับ convenience-step.vue (monk/clergy/disabled/pregnant); ส่งเป็นข้อความไทยตาม UserPhysicalStatus
const REMARK_OPTIONS = [
  'พระภิกษุ / สามเณร',
  'นักบวช / ศาสนบุคคล',
  'บุคคลทุพพลภาพ',
  'ผู้ตั้งครรภ์',
];
const GENERAL_REMARK = 'ทั่วไป';

// ── name pools (ให้ englishName สมเหตุผล) ────────────────────────────────────
const FIRST = [
  ['ธนากร', 'Thanakorn'], ['ศุภชัย', 'Supachai'], ['ณัฐวุฒิ', 'Nattawut'],
  ['ปรีชา', 'Preecha'], ['อนุชา', 'Anucha'], ['วีรภัทร', 'Weeraphat'],
  ['กิตติพงษ์', 'Kittipong'], ['สมหมาย', 'Sommai'], ['ชัยวัฒน์', 'Chaiwat'],
  ['พิชญา', 'Pichaya'], ['สุดารัตน์', 'Sudarat'], ['กาญจนา', 'Kanchana'],
  ['วรรณภา', 'Wannapha'], ['ปนัดดา', 'Panadda'], ['อรอุมา', 'Onuma'],
  ['ศิริพร', 'Siriporn'], ['นภัสสร', 'Napatsorn'], ['ธิดารัตน์', 'Thidarat'],
  ['จิราภรณ์', 'Jiraporn'], ['เมธาวี', 'Methawee'],
];
const LAST = [
  ['ใจดี', 'Jaidee'], ['รักเรียน', 'Rakrian'], ['มั่งมี', 'Mangmee'],
  ['ศรีสุข', 'Srisuk'], ['บุญมาก', 'Boonmak'], ['ทองคำ', 'Thongkham'],
  ['สุขใจ', 'Sukjai'], ['แก้วมณี', 'Kaewmanee'], ['พงษ์ไพร', 'Pongprai'],
  ['วงศ์วาน', 'Wongwan'], ['ชัยมงคล', 'Chaimongkol'], ['ไพศาล', 'Phaisan'],
  ['เจริญสุข', 'Charoensuk'], ['รุ่งเรือง', 'Rungruang'], ['ดวงดี', 'Duangdee'],
];
const FACULTY = [
  'คณะวิทยาการสารสนเทศ', 'คณะวิศวกรรมศาสตร์', 'คณะมนุษยศาสตร์และสังคมศาสตร์',
  'คณะวิทยาศาสตร์', 'คณะพยาบาลศาสตร์', 'คณะบริหารธุรกิจ',
];
const INSTITUTION = [
  'มหาวิทยาลัยบูรพา', 'มหาวิทยาลัยเกษตรศาสตร์', 'จุฬาลงกรณ์มหาวิทยาลัย',
  'มหาวิทยาลัยขอนแก่น', 'มหาวิทยาลัยเชียงใหม่',
];
const PROVINCE = ['ชลบุรี', 'ระยอง', 'กรุงเทพมหานคร', 'ฉะเชิงเทรา', 'สมุทรปราการ'];

// ── helpers ─────────────────────────────────────────────────────────────────
const pad3 = (n) => String(n).padStart(3, '0');
const pad2 = (n) => String(n).padStart(2, '0');
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

const REQUEST_TIMEOUT_MS = numEnv('REQUEST_TIMEOUT_MS', 30000);
const MAX_RETRIES = numEnv('MAX_RETRIES', 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(method, path, body) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      let data = null;
      const text = await res.text();
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      // 500 มัก = deadlock/lock-wait ที่ backend → retry
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        lastErr = `HTTP ${res.status}`;
        await sleep(500 * attempt);
        continue;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      // timeout / ECONNRESET / network → retry แบบ backoff (ไม่ทำให้ทั้ง run ตาย)
      clearTimeout(timer);
      lastErr = e?.cause?.code || e?.name || String(e);
      if (attempt < MAX_RETRIES) await sleep(700 * attempt);
    }
  }
  return { ok: false, status: 0, data: { message: `request failed after ${MAX_RETRIES} tries: ${lastErr}` } };
}

async function getUsers() {
  const { data } = await http('GET', '/users');
  const arr = Array.isArray(data) ? data : data?.value || [];
  return arr;
}

function makeNationalId(existing) {
  let id;
  do {
    id = rand(['1', '2', '3']) + randDigits(12);
  } while (existing.has(id));
  existing.add(id);
  return id;
}

// ── STEP 1: สร้าง users ──────────────────────────────────────────────────────
async function createUsers(existingEmails, existingNationalIds) {
  console.log(`\n=== STEP 1: สร้าง users test${pad3(NEW_USER_FROM)}..test${pad3(NEW_USER_TO)} ===`);
  let created = 0, skipped = 0, failed = 0;
  for (let i = NEW_USER_FROM; i <= NEW_USER_TO; i++) {
    const email = `test${pad3(i)}@gmail.com`;
    if (existingEmails.has(email)) { skipped++; continue; }

    const [firstTh, firstEn] = rand(FIRST);
    const [lastTh, lastEn] = rand(LAST);
    const title = rand(TITLE_TH_OPTIONS);
    const year = 1990 + (i % 16); // 1990..2005 → อายุพอเหมาะ, < วันนี้แน่นอน
    const payload = {
      email,
      password: PASSWORD,
      userType: 'thai',
      nationalId: makeNationalId(existingNationalIds),
      country: 'TH',
      titleTH: title.value,
      titleEN: title.en,
      fullName: `${firstTh} ${lastTh}`,
      englishName: `${firstEn} ${lastEn}`,
      phone: '0' + rand(['6', '8', '9']) + randDigits(8),
      birthdate: `${year}-${pad2((i % 12) + 1)}-${pad2((i % 27) + 1)}`,
      educationLevel: rand(EDUCATION_OPTIONS),
      faculty: rand(FACULTY),
      institution: rand(INSTITUTION),
      address: `${10 + i}/${i} หมู่ ${i % 9} ต.แสนสุข อ.เมือง จ.${rand(PROVINCE)}`,
    };

    const { ok, status, data } = await http('POST', '/auth/register', payload);
    if (ok) {
      created++;
      if (created % 20 === 0) console.log(`  ...สร้างแล้ว ${created}`);
    } else {
      failed++;
      console.warn(`  ✗ ${email} (${status}): ${JSON.stringify(data)?.slice(0, 120)}`);
    }
  }
  console.log(`STEP 1 เสร็จ: สร้าง ${created}, ข้าม(มีอยู่แล้ว) ${skipped}, ล้มเหลว ${failed}`);
}

// ── STEP 2+3: ลงทะเบียน + จ่ายเงิน ───────────────────────────────────────────
function pickRemark() {
  return Math.random() < REMARK_PROBABILITY ? rand(REMARK_OPTIONS) : GENERAL_REMARK;
}

function buildReceipt(user) {
  const p = user.PROFILE || {};
  const phone = /^\d{10}$/.test(p.userPhone || '') ? p.userPhone : '0' + rand(['6', '8', '9']) + randDigits(8);
  return {
    RC_TAX_ID: (user.USER_NATIONAL_ID || randDigits(13)).slice(0, 15),
    RC_NAME: (p.userFullnameTh || `ผู้สมัคร ${user.USER_EMAIL}`).slice(0, 255),
    RC_PHONE: phone,
    RC_ADDRESS: (p.userAddress || 'ต.แสนสุข อ.เมือง จ.ชลบุรี').slice(0, 500),
  };
}

async function enrollAndPay(pool) {
  console.log(`\n=== STEP 2+3: ลงทะเบียนรอบทั่วไป + จ่ายเงิน ===`);
  const { data: exams } = await http('GET', '/exam');
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const openExams = (exams || []).filter(
    (e) => e.EXAM_PUBLISHED === true &&
      e.EXAM_TYPE !== SPECIAL_EXAM_TYPE &&
      new Date(e.EXAM_DATE) >= today,
  );

  const poolById = new Map(pool.map((u) => [u.USER_ID, u]));

  // ── reconcile: จ่ายเงินให้ enrollment ของ pool ที่ค้าง UNPAID (เช่น orphan จาก run ก่อน) ──
  let reconciled = 0;
  for (const exam of openExams) {
    const fee = Number(exam.EXAM_FEE) || 0;
    const { data: rows } = await http('GET', `/exam-enrollments/exam/${exam.EXAM_ID}`);
    const unpaid = (Array.isArray(rows) ? rows : []).filter(
      (e) => e.ERM_STATUS === 0 && poolById.has(e.USER?.USER_ID || e.USER_ID),
    );
    for (const e of unpaid) {
      const user = poolById.get(e.USER?.USER_ID || e.USER_ID);
      const payRes = await http('POST', '/transactions/pending-payment', {
        ERM_ID: e.ERM_ID, TRANX_AMOUNT: fee, ...buildReceipt(user),
      });
      if (payRes.ok) reconciled++;
      else console.warn(`    ✗ reconcile pay ERM ${e.ERM_ID} (${payRes.status})`);
    }
  }
  if (reconciled) console.log(`  reconcile: จ่ายเงิน UNPAID ค้าง ${reconciled} รายการ`);

  let totalEnroll = 0, totalPay = 0, remarkCount = 0;

  for (const exam of openExams) {
    const fee = Number(exam.EXAM_FEE) || 0;
    const sessions = exam.SESSIONS || [];
    for (const s of sessions) {
      if (ENROLL_ONLY_SESSION && s.SS_ID !== ENROLL_ONLY_SESSION) continue;
      const active = (s.ENROLLMENTS || []).filter((x) => x.ERM_STATUS !== 5).length;
      // ยอดรวมที่ต้องการ = เต็มความจุ แต่ถ้า cap > เพดาน ก็เอาแค่เพดาน (เช่น 200) พอ
      const desiredTotal = Math.min(s.SS_CAPACITY || 0, MAX_USERS_PER_SESSION);
      const target = Math.max(0, desiredTotal - active);
      if (target <= 0) {
        console.log(`  - EXAM ${exam.EXAM_ID} SS ${s.SS_ID}: ถึงเป้าแล้ว (active ${active}/${desiredTotal}, cap ${s.SS_CAPACITY})`);
        continue;
      }
      console.log(`  ▶ EXAM ${exam.EXAM_ID} "${exam.EXAM_NAME}" SS ${s.SS_ID} เวลา ${s.SS_START_TIME} | ต้องเติม ${target} (cap ${s.SS_CAPACITY}, active ${active})`);

      let filled = 0;
      for (let pi = 0; pi < pool.length && filled < target; pi++) {
        const user = pool[pi];
        const remark = pickRemark();
        const enrollRes = await http('POST', '/exam-enrollments', {
          USER_ID: user.USER_ID,
          SESSION_ID: s.SS_ID,
          PHYSICAL_STATUS: remark,
        });

        if (!enrollRes.ok) {
          // 409 = user ลงรอบเวลานี้แล้ว → ข้ามไป user ถัดไป
          // 400 FULL = รอบเต็ม → หยุด session นี้
          const msg = JSON.stringify(enrollRes.data);
          if (enrollRes.status === 400 && /FULL/i.test(msg)) {
            console.log(`    (backend แจ้ง FULL — หยุด session นี้)`);
            break;
          }
          if (enrollRes.status !== 409) {
            console.warn(`    ✗ enroll user ${user.USER_EMAIL} (${enrollRes.status}): ${msg.slice(0, 100)}`);
          }
          continue;
        }

        totalEnroll++;
        filled++;
        if (remark !== GENERAL_REMARK) remarkCount++;
        const ermId = enrollRes.data?.ERM_ID;

        // STEP 3: จ่ายเงิน + บันทึก
        const payRes = await http('POST', '/transactions/pending-payment', {
          ERM_ID: ermId,
          TRANX_AMOUNT: fee,
          ...buildReceipt(user),
        });
        if (payRes.ok) totalPay++;
        else console.warn(`    ✗ pay ERM ${ermId} (${payRes.status}): ${JSON.stringify(payRes.data)?.slice(0, 100)}`);
      }
      console.log(`    เติมได้ ${filled}/${target}`);
    }
  }

  console.log(`\nSTEP 2+3 เสร็จ: enrollment ${totalEnroll}, payment ${totalPay}, มีหมายเหตุ ${remarkCount} (${totalEnroll ? Math.round((remarkCount / totalEnroll) * 100) : 0}%)`);
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`API: ${BASE}`);
  let users = await getUsers();
  const existingEmails = new Set(users.map((u) => u.USER_EMAIL));
  const existingNationalIds = new Set(users.map((u) => u.USER_NATIONAL_ID).filter(Boolean));

  await createUsers(existingEmails, existingNationalIds);

  // refetch เพื่อให้ได้ USER_ID ของ user ที่เพิ่งสร้าง
  users = await getUsers();
  const byEmail = new Map(users.map((u) => [u.USER_EMAIL, u]));
  const pool = [];
  for (let i = POOL_FROM; i <= POOL_TO; i++) {
    const u = byEmail.get(`test${pad3(i)}@gmail.com`);
    if (u) pool.push(u);
  }
  console.log(`\nPool ที่ใช้ลงทะเบียน: ${pool.length} users (test${pad3(POOL_FROM)}..test${pad3(POOL_TO)})`);

  await enrollAndPay(pool);
  console.log('\n✅ เสร็จสิ้น');
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
