export const LOCK_UP_STORAGE_KEY = 'lock_up';
export const DEFAULT_LOCK_UP = true;

export function setLockUp(enabled: boolean) {
  localStorage.setItem(LOCK_UP_STORAGE_KEY, JSON.stringify(enabled));
}

export function isLockUpEnabled() {
  const stored = localStorage.getItem(LOCK_UP_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as boolean) : DEFAULT_LOCK_UP;
}
