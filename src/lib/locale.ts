export const LOCALE_STORAGE_KEY = "oxygen-pricing-locale";

export type AppLocale = "zh" | "en";

export function getInitialLocale(defaultLocale: AppLocale = "en"): AppLocale {
  if (typeof window === "undefined") return defaultLocale;

  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === "zh" || saved === "en" ? saved : defaultLocale;
}

export function persistLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
