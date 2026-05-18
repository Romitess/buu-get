import { ref, computed } from 'vue';
import { useUserStore } from 'src/stores/user.store';

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

/**
 * Composable for the "นำเข้าไฟล์การชำระเงิน" page.
 * Handles CSV/Excel file parsing and local state management.
 */
export function usePaymentImport() {
  const userStore = useUserStore();

  // State
  const importedRows = ref<PaymentImportRow[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const selectedFile = ref<File | null>(null);

  // คณะ/ส่วนงาน: สำนักคอมพิวเตอร์ (82994)
  const departmentLabel = ref('สำนักคอมพิวเตอร์ (82994)');

  const currentUserName = computed(() => {
    const user = userStore.currentUser;
    if (!user) return 'ไม่ระบุชื่อ';
    return user.fullNameTH || user.fullNameEN || user.email || 'ไม่ระบุชื่อ';
  });

  // Derived: search-filtered rows
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

  // Total row count
  const totalCount = computed((): number => importedRows.value.length);

  /**
   * Parse the uploaded CSV file into PaymentImportRow[].
   * Expects columns: applicantId (Ref1), referenceNo (Ref2), payerName,
   * paymentDate, paymentTime, amount
   */
  const parseFile = async (file: File): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    selectedFile.value = file;

    try {
      const text = await file.text();
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Skip the header row (first line)
      const dataLines = lines.slice(1);
      const now = new Date();
      const importTimestamp = formatImportDate(now);

      const parsed = dataLines.map((line, idx): PaymentImportRow => {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        return {
          index: idx + 1,
          applicantId: cols[0] || '-',
          referenceNo: cols[1] || '-',
          payerName: cols[2] || '-',
          paymentDate: cols[3] || '-',
          paymentTime: cols[4] || '-',
          amount: cols[5] || '0.00',
          importedAt: importTimestamp,
          importedBy: currentUserName.value,
        };
      });

      for (const row of parsed) {
        if (row.applicantId.length > 20) {
          throw new Error(
            `Ref 1 (รหัสผู้สมัคร) "${row.applicantId}" ในแถวที่ ${row.index} มีความยาวเกิน 20 ตัวอักษร (สูงสุด 20 ตัวอักษร)`,
          );
        }
        if (row.referenceNo.length > 20) {
          throw new Error(
            `Ref 2 (เลขที่อ้างอิง) "${row.referenceNo}" ในแถวที่ ${row.index} มีความยาวเกิน 20 ตัวอักษร (สูงสุด 20 ตัวอักษร)`,
          );
        }
      }

      importedRows.value = parsed;
    } catch (err) {
      console.error('Failed to parse payment file:', err);
      error.value =
        err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์';
      importedRows.value = [];
      selectedFile.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  /** Clear all imported data */
  const clearAllData = (): void => {
    importedRows.value = [];
    selectedFile.value = null;
    error.value = null;
  };

  /** Verify imported data (placeholder for API call) */
  const verifyData = (): void => {
    isLoading.value = true;
    try {
      // TODO: Call backend API to verify/submit payment data
      // await paymentService.verifyImportedPayments(importedRows.value);
      console.log('Verifying data:', importedRows.value.length, 'records');
    } catch (err) {
      console.error('Verification failed:', err);
      error.value = 'การตรวจสอบข้อมูลล้มเหลว';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    importedRows,
    filteredRows,
    isLoading,
    error,
    searchQuery,
    selectedFile,
    departmentLabel,
    totalCount,
    parseFile,
    clearAllData,
    verifyData,
  };
}

// ── Helpers ───────────────────────────────────────────────
function formatImportDate(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear() + 543; // Buddhist era
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
