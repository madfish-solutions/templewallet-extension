import { STORAGE_KEY, DEFAULT_VALUE, saveIsLockUpEnabled } from 'lib/lock-up';
import { useStorage } from 'lib/temple/front';

export function useIsLockUpEnabled() {
  return useStorage<boolean>(STORAGE_KEY, DEFAULT_VALUE);
}

// Migration

migrateFromLocalStorage();

/**
 * Relevant for updates from v1.14.13
 */
async function migrateFromLocalStorage() {
  const stored = localStorage.getItem('lock_up');
  if (stored == null) return;
  await saveIsLockUpEnabled(stored === 'true');
  localStorage.removeItem('lock_up');
}
