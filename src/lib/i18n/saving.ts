const STORAGE_KEY = 'locale';

export function getSavedLocale() {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveLocale(locale: string) {
  localStorage.setItem(STORAGE_KEY, locale);
}
