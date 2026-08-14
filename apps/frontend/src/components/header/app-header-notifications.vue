<template>
  <div class="app-header-notifications">
    <q-btn
      flat
      dense
      round
      icon="notifications"
      class="app-header-notifications__btn"
      :aria-label="bellAriaLabel"
      aria-haspopup="menu"
      :aria-expanded="menuOpen ? 'true' : 'false'"
    >
      <q-badge
        v-if="unreadCount > 0"
        floating
        rounded
        color="negative"
        class="app-header-notifications__badge"
      >
        {{ unreadLabel }}
      </q-badge>
      <q-tooltip>{{ $t('notifications.menuTitle') }}</q-tooltip>
      <q-menu
        v-model="menuOpen"
        anchor="bottom end"
        self="top end"
        :offset="[0, 8]"
        class="notification-dropdown"
        @show="onMenuShow"
        @hide="onMenuHide"
      >
        <div class="notification-menu">
          <div class="notification-menu__header row items-center justify-between">
            <div class="notification-menu__title">{{ $t('notifications.menuTitle') }}</div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              :disable="unreadCount === 0 || isLoading"
              :label="$t('notifications.markAllRead')"
              @click="onMarkAllRead"
            />
          </div>
          <q-separator />

          <div v-if="isLoading && items.length === 0" class="notification-menu__state">
            {{ $t('notifications.loading') }}
          </div>
          <div v-else-if="error" class="notification-menu__state">
            <div>{{ error }}</div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              class="q-mt-sm"
              :label="$t('notifications.retry')"
              @click="onRetry"
            />
          </div>
          <div v-else-if="items.length === 0" class="notification-menu__state">
            {{ $t('notifications.empty') }}
          </div>
          <q-list v-else class="notification-menu__list">
            <q-item
              v-for="item in items"
              :key="item.id"
              clickable
              v-close-popup
              class="notification-menu__item"
              :class="{ 'notification-menu__item--unread': !item.readAt }"
              @click="onItemClick(item)"
            >
              <q-item-section>
                <q-item-label class="notification-menu__item-title">
                  {{ $t('notifications.dailyPaymentSummary') }}
                </q-item-label>
                <q-item-label caption class="notification-menu__item-body">
                  {{
                    $t('notifications.itemBody', {
                      date: item.payload.periodDate,
                      count: item.payload.paidCount,
                      amount: formatAmount(item.payload.totalAmount),
                    })
                  }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from 'src/stores/notification.store';
import type { FinanceNotification } from 'src/types/notification';

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const menuOpen = ref(false);

const items = computed(() => notificationStore.items);
const unreadCount = computed(() => notificationStore.unreadCount);
const isLoading = computed(() => notificationStore.isLoading);
const error = computed(() => notificationStore.error);

const unreadLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));

const bellAriaLabel = computed(() =>
  unreadCount.value > 0
    ? t('notifications.bellLabelUnread', { n: unreadCount.value })
    : t('notifications.bellLabel'),
);

const formatAmount = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const onMenuShow = (): void => {
  void notificationStore.openMenu();
};

const onMenuHide = (): void => {
  notificationStore.closeMenu();
};

const onRetry = (): void => {
  void notificationStore.refresh(true);
};

const onMarkAllRead = (): void => {
  void notificationStore.markAllRead();
};

const onItemClick = async (item: FinanceNotification): Promise<void> => {
  await notificationStore.markRead(item.id);
  if (item.link) {
    await router.push(item.link);
  }
};

onMounted(() => {
  notificationStore.start();
});
</script>

<style scoped lang="scss">
.app-header-notifications__btn {
  color: var(--text-primary);
}

.app-header-notifications__badge {
  font-size: 10px;
  min-width: 16px;
  padding: 0 4px;
}
</style>

<style lang="scss">
.notification-dropdown {
  border-radius: var(--radius-md) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--neutral-200);
  overflow: hidden;
}

.notification-menu {
  width: min(360px, calc(100vw - 24px));
  background: var(--surface-card);
}

.notification-menu__header {
  padding: 12px 12px 8px 16px;
}

.notification-menu__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.notification-menu__state {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.notification-menu__list {
  max-height: 360px;
  overflow-y: auto;
}

.notification-menu__item {
  min-height: 64px;
}

.notification-menu__item--unread {
  background-color: var(--neutral-50);
}

.notification-menu__item-title {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.notification-menu__item--unread .notification-menu__item-title {
  font-weight: var(--font-weight-semibold);
}

.notification-menu__item-body {
  white-space: normal;
}
</style>
