import { fetchFromStorage, putToStorage } from './storage';

const STORAGE_KEY = 'settings:lock-up-enabled';
const DEFAULT_VALUE = true;

export { STORAGE_KEY, DEFAULT_VALUE };

export async function getIsLockUpEnabled() {
  const value = await fetchFromStorage<boolean>(STORAGE_KEY);
  return value == null ? DEFAULT_VALUE : value;
}

export function saveIsLockUpEnabled(value: boolean) {
  return putToStorage(STORAGE_KEY, value);
}
