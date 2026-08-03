import { ref, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUserStore } from 'src/stores/user.store';
import { getImageUrl } from 'src/services/image.service';
import { getBandRules } from 'src/services/score-criteria.service';
import type { ExamHistoryItem } from 'src/types/exam';
import type { CertificateCardData } from 'src/types/certificate';
import { generateCertificateQrDataUrl } from 'src/utils/verify-qr';

export function useExamCertificateDocument() {
  const $q = useQuasar();
  const userStore = useUserStore();

  const isDownloadingCertificate = ref(false);
  const selectedCertificateData = ref<CertificateCardData | undefined>(undefined);

  const waitForImages = async (element: HTMLElement, timeoutMs = 250): Promise<void> => {
    const pendingImages = Array.from(element.querySelectorAll('img')).filter(
      (image) => !image.complete,
    );

    if (pendingImages.length === 0) return;

    await Promise.race([
      Promise.all(
        pendingImages.map(
          (image) =>
            new Promise<void>((resolve) => {
              image.onload = () => resolve();
              image.onerror = () => resolve();
            }),
        ),
      ).then(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
    ]);
  };

  const formatEnglishDate = (dateStr?: string | Date | null): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const printCertificate = async (exam: ExamHistoryItem): Promise<void> => {
    const enrollment = exam.rawEnrollment;
    const score = enrollment?.SCORE;
    const certificate = score?.CERTIFICATES?.[0];

    if (!enrollment || !score || !certificate) {
      $q.notify({
        type: 'warning',
        message: 'ไม่พบข้อมูลใบประกาศนียบัตร',
        position: 'top',
      });
      return;
    }

    const session = enrollment.SESSION;
    const examObj = session?.EXAM;
    const profile = enrollment.USER?.PROFILE;
    const fullName =
      profile?.userFullnameEn || profile?.userFullnameTh || enrollment.USER?.USER_EMAIL || '-';
    const title = profile?.userTitleEn || profile?.userTitleTh || '';
    const profileImagePath =
      enrollment.USER?.IMAGE?.USER_IMAGE_URL ||
      profile?.userImagePath ||
      userStore.currentUser?.userImagePath;

    isDownloadingCertificate.value = true;

    try {
      const bandRulesResponse = await getBandRules();
      const qrDataUrl = await generateCertificateQrDataUrl(certificate.CERT_CODE);

      selectedCertificateData.value = {
        fullName: `${title} ${fullName}`.trim(),
        testTakerId: enrollment.ERM_TEST_TAKER || enrollment.USER?.USER_CODE || '-',
        nationalId:
          enrollment.USER?.USER_NATIONAL_ID ||
          enrollment.USER?.USER_PASSPORT_NO ||
          userStore.currentUser?.nationalId ||
          userStore.currentUser?.passportNo ||
          '-',
        testSession: examObj?.EXAM_ROUND || '-',
        testDate: formatEnglishDate(examObj?.EXAM_DATE),
        vocabScore: `${Number(score.SC_LANG_USE_SCORE ?? 0)}/50`,
        readingScore: `${Number(score.SC_READING_SCORE ?? 0)}/50`,
        totalScore: `${Number(score.SC_TOTAL_SCORE ?? 0)}/100`,
        bandLevel: String(Number(score.SC_BAND_LEVEL ?? 0)),
        reportIssueDate: formatEnglishDate(certificate.CERT_ISSUED_AT),
        scoreValidUntil: formatEnglishDate(certificate.CERT_EXPIRES_AT),
        certificateCode: certificate.CERT_CODE,
        bandRules: bandRulesResponse.bandRules,
        profileImage: profileImagePath ? getImageUrl(profileImagePath) : null,
        qrDataUrl,
      };

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 600));

      const container = document.getElementById('certificate-render-container');
      const cardElements = Array.from(
        container?.querySelectorAll<HTMLElement>('.certificate-card-preview') ?? [],
      );

      if (cardElements.length === 0) {
        throw new Error('Certificate element not found');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const horizontalMargin = 14;
      const cardGap = 10;
      const imgWidth = pageWidth - horizontalMargin * 2;

      const renderedCards: { imgData: string; imgHeight: number }[] = [];
      for (const cardElement of cardElements) {
        await waitForImages(cardElement);

        const canvas = await html2canvas(cardElement, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        renderedCards.push({
          imgData: canvas.toDataURL('image/png'),
          imgHeight: (imgWidth * canvas.height) / canvas.width,
        });
      }

      const totalHeight =
        renderedCards.reduce((sum, card) => sum + card.imgHeight, 0) +
        cardGap * Math.max(renderedCards.length - 1, 0);
      let offsetY = Math.max((pageHeight - totalHeight) / 2, horizontalMargin);

      for (const card of renderedCards) {
        pdf.addImage(
          card.imgData,
          'PNG',
          horizontalMargin,
          offsetY,
          imgWidth,
          card.imgHeight,
        );
        offsetY += card.imgHeight + cardGap;
      }

      pdf.save(`BUU-GET_Certificate_${enrollment.ERM_ID}.pdf`);

      $q.notify({
        type: 'positive',
        message: 'ดาวน์โหลดใบประกาศนียบัตรสำเร็จ',
        position: 'top',
      });
    } catch (err) {
      console.error(err);
      $q.notify({
        type: 'negative',
        message: 'ดาวน์โหลดใบประกาศนียบัตรไม่สำเร็จ',
        position: 'top',
      });
    } finally {
      isDownloadingCertificate.value = false;
      selectedCertificateData.value = undefined;
    }
  };

  return {
    isDownloadingCertificate,
    selectedCertificateData,
    printCertificate,
  };
}
