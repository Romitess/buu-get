import { ref } from 'vue';

const STORAGE_KEY = 'exam-prep-guide-seen';

type PrepGuideSeenMap = Record<string, boolean>;

const seenMap = ref<PrepGuideSeenMap>(readSeenMap());

function readSeenMap(): PrepGuideSeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: PrepGuideSeenMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === true) {
        result[key] = true;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writeSeenMap(map: PrepGuideSeenMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function toKey(ermId: number): string {
  return String(ermId);
}

export function useExamPrepGuide() {
  const isUnread = (ermId: number): boolean => {
    return seenMap.value[toKey(ermId)] !== true;
  };

  const markSeen = (ermId: number): void => {
    const key = toKey(ermId);
    if (seenMap.value[key] === true) {
      return;
    }
    const next: PrepGuideSeenMap = { ...seenMap.value, [key]: true };
    seenMap.value = next;
    writeSeenMap(next);
  };

  const refreshFromStorage = (): void => {
    seenMap.value = readSeenMap();
  };

  return {
    isUnread,
    markSeen,
    refreshFromStorage,
  };
}
