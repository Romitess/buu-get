import { ref } from 'vue';
import { fetchExecutiveTestTakers } from 'src/services/executive-test-taker.service';
import type { ExecutiveTestTakerRow } from 'src/types/executive-test-taker.types';

export function useExecutiveTestTakers() {
  const rows = ref<ExecutiveTestTakerRow[]>([]);
  const total = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchRows = async (page: number, limit: number, search?: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetchExecutiveTestTakers({
        page,
        limit,
        ...(search ? { search } : {}),
      });
      rows.value = response.data;
      total.value = response.total;
    } catch {
      rows.value = [];
      total.value = 0;
      error.value = 'ไม่สามารถโหลดข้อมูลผู้เข้าสอบได้';
    } finally {
      isLoading.value = false;
    }
  };

  return { rows, total, isLoading, error, fetchRows };
}
