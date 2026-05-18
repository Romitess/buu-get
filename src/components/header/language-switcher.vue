<template>
  <div class="language-switcher">
    <div
      class="language-switcher__option"
      :class="{ 'language-switcher__option--active': locale === 'th' }"
      @click="setLocale('th')"
    >
      TH
    </div>
    <div
      class="language-switcher__option"
      :class="{ 'language-switcher__option--active': locale === 'en-US' }"
      @click="setLocale('en-US')"
    >
      EN
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const setLocale = (newLocale: 'th' | 'en-US'): void => {
  locale.value = newLocale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-locale', newLocale);
  }
};
</script>

<style scoped lang="scss">
.language-switcher {
  display: inline-flex;
  align-items: center;
  background-color: var(--neutral-100, #f3f4f6);
  border-radius: 9999px;
  padding: 2px;
  border: 1px solid var(--border-color, #e5e7eb);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.language-switcher__option {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-secondary, #6b7280);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  user-select: none;
  min-width: 36px;
  letter-spacing: 0.5px;

  &:hover:not(.language-switcher__option--active) {
    color: var(--text-primary, #111827);
    background-color: rgba(0, 0, 0, 0.03);
  }
}

.language-switcher__option--active {
  background-color: var(--primary, #0284c7);
  color: #ffffff !important;
  box-shadow:
    0 1px 3px rgba(2, 132, 199, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
