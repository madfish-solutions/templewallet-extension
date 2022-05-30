export const STORAGE_KEY = 'fiat_currency';

export function getSavedFiatCurrency() {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveFiatCurrency(fiatCurrency: string) {
  return localStorage.setItem(STORAGE_KEY, fiatCurrency);
}
