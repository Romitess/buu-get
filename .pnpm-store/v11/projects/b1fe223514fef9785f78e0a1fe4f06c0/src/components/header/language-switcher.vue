<template>
  <div class="language-switcher">
    <div
      class="language-switcher__slider"
      :class="locale === 'th' ? 'slider--left' : 'slider--right'"
    ></div>
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
  position: relative;
}

.language-switcher__slider {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: calc(50% - 2px);
  background-color: var(--primary, #0284c7);
  border-radius: 9999px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 1px 3px rgba(2, 132, 199, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.08);
  z-index: 1;
}

.slider--left {
  transform: translateX(0);
}

.slider--right {
  transform: translateX(100%);
}

.language-switcher__option {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-secondary, #6b7280);
  border-radius: 9999px;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  user-select: none;
  min-width: 36px;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 2;

  &:hover:not(.language-switcher__option--active) {
    color: var(--text-primary, #111827);
  }
}

.language-switcher__option--active {
  color: #ffffff !important;
}
</style>
