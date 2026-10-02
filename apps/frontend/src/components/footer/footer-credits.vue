<template>
  <div
    class="footer-credits row justify-between items-center q-pa-md text-center text-sm-left"
    :class="`footer-credits--${variant}`"
  >
    <div class="col-12 col-sm-auto text-weight-medium q-mb-xs q-mb-sm-none">
      Crafted by the computer center of Burapha University
    </div>
    <div class="col-12 col-sm-auto footer-credits__meta">
      <router-link
        v-if="showPrivacyNotice"
        :to="{ name: 'privacy-notice' }"
        class="privacy-notice-btn"
      >
        {{ t('privacyNotice.button') }}
      </router-link>
      <span class="text-caption opacity-80">
        &copy; {{ currentYear }} Copyright All Right Reserved.
        <span v-if="appVersion"> · {{ appVersion }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    variant?: 'primary' | 'white';
    showPrivacyNotice?: boolean;
  }>(),
  {
    variant: 'primary',
    showPrivacyNotice: false,
  },
);

const { t } = useI18n();

const currentYear = computed(() => new Date().getFullYear());
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION?.trim() || '');
</script>

<style scoped lang="scss">
.footer-credits {
  transition: var(--transition-smooth);

  &--primary {
    background-color: var(--primary);
    color: var(--text-on-primary);
  }

  &--white {
    background-color: var(--surface-card);
    color: var(--text-primary);
    border-top: 1px solid var(--border-color);
  }
}

.footer-credits__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  @media (min-width: 600px) {
    flex-direction: row;
    justify-content: flex-end;
    gap: 12px;
  }
}

.privacy-notice-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid currentColor;
  border-radius: 999px;
  color: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: rgba(30, 137, 229, 0.1);
  }
}

.opacity-80 {
  opacity: 0.8;
}
</style>
