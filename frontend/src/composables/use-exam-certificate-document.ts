import { ref, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUserStore } from 'src/stores/user.store';
import { getImageUrl } from 'src/services/image.service';
import { getBandRules } from 'src/services/score-criteria.service';
import type { ExamHistoryItem } from 'src/types/exam';
import type { CertificateScoreReportData } from 'src/types/certificate';

export function useExamCertificateDocument() {
  const $q = useQuasar();
  const userStore = useUserStore();

  const isDownloadingCertificate = ref(false);
  const selectedCertificateData = ref<CertificateScoreReportData | undefined>(undefined);

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

    $q.loading.show({
      message: 'กำลังดาวน์โหลดใบประกาศนียบัตร...',
    });
    isDownloadingCertificate.value = true;

    try {
      const bandRulesResponse = await getBandRules();

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
        vocabScore: Number(score.SC_LANG_USE_SCORE ?? 0),
        readingScore: Number(score.SC_READING_SCORE ?? 0),
        totalScore: Number(score.SC_TOTAL_SCORE ?? 0),
        band: Number(score.SC_BAND_LEVEL ?? 0),
        reportIssueDate: formatEnglishDate(certificate.CERT_ISSUED_AT),
        scoreValidUntil: formatEnglishDate(certificate.CERT_EXPIRES_AT),
        certificateCode: certificate.CERT_CODE,
        ...(profileImagePath ? { profileImage: getImageUrl(profileImagePath) } : {}),
        bandRules: bandRulesResponse.bandRules,
      };

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 600));

      const container = document.getElementById('certificate-render-container');
      const certificateElement = container?.querySelector(
        '.certificate-score-report',
      ) as HTMLElement | null;

      if (!certificateElement) {
        throw new Error('Certificate element not found');
      }

      await waitForImages(certificateElement);

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
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
      $q.loading.hide();
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
