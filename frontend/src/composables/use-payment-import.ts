import { computed, onMounted, ref } from 'vue';
import {
  clearBankReconciles,
  fetchBankReconciles,
  importBankReconcileFile,
  verifyBankReconciles,
  type BackendBankReconcile,
  type BankReconcileImportResponse,
} from 'src/services/bank-reconcile.service';

/** Row shape for the payment import table */
export interface PaymentImportRow {
  index: number;
  applicantId: string;
  referenceNo: string;
  payerName: string;
  paymentDate: string;
  paymentTime: string;
  amount: string;
  importedAt: string;
  importedBy: string;
}

export const globalImportedRows = ref<PaymentImportRow[]>([]);
export const globalSelectedFile = ref<File | null>(null);

/**
 * Composable for the "นำเข้าไฟล์การชำระเงิน" page.
 * Handles import API calls and table state.
 */
export function usePaymentImport() {
  const importedRows = globalImportedRows;
  const selectedFile = globalSelectedFile;

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const skippedRows = ref(0);

  // คณะ/ส่วนงาน: สำนักคอมพิวเตอร์ (82994)
  const departmentLabel = ref('สำนักคอมพิวเตอร์ (82994)');

  const filteredRows = computed((): PaymentImportRow[] => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return importedRows.value;
    return importedRows.value.filter(
      (row) =>
        row.applicantId.toLowerCase().includes(q) ||
        row.referenceNo.toLowerCase().includes(q) ||
        row.payerName.toLowerCase().includes(q) ||
        row.amount.toLowerCase().includes(q),
    );
  });

  const totalCount = computed((): number => importedRows.value.length);

  const hasEmptyRows = computed((): boolean => {
    return (
      skippedRows.value > 0 ||
      importedRows.value.some((row) => !row.applicantId.trim() || !row.amount.trim())
    );
  });

  const loadData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const reconciles = await fetchBankReconciles();
      importedRows.value = reconciles.map(mapBankReconcileToRow);
      skippedRows.value = 0;
    } catch (err) {
      console.error('Failed to load payment imports:', err);
      error.value = 'ไม่สามารถโหลดข้อมูลนำเข้าได้';
    } finally {
      isLoading.value = false;
    }
  };

  const parseFile = async (file: File): Promise<BankReconcileImportResponse | void> => {
    isLoading.value = true;
    error.value = null;
    selectedFile.value = file;

    console.log('[DEBUG] parseFile started with file:', file.name);

    try {
      console.log('[DEBUG] Calling importBankReconcileFile...');
      const result = await importBankReconcileFile(file);
      console.log('[DEBUG] Import result:', result);
      importedRows.value = result.data.map(mapBankReconcileToRow);
      skippedRows.value = result.skipped;
      console.log('[DEBUG] parseFile success! Rows:', importedRows.value.length);
      return result;
    } catch (err) {
      console.error('[ERROR] Failed to import payment file:', err);
      error.value =
        err instanceof Error ? err.message : 'ไม่สามารถนำเข้าไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์';
      selectedFile.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const clearAllData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      await clearBankReconciles();
      importedRows.value = [];
      selectedFile.value = null;
      skippedRows.value = 0;
      searchQuery.value = '';
    } catch (err) {
      console.error('Failed to clear payment imports:', err);
      error.value = 'ไม่สามารถลบข้อมูลได้';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const verifyData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const reconciles = await verifyBankReconciles();
      importedRows.value = reconciles.map(mapBankReconcileToRow);
      skippedRows.value = 0;
    } catch (err) {
      console.error('Verification failed:', err);
      error.value = 'การตรวจสอบข้อมูลล้มเหลว';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    void loadData();
  });

  return {
    importedRows,
    filteredRows,
    isLoading,
    error,
    searchQuery,
    selectedFile,
    departmentLabel,
    totalCount,
    hasEmptyRows,
    loadData,
    parseFile,
    clearAllData,
    verifyData,
  };
}

function mapBankReconcileToRow(item: BackendBankReconcile, index: number): PaymentImportRow {
  return {
    index: index + 1,
    applicantId: item.BR_REF1 ?? '',
    referenceNo: item.BR_REF2 ?? '',
    payerName: item.BR_PAID_BY ?? '',
    paymentDate: item.BR_REF3 ?? '-',
    paymentTime: item.BR_REF4 ?? '-',
    amount: formatAmount(item.BR_AMOUNT),
    importedAt: item.CREATED_AT ? formatImportDate(new Date(item.CREATED_AT)) : '-',
    importedBy: item.USER?.PROFILE?.userFullnameTh || item.USER?.USER_EMAIL || String(item.CREATED_BY),
  };
}

function formatAmount(value: number | string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '';
  }
  return amount.toFixed(2);
}

function formatImportDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const pad = (n: number): string => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear() + 543;
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
