export const STORAGE_KEY = 'locale';

export function getSavedLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {}
  return null;
}

export function saveLocale(locale: string) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}
