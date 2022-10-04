import { fetchFromStorage, putToStorage } from 'lib/storage';

const STORAGE_KEY = 'locale';

export function getSavedLocale() {
  return localStorage.getItem(STORAGE_KEY);
}

export async function saveLocale(locale: string) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    return await asyncSaveLocale(locale);
  } catch {}
  return;
}

export async function asyncGetSavedLocale() {
  return await fetchFromStorage<string>(STORAGE_KEY);
}

async function asyncSaveLocale(locale: string) {
  return putToStorage(STORAGE_KEY, locale);
}
