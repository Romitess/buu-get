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
  brId: number;
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

const autoLoadSuspendedStorageKey = 'payment-import:auto-load-suspended';

const readAutoLoadSuspended = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(autoLoadSuspendedStorageKey) === 'true';
  } catch (err) {
    console.warn('Unable to read payment import auto-load state:', err);
    return false;
  }
};

const persistAutoLoadSuspended = (value: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value) {
      window.sessionStorage.setItem(autoLoadSuspendedStorageKey, 'true');
    } else {
      window.sessionStorage.removeItem(autoLoadSuspendedStorageKey);
    }
  } catch (err) {
    console.warn('Unable to persist payment import auto-load state:', err);
  }
};

const isAutoLoadSuspended = ref(readAutoLoadSuspended());

const setAutoLoadSuspended = (value: boolean): void => {
  isAutoLoadSuspended.value = value;
  persistAutoLoadSuspended(value);
};

export const clearPaymentImportLocalData = (
  options: { skipNextLoad?: boolean; suspendAutoLoad?: boolean } = {},
): void => {
  globalImportedRows.value = [];
  globalSelectedFile.value = null;
  if (options.skipNextLoad || options.suspendAutoLoad) {
    setAutoLoadSuspended(true);
  }
};

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

  const clearLocalData = (): void => {
    clearPaymentImportLocalData();
    skippedRows.value = 0;
    searchQuery.value = '';
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
      if (result.imported > 0) {
        setAutoLoadSuspended(false);
        importedRows.value = result.data.map(mapBankReconcileToRow);
      } else {
        setAutoLoadSuspended(true);
        importedRows.value = [];
      }
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
      clearLocalData();
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
      const currentImportedIds = new Set(
        importedRows.value.map((row) => row.brId).filter((brId) => brId > 0),
      );
      const reconciles = await verifyBankReconciles();
      const currentReconciles =
        currentImportedIds.size > 0
          ? reconciles.filter((reconcile) => currentImportedIds.has(reconcile.BR_ID))
          : reconciles;
      importedRows.value = currentReconciles.map(mapBankReconcileToRow);
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
    if (isAutoLoadSuspended.value) {
      clearLocalData();
      return;
    }

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
    clearLocalData,
    clearAllData,
    verifyData,
  };
}

function mapBankReconcileToRow(item: BackendBankReconcile, index: number): PaymentImportRow {
  return {
    brId: item.BR_ID,
    index: index + 1,
    applicantId: item.BR_REF1 ?? '',
    referenceNo: item.BR_REF2 ?? '',
    payerName: item.BR_PAID_BY ?? '',
    paymentDate: item.BR_REF3 ?? '-',
    paymentTime: item.BR_REF4 ?? '-',
    amount: formatAmount(item.BR_AMOUNT),
    importedAt: item.CREATED_AT ? formatImportDate(new Date(item.CREATED_AT)) : '-',
    importedBy:
      item.USER?.PROFILE?.userFullnameTh || item.USER?.USER_EMAIL || String(item.CREATED_BY),
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
