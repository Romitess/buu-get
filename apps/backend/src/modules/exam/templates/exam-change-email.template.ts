export interface ExamChangeRow {
  label: string;
  oldValue: string;
  newValue: string;
}

export interface ExamChangeEmailData {
  /** ชื่อ-นามสกุลของผู้เข้าสอบ (ผู้รับอีเมล) */
  fullName: string;
  /** ชื่อรอบสอบ */
  examName: string;
  /** หมายเลข/ชื่อรอบ (EXAM_ROUND) */
  examRound: string;
  /** รายการการเปลี่ยนแปลง */
  changes: ExamChangeRow[];
}

// กฎการตัดบรรทัดที่ถูกต้องตามหลักภาษาไทย: ไม่ตัดกลางคำ ตัดเฉพาะเมื่อจำเป็น
// (word-break: normal เพื่อไม่ตัดกลางคำ + overflow-wrap: break-word กันข้อความล้นกรอบ)
const THAI_WRAP = `word-break: normal; overflow-wrap: break-word; line-break: strict;`;

// ฟอนต์หลัก Sarabun (รองรับภาษาไทยอย่างถูกต้อง) พร้อม fallback
const FONT_STACK = `'Sarabun', 'Noto Sans Thai', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`;

// สไตล์แบบ inline เพื่อรองรับ Email Client ทุกตัว และออกแบบให้ลื่นไหล/อ่านง่ายบนทุกขนาดหน้าจอ
const styles = {
  wrapper: `
    background-color: #f1f5f9;
    padding: 24px 12px;
    font-family: ${FONT_STACK};
    width: 100%;
    box-sizing: border-box;
  `,
  container: `
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 16px -6px rgba(15, 23, 42, 0.02);
    overflow: hidden;
    border-top: 6px solid #1e3a8a;
    box-sizing: border-box;
  `,
  header: `
    text-align: center;
    padding: 32px 20px 24px 20px;
    border-bottom: 1px solid #f1f5f9;
  `,
  logoContainer: `
    display: inline-block;
    background-color: #eff6ff;
    padding: 8px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #dbeafe;
  `,
  logoText: `
    color: #1e3a8a;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 1.5px;
  `,
  headerTitle: `
    color: #0f172a;
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.3px;
    line-height: 1.4;
  `,
  headerSubtitle: `
    color: #475569;
    margin: 8px 0 0 0;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.2px;
  `,
  body: `
    padding: 28px 24px 24px 24px;
  `,
  bodySalutation: `
    font-size: 17px;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 14px;
    font-weight: 700;
    line-height: 1.6;
    ${THAI_WRAP}
  `,
  bodyIntro: `
    font-size: 15px;
    color: #334155;
    margin-bottom: 26px;
    line-height: 1.9;
    ${THAI_WRAP}
  `,
  examName: `
    color: #1e3a8a;
    font-weight: 700;
    white-space: nowrap;
  `,
  changeTitle: `
    margin: 0 0 16px 0;
    color: #1e3a8a;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.5;
  `,
  changeDot: `
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: #1e3a8a;
    border-radius: 50%;
    margin-right: 10px;
    vertical-align: middle;
  `,
  card: `
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #1e3a8a;
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 14px;
  `,
  cardLabel: `
    margin: 0 0 14px 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.5;
    ${THAI_WRAP}
  `,
  valueRow: `
    margin: 0 0 10px 0;
  `,
  valueRowLast: `
    margin: 0;
  `,
  valueTag: `
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 6px;
    margin-bottom: 6px;
  `,
  oldTag: `
    color: #64748b;
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
  `,
  newTag: `
    color: #047857;
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
  `,
  oldValue: `
    margin: 0;
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.85;
    text-decoration: line-through;
    white-space: pre-wrap;
    ${THAI_WRAP}
  `,
  newValue: `
    margin: 0;
    color: #065f46;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.85;
    white-space: pre-wrap;
    ${THAI_WRAP}
  `,
  noteContainer: `
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 4px solid #d97706;
    padding: 16px 18px;
    border-radius: 12px;
    margin-top: 22px;
  `,
  noteText: `
    margin: 0;
    color: #78350f;
    font-size: 14px;
    line-height: 1.85;
    ${THAI_WRAP}
  `,
  footer: `
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 24px 20px;
    text-align: center;
    color: #64748b;
    font-size: 12px;
    line-height: 1.8;
  `,
  footerText: `
    margin: 0 0 6px 0;
    color: #1e293b;
    font-weight: 700;
    font-size: 13px;
    ${THAI_WRAP}
  `,
  footerSubtext: `
    margin: 0;
    color: #94a3b8;
    ${THAI_WRAP}
  `,
};

/** ป้องกัน HTML injection ในค่าที่นำมาแสดง */
const escapeHtml = (value: string): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const getExamChangeEmailTemplate = (
  data: ExamChangeEmailData,
): string => {
  const roundText = data.examRound
    ? ` <span style="white-space: nowrap;">(รอบ ${escapeHtml(
        data.examRound,
      )})</span>`
    : '';

  // การ์ดเรียงต่อกันแนวตั้ง — แสดงเฉพาะข้อมูลใหม่ (ไม่มีป้าย "ข้อมูลใหม่" / ไม่แสดงข้อมูลเดิม)
  const changeCards = data.changes
    .map(
      (change) =>
        `<div style="${styles.card}">
          <p style="${styles.cardLabel}">${escapeHtml(change.label)}</p>
          <p style="${styles.newValue}">${escapeHtml(change.newValue) || '-'}</p>
        </div>`,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap');
        body { margin: 0; padding: 0; width: 100% !important; font-family: ${FONT_STACK}; -webkit-text-size-adjust: 100%; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
        p { font-family: ${FONT_STACK}; }
        @media only screen and (max-width: 480px) {
          .buu-body { padding: 22px 16px 18px 16px !important; }
          .buu-header { padding: 26px 16px 20px 16px !important; }
          .buu-footer { padding: 20px 16px !important; }
          .buu-title { font-size: 20px !important; }
        }
      </style>
    </head>
    <body>
      <div style="${styles.wrapper}">
        <div style="${styles.container}">
          <div class="buu-header" style="${styles.header}">
            <div style="${styles.logoContainer}">
              <span style="${styles.logoText}">BUU-GET EMAIL SERVICE</span>
            </div>
            <h2 class="buu-title" style="${styles.headerTitle}">แจ้งเตือนการเปลี่ยนแปลงรอบสอบ</h2>
            <p style="${styles.headerSubtitle}">ระบบ BUU-GET มหาวิทยาลัยบูรพา</p>
          </div>

          <div class="buu-body" style="${styles.body}">
            <p style="${styles.bodySalutation}">เรียน คุณ ${escapeHtml(data.fullName)},</p>
            <p style="${styles.bodyIntro}">
              ขอแจ้งให้ทราบว่ารอบสอบ <span style="${styles.examName}">${escapeHtml(
                data.examName,
              )}</span>${roundText} ที่ท่านได้ลงทะเบียนไว้
              <strong>มีการเปลี่ยนแปลงข้อมูล</strong> โดยมีรายละเอียดดังต่อไปนี้
            </p>

            <h3 style="${styles.changeTitle}"><span style="${styles.changeDot}"></span>รายละเอียดการเปลี่ยนแปลง</h3>
            ${changeCards}

            <div style="${styles.noteContainer}">
              <p style="${styles.noteText}">
                กรุณาตรวจสอบข้อมูลรอบสอบที่เปลี่ยนแปลงให้ถูกต้อง
                และวางแผนการเข้าสอบของท่านตามข้อมูลล่าสุด
                หากท่านมีข้อสงสัยเกี่ยวกับการเปลี่ยนแปลงนี้
                กรุณาติดต่อเจ้าหน้าที่ผู้จัดสอบโดยตรง
              </p>
            </div>
          </div>

          <div class="buu-footer" style="${styles.footer}">
            <p style="${styles.footerText}">ศูนย์ทดสอบภาษาอังกฤษ กองบริการการศึกษา มหาวิทยาลัยบูรพา</p>
            <p style="${styles.footerSubtext}">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้ หากมีข้อสงสัยกรุณาติดต่อหน่วยงานผู้จัดสอบโดยตรง</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
