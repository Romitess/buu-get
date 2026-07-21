import { ref, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUserStore } from 'src/stores/user.store';
import { getImageUrl } from 'src/services/image.service';
import { fetchEnrollmentById } from 'src/services/exam.service';
import { getRegulations } from 'src/services/exam-rule-voucher.service';

import type { ExamHistoryItem } from 'src/types/exam';
import type { VoucherData } from 'src/types/voucher';
import type { ReceiptData } from 'src/types/receipt';

export function useExamDocuments() {
  const $q = useQuasar();
  const { t } = useI18n();
  const userStore = useUserStore();

  const isDownloadingVoucher = ref(false);
  const selectedVoucherData = ref<VoucherData | undefined>(undefined);
  const selectedVoucherRegulationsEn = ref('');
  const selectedVoucherRegulationsTh = ref('');

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

  const printVoucher = async (exam: ExamHistoryItem): Promise<void> => {
    const cachedEnrollment = exam.rawEnrollment;
    const currentUser = userStore.currentUser;

    if (cachedEnrollment) {
      isDownloadingVoucher.value = true;

      let enrollment = cachedEnrollment;
      try {
        enrollment = await fetchEnrollmentById(cachedEnrollment.ERM_ID);
      } catch (error) {
        console.error(`Failed to refresh enrollment ${cachedEnrollment.ERM_ID}`, error);
      }

      if (!enrollment.SESSION) {
        isDownloadingVoucher.value = false;
        return;
      }

      const session = enrollment.SESSION;
      const examObj = session.EXAM;
      const locationObj =
        enrollment.SESSION_LOCATION?.LOCATION ??
        session.SESSION_LOCATIONS?.find(
          (sessionLocation) => sessionLocation.SL_ID === enrollment.SL_ID,
        )?.LOCATION;

      let dateStr = '-';
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
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '-';

      const locationText = locationObj?.LOCATION_NAME || '-';
      const locationRoom = locationObj?.LOCATION_ROOM_NO || undefined;

      const mapExamTypeToEn = (type?: string): string => {
        if (!type) return '-';
        if (type === 'รอบทั่วไป' || type.toLowerCase() === 'general' || type === 'ทั่วไป')
          return 'General';
        if (type === 'รอบพิเศษ' || type.toLowerCase() === 'special' || type === 'พิเศษ')
          return 'Special';
        return type;
      };

      const profile = enrollment.USER?.PROFILE;
      const enrollmentFullName = profile
        ? `${profile.userTitleEn || ''} ${profile.userFullnameEn || ''}`.trim()
        : '';
      const voucherCode = enrollment.VOUCHERS?.[0]?.VC_CODE || '-';
      const profileImagePath =
        enrollment.USER?.IMAGE?.USER_IMAGE_URL ||
        profile?.userImagePath ||
        currentUser?.userImagePath ||
        undefined;

      try {
        const regulations = await getRegulations();
        selectedVoucherRegulationsEn.value = regulations.regulationsEn || '';
        selectedVoucherRegulationsTh.value = regulations.regulationsTh || '';
      } catch (error) {
        console.error('Failed to load voucher regulations', error);
        selectedVoucherRegulationsEn.value = '';
        selectedVoucherRegulationsTh.value = '';
      }

      selectedVoucherData.value = {
        id: enrollment.ERM_ID,
        fullName: enrollmentFullName || '-',
        studentId: enrollment.ERM_TEST_TAKER || '-',
        examName: examObj?.EXAM_NAME || '-',
        examDate: dateStr,
        examTime: timeRange,
        examType: mapExamTypeToEn(examObj?.EXAM_TYPE),
        location: locationText,
        locationRoom,
        seatNo: enrollment.ERM_SEAT_LABEL || enrollment.LOCATION_SEAT?.LS_SEAT_LABEL || '-',
        voucherNo: voucherCode,
        citizenId:
          enrollment.USER?.USER_NATIONAL_ID ||
          enrollment.USER?.USER_PASSPORT_NO ||
          currentUser?.nationalId ||
          currentUser?.passportNo ||
          '-',
        testSession: examObj?.EXAM_ROUND || '-',
        profileImage: profileImagePath ? getImageUrl(profileImagePath) : undefined,
        barcodeValue: voucherCode,
      };

      await nextTick();
      try {
        const container = document.getElementById('pdf-render-container');
        const cardElement = (container?.querySelector('.voucher-wrapper') ||
          container?.querySelector('.voucher-card')) as HTMLElement | null;

        if (cardElement) {
          await waitForImages(cardElement);

          const canvasScale = 2;
          const canvas = await html2canvas(cardElement, {
            scale: canvasScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.8);

          const pxToMm = 0.264583;
          const widthMm = (canvas.width * pxToMm) / canvasScale;
          const heightMm = (canvas.height * pxToMm) / canvasScale;
          const pdfBleedMm = 1;

          // Create a PDF with the EXACT dimensions of the card
          const pdf = new jsPDF({
            orientation: widthMm > heightMm ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [widthMm + pdfBleedMm * 2, heightMm + pdfBleedMm * 2],
          });

          // Fill the entire PDF page with the image with no margins
          pdf.addImage(
            imgData,
            'JPEG',
            pdfBleedMm,
            pdfBleedMm,
            widthMm,
            heightMm,
            undefined,
            'FAST',
          );
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
        isDownloadingVoucher.value = false;
        selectedVoucherData.value = undefined;
        selectedVoucherRegulationsEn.value = '';
        selectedVoucherRegulationsTh.value = '';
      }
    }
  };

  const printReceipt = async (exam: ExamHistoryItem): Promise<void> => {
    let enrollment = exam.rawEnrollment;
    const user = userStore.currentUser;

    if (enrollment?.ERM_ID && !enrollment.TRANSACTION?.RECEIPTS?.length) {
      try {
        enrollment = await fetchEnrollmentById(enrollment.ERM_ID);
      } catch (error) {
        console.error(`Failed to refresh enrollment ${enrollment.ERM_ID} for receipt`, error);
      }
    }

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
          (enrollment.USER?.PROFILE
            ? `${enrollment.USER.PROFILE.userTitleTh || enrollment.USER.PROFILE.userTitleEn || ''} ${enrollment.USER.PROFILE.userFullnameTh || enrollment.USER.PROFILE.userFullnameEn || ''}`.trim()
            : user
              ? `${user.fullNameTH || user.fullNameEN || ''}`.trim()
              : 'Mr. Somdream Jaidee'),
        nationalId: String(
          receipt?.RC_TAX_ID ||
            enrollment.USER?.USER_NATIONAL_ID ||
            enrollment.USER?.USER_PASSPORT_NO ||
            user?.nationalId ||
            '1-1234-12345-12-1',
        ),
        address:
          receipt?.RC_ADDRESS ||
          enrollment.USER?.PROFILE?.userAddress ||
          user?.address ||
          '169 Longhad Bangsaen Rd, Saen Suk, Chon Buri 20131',
        examName: examObj?.EXAM_NAME || "BUU-GET : Burapha University's Graduate English Test",
        examDate: dateStr,
        location: locationText,
        amount: Number(transaction?.TRANX_AMOUNT ?? examObj?.EXAM_FEE ?? 0),
        paymentMethod: transaction?.TRANX_CHANNEL === 3 ? 'QR' : 'Mobile Banking',
        status: 'SUCCESS',
      };

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
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.8);

          // Standard A4 dimensions in PDF: 210mm x 297mm
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          // Fill the entire PDF page with the image with no margins
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
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
    selectedVoucherRegulationsEn,
    selectedVoucherRegulationsTh,
    isDownloadingReceipt,
    selectedReceiptData,
    printVoucher,
    printReceipt,
  };
}
