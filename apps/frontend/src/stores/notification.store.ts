import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref } from 'vue';
import { Notify } from 'quasar';
import { i18n as appI18n } from 'src/boot/i18n';
import { ROLES } from 'src/constants/roles';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from 'src/services/notification.service';
import { useUserStore } from 'src/stores/user.store';
import type { FinanceNotification } from 'src/types/notification';

const POLL_INTERVAL_MS = 60_000;
const LIST_LIMIT = 20;

export const useNotificationStore = defineStore('notification', () => {
  const i18n = appI18n.global;
  const userStore = useUserStore();

  const items = ref<FinanceNotification[]>([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isMenuOpen = ref(false);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let started = false;
  let inFlight: Promise<void> | null = null;

  const isFinanceOfficer = computed(() => userStore.hasEffectiveRole(ROLES.FINANCE));

  const toastedStorageKey = (): string =>
    `ntf:last-toasted:${userStore.currentUser?.id ?? 'anon'}`;

  const getLastToastedId = (): number => {
    const parsed = Number(sessionStorage.getItem(toastedStorageKey()));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const setLastToastedId = (id: number): void => {
    sessionStorage.setItem(toastedStorageKey(), String(id));
  };

  const formatAmount = (value: number): string =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const toastIfNew = (list: FinanceNotification[]): void => {
    const newestUnread = list.find((item) => item.readAt === null);
    if (!newestUnread || newestUnread.payload.paidCount <= 0) {
      return;
    }
    if (newestUnread.id <= getLastToastedId()) {
      return;
    }

    const notifyOptions: {
      type: string;
      position: 'top';
      timeout: number;
      message: string;
      actions?: { label: string; color: 'white'; handler: () => void }[];
    } = {
      type: 'info',
      position: 'top',
      timeout: 8000,
      message: i18n.t('notifications.toastMessage', {
        date: newestUnread.payload.periodDate,
        count: newestUnread.payload.paidCount,
        amount: formatAmount(newestUnread.payload.totalAmount),
      }),
    };
    if (newestUnread.link) {
      notifyOptions.actions = [
        {
          label: i18n.t('notifications.viewReport'),
          color: 'white',
          handler: () => {
            window.location.hash = newestUnread.link ?? '';
          },
        },
      ];
    }
    Notify.create(notifyOptions);
    setLastToastedId(newestUnread.id);
  };

  const refresh = async (withList: boolean): Promise<void> => {
    if (!isFinanceOfficer.value || !userStore.isLoggedIn) {
      return;
    }
    if (inFlight) {
      return inFlight;
    }

    inFlight = (async () => {
      isLoading.value = true;
      error.value = null;
      try {
        unreadCount.value = await fetchUnreadNotificationCount();
        if (withList || unreadCount.value > 0) {
          const result = await fetchNotifications(1, LIST_LIMIT);
          items.value = result.data;
          toastIfNew(result.data);
        }
      } catch {
        error.value = i18n.t('notifications.loadError');
      } finally {
        isLoading.value = false;
      }
    })().finally(() => {
      inFlight = null;
    });

    return inFlight;
  };

  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      void refresh(isMenuOpen.value);
    }
  };

  const start = (): void => {
    if (started || !isFinanceOfficer.value) {
      return;
    }
    started = true;
    void refresh(false);
    pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh(isMenuOpen.value);
      }
    }, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
  };

  const stop = (): void => {
    started = false;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
    items.value = [];
    unreadCount.value = 0;
    error.value = null;
    isMenuOpen.value = false;
  };

  const openMenu = async (): Promise<void> => {
    isMenuOpen.value = true;
    await refresh(true);
  };

  const closeMenu = (): void => {
    isMenuOpen.value = false;
  };

  const markRead = async (id: number): Promise<FinanceNotification | null> => {
    const current = items.value.find((item) => item.id === id);
    const wasUnread = current?.readAt === null;
    try {
      const updated = await markNotificationRead(id);
      items.value = items.value.map((item) => (item.id === id ? updated : item));
      if (wasUnread && updated.readAt) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      return updated;
    } catch {
      error.value = i18n.t('notifications.loadError');
      return null;
    }
  };

  const markAllRead = async (): Promise<void> => {
    try {
      await markAllNotificationsRead();
      items.value = items.value.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      }));
      unreadCount.value = 0;
    } catch {
      error.value = i18n.t('notifications.loadError');
    }
  };

  return {
    items,
    unreadCount,
    isLoading,
    error,
    isFinanceOfficer,
    start,
    stop,
    refresh,
    openMenu,
    closeMenu,
    markRead,
    markAllRead,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationStore, import.meta.hot));
}
