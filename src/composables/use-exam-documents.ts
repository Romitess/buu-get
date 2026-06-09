import { ref, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUserStore } from 'src/stores/user.store';
import { getImageUrl } from 'src/services/image.service';
import type { ExamEnrollment, ExamHistoryItem } from 'src/types/exam';
import type { VoucherData } from 'src/types/voucher';
import type { ReceiptData } from 'src/types/receipt';

export function useExamDocuments() {
  const $q = useQuasar();
  const { t } = useI18n();
  const userStore = useUserStore();

  const isDownloadingVoucher = ref(false);
  const selectedVoucherData = ref<VoucherData | undefined>(undefined);

  const isDownloadingReceipt = ref(false);
  const selectedReceiptData = ref<ReceiptData>({
    receiptNo: '',
    transactionDate: '',
    fullName: '',
    nationalId: '',
    examName: '',
    examDate: '',
    location: '',
    amount: 0,
    paymentMethod: '',
    status: 'PENDING',
  });

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const part0 = parts[0];
    const part1 = parts[1];
    if (parts.length >= 2 && part0 !== undefined && part1 !== undefined) {
      const hour = parseInt(part0, 10);
      const min = part1;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${String(formattedHour).padStart(2, '0')}.${min} ${ampm}`;
    }
    return timeStr;
  };

  const getTestSessionLabel = (currentSession: NonNullable<ExamEnrollment['SESSION']>): string => {
    const examDate = currentSession.EXAM?.EXAM_DATE;
    const examYear = examDate ? new Date(examDate).getFullYear() : new Date().getFullYear();
    const sessionTimeKey = `${currentSession.SS_START_TIME || ''}-${currentSession.SS_END_TIME || ''}`;
    const uniqueTimeKeys = [
      ...new Set(
        (currentSession.EXAM?.SESSIONS ?? [])
          .map((session) => `${session.SS_START_TIME || ''}-${session.SS_END_TIME || ''}`)
          .filter((timeKey) => timeKey !== '-'),
      ),
    ].sort();
    const sessionIndex = uniqueTimeKeys.indexOf(sessionTimeKey);
    const sessionNumber = sessionIndex >= 0 ? sessionIndex + 1 : 1;

    return `${sessionNumber}/${examYear}`;
  };

  const printVoucher = async (exam: ExamHistoryItem): Promise<void> => {
    const enrollment = exam.rawEnrollment;
    const user = userStore.currentUser;

    if (enrollment && enrollment.SESSION) {
      const session = enrollment.SESSION;
      const examObj = session.EXAM;
      const locationObj = session.LOCATION;

      // Format date nicely to match "15 May 2026"
      let dateStr = '15 May 2026';
      if (examObj?.EXAM_DATE) {
        const d = new Date(examObj.EXAM_DATE);
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
        dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }

      const startTime = formatTime(session.SS_START_TIME);
      const endTime = formatTime(session.SS_END_TIME);
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '08.00 AM - 10.00 AM';

      const locationText = locationObj
        ? `${locationObj.LOCATION_NAME}${locationObj.LOCATION_ROOM_NO ? ` (${locationObj.LOCATION_ROOM_NO})` : ''}`
        : 'QS1, Burapha University';

      const mapTitleToEn = (titleTH?: string): string => {
        if (!titleTH) return '';
        const titleMap: Record<string, string> = {
          นาย: 'Mr.',
          นาง: 'Mrs.',
          นางสาว: 'Miss',
          'ดร.': 'Dr.',
          ด็อกเตอร์: 'Dr.',
          'ศ.': 'Prof.',
          ศาสตราจารย์: 'Prof.',
          'รศ.': 'Assoc. Prof.',
          รองศาสตราจารย์: 'Assoc. Prof.',
          'ผศ.': 'Asst. Prof.',
          ผู้ช่วยศาสตราจารย์: 'Asst. Prof.',
        };
        return titleMap[titleTH] || titleTH;
      };

      const mapExamTypeToEn = (type?: string): string => {
        if (!type) return 'General';
        if (type === 'รอบทั่วไป' || type.toLowerCase() === 'general' || type === 'ทั่วไป')
          return 'General';
        if (type === 'รอบพิเศษ' || type.toLowerCase() === 'special' || type === 'พิเศษ')
          return 'Special';
        return type;
      };

      const examYear = examObj?.EXAM_DATE
        ? new Date(examObj.EXAM_DATE).getFullYear()
        : new Date().getFullYear();

      selectedVoucherData.value = {
        id: enrollment.ERM_ID,
        fullName: user
          ? `${user.titleEN || mapTitleToEn(user.titleTH) || ''} ${user.fullNameEN || user.fullNameTH || ''}`.trim()
          : 'Mr. Somdream Jaidee',
        studentId: user?.nationalId || String(user?.id || '66100001'),
        examName: examObj?.EXAM_NAME || "BUU-GET : Burapha University's Graduate English Test",
        examDate: dateStr,
        examTime: timeRange,
        examType: mapExamTypeToEn(examObj?.EXAM_TYPE),
        location: locationText,
        seatNo: enrollment.LOCATION_SEAT?.LS_SEAT_LABEL || 'A1',
        voucherNo: `ENG${examYear}-${String(enrollment.ERM_ID).padStart(3, '0')}`,
        citizenId: user?.nationalId || '1-1234-12345-12-1',
        testSession: getTestSessionLabel(session),
        profileImage: user?.userImagePath ? getImageUrl(user.userImagePath) : undefined,
        barcodeValue: `ENG${examYear}${String(enrollment.ERM_ID).padStart(5, '0')}`,
      };

      $q.loading.show({
        message: t('exam.voucher.downloading'),
      });

      isDownloadingVoucher.value = true;

      // Wait for DOM to mount offscreen container
      await nextTick();
      // Brief sleep to allow barcode canvas or images to render fully
      await new Promise((resolve) => setTimeout(resolve, 600));
      try {
        const container = document.getElementById('pdf-render-container');
        const cardElement = (container?.querySelector('.voucher-wrapper') ||
          container?.querySelector('.voucher-card')) as HTMLElement | null;

        if (cardElement) {
          const canvas = await html2canvas(cardElement, {
            scale: 3, // very high-quality rendering (600 DPI feel)
            useCORS: true,
            allowTaint: true,
            backgroundColor: null, // transparent backgrounds
          });

          const imgData = canvas.toDataURL('image/png');

          // Calculate the exact size of the card in millimeters (1px = 0.264583mm)
          // We divide by the scale (3) to get the original dimensions
          const pxToMm = 0.264583;
          const widthMm = (canvas.width * pxToMm) / 3;
          const heightMm = (canvas.height * pxToMm) / 3;

          // Create a PDF with the EXACT dimensions of the card
          const pdf = new jsPDF({
            orientation: widthMm > heightMm ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [widthMm, heightMm],
          });

          // Fill the entire PDF page with the image with no margins
          pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
          pdf.save(`BUU-GET_Voucher_${enrollment.ERM_ID}.pdf`);

          $q.notify({
            type: 'positive',
            message: t('exam.voucher.downloadSuccess'),
            position: 'top',
          });
        } else {
          throw new Error('Voucher card element not found');
        }
      } catch (err) {
        console.error(err);
        $q.notify({
          type: 'negative',
          message: t('exam.voucher.downloadError'),
          position: 'top',
        });
      } finally {
        $q.loading.hide();
        isDownloadingVoucher.value = false;
        selectedVoucherData.value = undefined;
      }
    }
  };

  const printReceipt = async (exam: ExamHistoryItem): Promise<void> => {
    const enrollment = exam.rawEnrollment;
    const user = userStore.currentUser;

    if (enrollment && enrollment.SESSION) {
      const session = enrollment.SESSION;
      const examObj = session.EXAM;
      const locationObj = session.LOCATION;

      // Format date nicely to match "15 May 2026"
      let dateStr = '15 May 2026';
      if (examObj?.EXAM_DATE) {
        const d = new Date(examObj.EXAM_DATE);
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
        dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }

      const locationText = locationObj
        ? `${locationObj.LOCATION_NAME}${locationObj.LOCATION_ROOM_NO ? ` (${locationObj.LOCATION_ROOM_NO})` : ''}`
        : 'QS1, Burapha University';

      const transaction = enrollment.TRANSACTION;
      const receipt = transaction?.RECEIPTS?.[0];

      const receiptYear = transaction?.TRANX_PAID_AT
        ? new Date(transaction.TRANX_PAID_AT).getFullYear()
        : examObj?.EXAM_DATE
          ? new Date(examObj.EXAM_DATE).getFullYear()
          : new Date().getFullYear();

      selectedReceiptData.value = {
        receiptNo:
          (receipt?.RC_ID ? `RC${receiptYear}-${String(receipt.RC_ID).padStart(5, '0')}` : '') ||
          `RC${receiptYear}-${String(enrollment.ERM_ID).padStart(5, '0')}`,
        transactionDate: transaction?.TRANX_PAID_AT
          ? new Date(transaction.TRANX_PAID_AT).toISOString()
          : transaction?.TRANX_CREATED_AT
            ? new Date(transaction.TRANX_CREATED_AT).toISOString()
            : new Date().toISOString(),
        fullName:
          receipt?.RC_NAME ||
          (user
            ? `${user.titleEN || ''} ${user.fullNameEN || user.fullNameTH || ''}`.trim()
            : 'Mr. Somdream Jaidee'),
        nationalId: String(receipt?.RC_TAX_ID || user?.nationalId || '1-1234-12345-12-1'),
        address: receipt?.RC_ADDRESS || '169 Longhad Bangsaen Rd, Saen Suk, Chon Buri 20131',
        examName: examObj?.EXAM_NAME || "BUU-GET : Burapha University's Graduate English Test",
        examDate: dateStr,
        location: locationText,
        amount: Number(transaction?.TRANX_AMOUNT ?? examObj?.EXAM_FEE ?? 0),
        paymentMethod: transaction?.TRANX_CHANNEL === 3 ? 'QR' : 'Mobile Banking',
        status: 'SUCCESS',
      };

      $q.loading.show({
        message: t('exam.receipt.downloading'),
      });

      isDownloadingReceipt.value = true;

      // Wait for DOM to mount offscreen container
      await nextTick();
      // Brief sleep to allow elements/watermarks to render fully
      await new Promise((resolve) => setTimeout(resolve, 600));

      try {
        const container = document.getElementById('receipt-render-container');
        const receiptElement = container?.querySelector('.receipt-container') as HTMLElement | null;

        if (receiptElement) {
          const canvas = await html2canvas(receiptElement, {
            scale: 3, // very high-quality rendering (600 DPI feel)
            useCORS: true,
            allowTaint: true,
          });

          const imgData = canvas.toDataURL('image/png');

          // Standard A4 dimensions in PDF: 210mm x 297mm
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          // Fill the entire PDF page with the image with no margins
          pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
          pdf.save(`BUU-GET_Receipt_${enrollment.ERM_ID}.pdf`);

          $q.notify({
            type: 'positive',
            message: t('exam.receipt.downloadSuccess'),
            position: 'top',
          });
        } else {
          throw new Error('Receipt element not found');
        }
      } catch (err) {
        console.error(err);
        $q.notify({
          type: 'negative',
          message: t('exam.receipt.downloadError'),
          position: 'top',
        });
      } finally {
        $q.loading.hide();
        isDownloadingReceipt.value = false;
        selectedReceiptData.value = {
          receiptNo: '',
          transactionDate: '',
          fullName: '',
          nationalId: '',
          examName: '',
          examDate: '',
          location: '',
          amount: 0,
          paymentMethod: '',
          status: 'PENDING',
        };
      }
    }
  };

  return {
    isDownloadingVoucher,
    selectedVoucherData,
    isDownloadingReceipt,
    selectedReceiptData,
    printVoucher,
    printReceipt,
  };
}
