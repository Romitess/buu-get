import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { isRequestCanceled } from 'src/services/exam.service';

export interface RouteResourceFetcherContext {
  signal: AbortSignal;
  params: Record<string, string>;
}

export interface UseRouteResourceOptions<T> {
  owningParams: readonly string[];
  fetcher: (ctx: RouteResourceFetcherContext) => Promise<T>;
}

/**
 * โหลด resource ตาม route.name + params ที่เป็นเจ้าของ
 * เปลี่ยน key แล้ว abort request เดิม
 */
export function useRouteResource<T>(options: UseRouteResourceOptions<T>) {
  const route = useRoute();
  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  let abortController: AbortController | null = null;

  const resourceKey = computed(() => {
    const parts = [String(route.name ?? '')];
    for (const key of options.owningParams) {
      const raw = route.params[key];
      parts.push(Array.isArray(raw) ? (raw[0] ?? '') : String(raw ?? ''));
    }
    return parts.join(':');
  });

  const paramMap = (): Record<string, string> => {
    const params: Record<string, string> = {};
    for (const key of options.owningParams) {
      const raw = route.params[key];
      params[key] = Array.isArray(raw) ? (raw[0] ?? '') : String(raw ?? '');
    }
    return params;
  };

  const reload = async (): Promise<void> => {
    abortController?.abort();
    abortController = new AbortController();
    const { signal } = abortController;
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await options.fetcher({ signal, params: paramMap() });
    } catch (err) {
      if (isRequestCanceled(err) || signal.aborted) return;
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
      }
    }
  };

  watch(resourceKey, () => {
    void reload();
  }, { immediate: true });

  onBeforeUnmount(() => {
    abortController?.abort();
  });

  return {
    data,
    isLoading,
    error,
    reload,
    resourceKey,
  };
}
