export interface CertificateIssuedEmailData {
  fullName: string;
  examName: string;
  historyUrl: string;
}

export function getCertificateIssuedEmailSubject(examName: string): string {
  return `[แจ้งเตือนใบรับรองผลสอบ] - ${examName}`;
}

export function getCertificateIssuedEmailTemplate(
  data: CertificateIssuedEmailData,
): string {
  const { fullName, examName, historyUrl } = data;

  return `
    <div style="font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; border-top: 6px solid #1e3a8a; background-color: #ffffff;">
      <h2 style="color: #1e3a8a; text-align: center; margin-top: 0;">ระบบแจ้งเตือน BUU-GET</h2>
      <p>เรียน คุณ <strong>${fullName}</strong>,</p>
      <p>ระบบได้ออกใบรับรองผลสอบ (Certificate) สำหรับรอบสอบ <strong>${examName}</strong> ให้ท่านเรียบร้อยแล้ว</p>
      <p style="color: #1e3a8a; font-weight: bold;">ท่านสามารถดูและดาวน์โหลดใบรับรองได้ที่ลิงก์ด้านล่างนี้:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${historyUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
          ดูและดาวน์โหลดใบรับรอง
        </a>
      </p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666; text-align: center;">นี่คืออีเมลอัตโนมัติจากระบบ BUU-GET กรุณาอย่าตอบกลับอีเมลนี้</p>
    </div>
  `;
}
