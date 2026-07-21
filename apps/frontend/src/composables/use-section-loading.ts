import { ref } from 'vue';

export function useSectionLoading() {
  const isSectionLoading = ref(false);

  const withSectionLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    isSectionLoading.value = true;
    try {
      return await fn();
    } finally {
      isSectionLoading.value = false;
    }
  };

  return {
    isSectionLoading,
    withSectionLoading,
  };
}
