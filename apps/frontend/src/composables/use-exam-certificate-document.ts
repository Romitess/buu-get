import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { downloadExamCertificate } from 'src/services/exam-certificate.service';
import type { ExamHistoryItem } from 'src/types/exam';

const readDownloadErrorMessage = async (error: unknown): Promise<string> => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  let payload: unknown = data;
  if (data instanceof Blob) {
    try {
      payload = JSON.parse(await data.text()) as unknown;
    } catch {
      payload = null;
    }
  }
  const message = (payload as { message?: unknown } | null)?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (Array.isArray(message) && typeof message[0] === 'string' && message[0].trim()) {
    return message[0];
  }
  return 'ดาวน์โหลดใบประกาศนียบัตรไม่สำเร็จ';
};

export function useExamCertificateDocument() {
  const $q = useQuasar();
  const isDownloadingCertificate = ref(false);

  const printCertificate = async (exam: ExamHistoryItem): Promise<void> => {
    const certificate = exam.rawEnrollment?.SCORE?.CERTIFICATES?.[0];
    if (!certificate?.CERT_ID) {
      $q.notify({
        type: 'warning',
        message: 'ไม่พบข้อมูลใบประกาศนียบัตร',
        position: 'top',
      });
      return;
    }

    isDownloadingCertificate.value = true;
    try {
      await downloadExamCertificate(certificate.CERT_ID);
      $q.notify({
        type: 'positive',
        message: 'ดาวน์โหลดใบประกาศนียบัตรสำเร็จ',
        position: 'top',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: await readDownloadErrorMessage(error),
        position: 'top',
      });
    } finally {
      isDownloadingCertificate.value = false;
    }
  };

  return {
    isDownloadingCertificate,
    printCertificate,
  };
}
