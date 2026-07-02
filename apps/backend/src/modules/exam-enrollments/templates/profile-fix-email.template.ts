export interface ProfileFixEmailData {
  fullName: string;
  examName: string;
  regId: string;
  reasons: string[];
  notes?: string;
  fixDeadline: string;
  profileUrl: string;
}

// ปรับปรุงสไตล์ภายในตัวบล็อกข้อความทั้งหมดให้สวยงาม พรีเมียม และเป็นทางการสูงสุด (โดยคงโครงสร้าง Card 600px เดิมไว้)
const styles = {
  wrapper: `
    background-color: #f8fafc;
    padding: 48px 16px;
    font-family: 'Sarabun', 'Noto Sans Thai', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `,
  container: `
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 16px -6px rgba(15, 23, 42, 0.02);
    overflow: hidden;
    border-top: 6px solid #1e3a8a;
  `,
  header: `
    text-align: center;
    padding: 40px 24px 32px 24px;
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
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 0.5px;
  `,
  headerSubtitle: `
    color: #475569;
    margin: 8px 0 0 0;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.2px;
  `,
  body: `
    padding: 36px 36px 28px 36px;
  `,
  bodySalutation: `
    font-size: 18px;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 700;
  `,
  bodyIntro: `
    font-size: 16px;
    color: #334155;
    margin-bottom: 24px;
    line-height: 1.8;
  `,
  highlightWarning: `
    color: #e11d48;
    font-weight: 700;
  `,
  reasonContainer: `
    background-color: #fff1f2;
    border: 1px solid #fecdd3;
    border-left: 5px solid #f43f5e;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 20px;
  `,
  reasonTitle: `
    margin: 0 0 16px 0;
    color: #9f1239;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
  `,
  warningDot: `
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: #f43f5e;
    border-radius: 50%;
    margin-right: 10px;
    vertical-align: middle;
  `,
  reasonList: `
    margin: 0;
    padding: 0;
  `,
  reasonItem: `
    margin-bottom: 12px;
    display: table;
    width: 100%;
  `,
  reasonBullet: `
    display: table-cell;
    width: 18px;
    color: #f43f5e;
    font-weight: 700;
    font-size: 16px;
    line-height: 1.4;
    vertical-align: top;
  `,
  reasonText: `
    display: table-cell;
    color: #4c0519;
    font-size: 15px;
    line-height: 1.6;
    vertical-align: top;
  `,
  notesSection: `
    margin-top: 16px;
    padding: 16px;
    background-color: #ffffff;
    border: 1px dashed #fda4af;
    border-radius: 8px;
  `,
  notesTitle: `
    font-weight: 700;
    font-size: 14px;
    color: #e11d48;
    margin-bottom: 8px;
  `,
  notesDot: `
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: #e11d48;
    border-radius: 50%;
    margin-right: 8px;
    vertical-align: middle;
  `,
  notesContent: `
    margin: 0;
    font-style: italic;
    white-space: pre-wrap;
    font-size: 14px;
    color: #4c0519;
    line-height: 1.6;
  `,
  deadlineContainer: `
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 5px solid #d97706;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 24px;
  `,
  deadlineTitle: `
    margin: 0 0 12px 0;
    color: #78350f;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
  `,
  deadlineDot: `
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: #d97706;
    border-radius: 50%;
    margin-right: 10px;
    vertical-align: middle;
  `,
  deadlineContent: `
    margin: 0 0 10px 0;
    color: #78350f;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.6;
  `,
  deadlineHighlight: `
    color: #b45309;
    font-size: 16px;
    font-weight: 800;
    padding: 4px 10px;
    background-color: #fef3c7;
    border-radius: 6px;
    display: inline-block;
    margin: 0 4px;
    border: 1px solid #fde68a;
  `,
  deadlineCaution: `
    font-size: 13.5px;
    color: #9a3412;
    font-weight: 500;
    line-height: 1.6;
  `,
  buttonWrapper: `
    text-align: center;
    margin: 32px 0 24px 0;
  `,
  buttonContainer: `
    display: inline-block;
    margin: 0 auto;
  `,
  button: `
    background-color: #1e3a8a;
    color: #ffffff !important;
    padding: 14px 40px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 16px;
    display: inline-block;
    box-shadow: 0 6px 18px rgba(30, 58, 138, 0.25);
    border: 1px solid #172554;
    letter-spacing: 0.5px;
    text-align: center;
    white-space: nowrap;
  `,
  buttonHelpText: `
    font-size: 13px;
    color: #64748b;
    margin-top: 16px;
    line-height: 1.6;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  `,
  fallbackLinkContainer: `
    word-break: break-all;
    color: #94a3b8;
    font-size: 12px;
    text-align: center;
    margin-top: 32px;
    padding: 14px 16px;
    background-color: #f8fafc;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    line-height: 1.6;
  `,
  fallbackLink: `
    color: #2563eb;
    text-decoration: underline;
    font-weight: 500;
  `,
  footer: `
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 28px 32px;
    text-align: center;
    color: #64748b;
    font-size: 12px;
    line-height: 1.7;
  `,
  footerText: `
    margin: 0 0 6px 0;
    color: #1e293b;
    font-weight: 700;
    font-size: 13px;
  `,
  footerSubtext: `
    margin: 0;
    color: #94a3b8;
  `,
};

// ฟังก์ชันแปลงวัน/เดือนภาษาอังกฤษ หรือวันแบบ ISO ให้เป็นวันที่ภาษาไทยพร้อม พ.ศ. ที่เป็นทางการสูงสุด
const translateDateToThai = (dateStr: string): string => {
  if (!dateStr) return '';

  const monthMap: Record<string, string> = {
    january: 'มกราคม',
    february: 'กุมภาพันธ์',
    march: 'มีนาคม',
    april: 'เมษายน',
    may: 'พฤษภาคม',
    june: 'มิถุนายน',
    july: 'กรกฎาคม',
    august: 'สิงหาคม',
    september: 'กันยายน',
    october: 'ตุลาคม',
    november: 'พฤศจิกายน',
    december: 'ธันวาคม',
    jan: 'มกราคม',
    feb: 'กุมภาพันธ์',
    mar: 'มีนาคม',
    apr: 'เมษายน',
    jun: 'มิถุนายน',
    jul: 'กรกฎาคม',
    aug: 'สิงหาคม',
    sep: 'กันยายน',
    oct: 'ตุลาคม',
    nov: 'พฤศจิกายน',
    dec: 'ธันวาคม',
  };

  let result = dateStr;

  // จัดการกรณีวันที่ในรูปแบบ YYYY-MM-DD
  const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (yyyymmddRegex.test(result)) {
    const [, year, month, day] = result.match(yyyymmddRegex) || [];
    const months = [
      '',
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    const thaiMonth = months[parseInt(month, 10)] || month;
    const thaiYear = parseInt(year, 10) + 543;
    return `${parseInt(day, 10)} ${thaiMonth} ${thaiYear}`;
  }

  // แปลงชื่อเดือนภาษาอังกฤษเป็นภาษาไทย
  Object.entries(monthMap).forEach(([eng, thai]) => {
    const regex = new RegExp(eng, 'gi');
    result = result.replace(regex, thai);
  });

  // แปลง ค.ศ. เป็น พ.ศ. (บวก 543 ในช่วงปี ค.ศ. 2020-2039)
  result = result.replace(/\b20([2-3][0-9])\b/g, (match) => {
    const adYear = parseInt(match, 10);
    return String(adYear + 543);
  });

  return result;
};

export const getProfileFixEmailTemplate = (
  data: ProfileFixEmailData,
): string => {
  const reasonMapping: Record<string, string> = {
    photo:
      'รูปถ่ายไม่ถูกต้อง (กรุณาอัปโหลดรูปถ่ายหน้าตรง ชุดสุภาพ หรือชุดนิสิต)',
    info: 'กรอกข้อมูลส่วนตัวไม่ถูกต้อง (กรุณาตรวจสอบชื่อ-นามสกุล เลขบัตรประชาชน หรือวันเกิด)',
    other: 'อื่น ๆ (กรุณาดูรายละเอียดในช่องหมายเหตุเพิ่มเติมด้านล่าง)',
  };

  const mappedReasons = data.reasons.map((r) => reasonMapping[r] || r);
  const thaiDeadline = translateDateToThai(data.fixDeadline);

  const notesText = data.notes
    ? `<div style="${styles.notesSection}">
         <div style="${styles.notesTitle}"><span style="${styles.notesDot}"></span>หมายเหตุเพิ่มเติมจากเจ้าหน้าที่:</div>
         <p style="${styles.notesContent}">${data.notes}</p>
       </div>`
    : '';

  const reasonsList = mappedReasons
    .map(
      (reason) =>
        `<div style="${styles.reasonItem}"><span style="${styles.reasonBullet}">•</span><span style="${styles.reasonText}">${reason}</span></div>`,
    )
    .join('');

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700;800&display=swap');
    </style>
    <div style="${styles.wrapper}">
      <div style="${styles.container}">
        <div style="${styles.header}">
          <div style="${styles.logoContainer}">
            <span style="${styles.logoText}">BUU-GET EMAIL SERVICE</span>
          </div>
          <h2 style="${styles.headerTitle}">แจ้งเตือนสถานะการตรวจสอบใบสมัครสอบ</h2>
          <p style="${styles.headerSubtitle}">ระบบ BUU-GET มหาวิทยาลัยบูรพา</p>
        </div>
        
        <div style="${styles.body}">
          <p style="${styles.bodySalutation}">เรียน คุณ <span style="white-space: nowrap;">${data.fullName}</span>,</p>
          <p style="${styles.bodyIntro}">
            เจ้าหน้าที่ได้ทำการตรวจสอบใบสมัครสอบของท่านสำหรับรอบสอบ <span style="white-space: nowrap;"><strong>${data.examName}</strong></span> <span style="white-space: nowrap;">(เลขที่สมัคร: ${data.regId})</span> เรียบร้อยแล้ว และพบว่า 
            <span style="${styles.highlightWarning}">มีข้อมูลหรือเอกสารบางส่วนไม่ถูกต้อง <span style="white-space: nowrap;">ซึ่งจำเป็นต้องได้รับการแก้ไขโดยด่วน</span></span>
          </p>
          
          <!-- บล็อกแสดงรายละเอียดจุดที่ต้องแก้ไข -->
          <div style="${styles.reasonContainer}">
            <h3 style="${styles.reasonTitle}"><span style="${styles.warningDot}"></span>รายละเอียดที่จำเป็นต้องได้รับการแก้ไข:</h3>
            <div style="${styles.reasonList}">
              ${reasonsList}
            </div>
            ${notesText}
          </div>
          
          <!-- บล็อกกำหนดเวลาการแก้ไขข้อมูล -->
          <div style="${styles.deadlineContainer}">
            <h3 style="${styles.deadlineTitle}"><span style="${styles.deadlineDot}"></span>กำหนดการแก้ไขข้อมูล:</h3>
            <p style="${styles.deadlineContent}">
              กรุณาดำเนินการแก้ไขภายในวันที่ <span style="${styles.deadlineHighlight}; white-space: nowrap;">${thaiDeadline}</span>
            </p>
            <div style="${styles.deadlineCaution}">
              หากพ้นกำหนดเวลาดังกล่าว จะถือว่าท่านสละสิทธิ์ในการสมัครสอบรอบนี้
            </div>
          </div>
          
          <!-- บล็อกปุ่มดำเนินการแก้ไข -->
          <div style="${styles.buttonWrapper}">
            <div style="${styles.buttonContainer}">
              <a href="${data.profileUrl}" style="${styles.button}">
                ดำเนินการแก้ไขข้อมูลส่วนตัว
              </a>
            </div>
            <p style="${styles.buttonHelpText}">
              หมายเหตุ: หากยังไม่ได้เข้าสู่ระบบ ระบบจะนำท่านไปยังหน้าล็อกอินก่อน และเมื่อเข้าสู่ระบบสำเร็จ ระบบจะนำท่านไปยังหน้าแก้ไขโปรไฟล์โดยอัตโนมัติ
            </p>
          </div>
          
          <p style="${styles.fallbackLinkContainer}">
            หากปุ่มด้านบนใช้งานไม่ได้ กรุณาใช้ลิงก์ด้านล่างนี้แทน: <br/> 
            <a href="${data.profileUrl}" style="${styles.fallbackLink}">${data.profileUrl}</a>
          </p>
        </div>
        
        <div style="${styles.footer}">
          <p style="${styles.footerText}">ศูนย์ทดสอบภาษาอังกฤษ กองบริการการศึกษา มหาวิทยาลัยบูรพา</p>
          <p style="${styles.footerSubtext}">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้ หากมีข้อสงสัยกรุณาติดต่อหน่วยงานผู้จัดสอบโดยตรง</p>
        </div>
      </div>
    </div>
  `;
};
