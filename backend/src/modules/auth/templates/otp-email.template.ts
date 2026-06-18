export interface OtpEmailData {
  otpCode: string;
}

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
    text-align: center;
  `,
  bodySalutation: `
    font-size: 18px;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 700;
    text-align: left;
  `,
  bodyIntro: `
    font-size: 16px;
    color: #334155;
    margin-bottom: 24px;
    line-height: 1.8;
    text-align: left;
  `,
  otpContainer: `
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 20px;
    border-radius: 12px;
    margin: 28px 0;
    display: inline-block;
    letter-spacing: 6px;
    font-size: 36px;
    font-weight: 800;
    color: #1e3a8a;
  `,
  cautionContainer: `
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 5px solid #d97706;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    text-align: left;
  `,
  cautionText: `
    margin: 0;
    color: #78350f;
    font-size: 14px;
    line-height: 1.6;
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

export const getOtpEmailTemplate = (data: OtpEmailData): string => {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700;800&display=swap');
    </style>
    <div style="${styles.wrapper}">
      <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        รหัส OTP ของคุณคือ ${data.otpCode} - ใช้ยืนยันการสมัครสมาชิกระบบ BUU-GET (หมดอายุใน 5 นาที)
      </div>
      <div style="${styles.container}">
        <div style="${styles.header}">
          <div style="${styles.logoContainer}">
            <span style="${styles.logoText}">BUU-GET EMAIL SERVICE</span>
          </div>
          <h2 style="${styles.headerTitle}">รหัสผ่านหลักแบบใช้ครั้งเดียว (OTP)</h2>
          <p style="${styles.headerSubtitle}">ระบบ BUU-GET มหาวิทยาลัยบูรพา</p>
        </div>
        
        <div style="${styles.body}">
          <p style="${styles.bodySalutation}">สวัสดีครับ/ค่ะ,</p>
          <p style="${styles.bodyIntro}">
            ท่านได้ขอรหัสผ่านหลักแบบใช้ครั้งเดียว (OTP) เพื่อยืนยันตัวตนในการสมัครสมาชิกระบบ BUU-GET โปรดใช้รหัส OTP ด้านล่างนี้เพื่อดำเนินการต่อ:
          </p>
          
          <div style="${styles.otpContainer}">
            ${data.otpCode}
          </div>
          
          <div style="${styles.cautionContainer}">
            <p style="${styles.cautionText}">
              <strong>คำเตือน:</strong> รหัส OTP นี้มีอายุการใช้งาน 5 นาที และสามารถใช้งานได้เพียงครั้งเดียวเท่านั้น หากท่านไม่ได้เป็นผู้ทำรายการ โปรดละเลยอีเมลฉบับนี้
            </p>
          </div>
        </div>
        
        <div style="${styles.footer}">
          <p style="${styles.footerText}">ศูนย์ทดสอบภาษาอังกฤษ กองบริการการศึกษา มหาวิทยาลัยบูรพา</p>
          <p style="${styles.footerSubtext}">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
      </div>
    </div>
  `;
};
