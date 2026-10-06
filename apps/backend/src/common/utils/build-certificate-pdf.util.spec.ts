import { PDFDocument } from 'pdf-lib';
import {
  buildCertificatePdf,
  buildCertificateVerifyUrl,
} from './build-certificate-pdf.util';

describe('buildCertificatePdf', () => {
  it('builds a two-page PDF and keeps the BUU GET verify URL', async () => {
    const verifyUrl = buildCertificateVerifyUrl(
      'https://app.example.com/',
      'ABC 123',
    );
    expect(verifyUrl).toBe('https://app.example.com/#/v/c/ABC%20123');

    const pdf = await buildCertificatePdf({
      fullName: 'Miss ทดสอบ ระบบ',
      testTakerId: 'TT-1',
      nationalId: '1234567890123',
      testSession: '1/2569',
      testDate: '7 August 2026',
      scoreLines: [
        { nameEn: 'Vocabulary & Grammar', score: 35, maxScore: 50 },
        { nameEn: 'Reading', score: 40, maxScore: 50 },
      ],
      totalScore: '75/100',
      bandLevel: 'B1',
      reportIssueDate: '27 July 2026',
      scoreValidUntil: '27 July 2028',
      certificateCode: 'AUTOCODE',
      verifyUrl,
      bandRules: [
        {
          band: '4',
          minScore: 70,
          maxScore: 84,
          cefr: 'B1',
          descriptor:
            'Can understand straightforward factual texts on subjects related to his/her field.',
        },
      ],
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(2);
  });
});
