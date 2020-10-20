export const STORAGE_KEY = "locale";

export function getSavedLocale() {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveLocale(locale: string) {
  return localStorage.setItem(STORAGE_KEY, locale);
}
