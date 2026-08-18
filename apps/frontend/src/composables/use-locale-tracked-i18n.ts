import { computed, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { i18n as appI18n } from 'src/boot/i18n';

/**
 * vue-i18n `t()` inside computed does not always subscribe to locale changes
 * (especially with i18n.global). Call trackLocale() at the start of those computeds.
 */
export function useLocaleTrackedI18n() {
  const i18n = useI18n();
  const { locale } = i18n;

  const trackLocale = (): void => {
    void locale.value;
  };

  const t: typeof i18n.t = (...args: Parameters<typeof i18n.t>) => {
    void locale.value;
    return i18n.t(...args);
  };

  const te: typeof i18n.te = (...args: Parameters<typeof i18n.te>) => i18n.te(...args);

  const tm: typeof i18n.tm = (...args: Parameters<typeof i18n.tm>) => i18n.tm(...args);

  return { t, te, tm, locale, trackLocale };
}

/** For Pinia stores and composables that must use the global composer. */
export function useGlobalLocaleTrackedI18n() {
  const i18n = appI18n.global;
  const locale = computed(() => unref(i18n.locale));

  const trackLocale = (): void => {
    void locale.value;
  };

  const t: typeof i18n.t = ((...args: Parameters<typeof i18n.t>) => {
    void locale.value;
    return i18n.t(...args);
  }) as typeof i18n.t;

  return {
    t,
    te: (...args: Parameters<typeof i18n.te>) => i18n.te(...args),
    tm: (...args: Parameters<typeof i18n.tm>) => i18n.tm(...args),
    locale,
    trackLocale,
  };
}
