const STORAGE_KEY = 'lock_up';
const DEFAULT_VALUE = true;

export function getIsLockUpEnabled() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored == null ? DEFAULT_VALUE : stored === 'true';
}

export function saveIsLockUpEnabled(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value));
}
