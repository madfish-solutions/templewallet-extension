import { fetchFromStorage } from 'lib/storage';

export const LOCK_UP_STORAGE_KEY = 'lock_up';
export const DEFAULT_LOCK_UP = true;

export async function getLockUpEnabled() {
  const value = await fetchFromStorage(LOCK_UP_STORAGE_KEY);
  return typeof value === 'boolean' ? value : DEFAULT_LOCK_UP;
}
