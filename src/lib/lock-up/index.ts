import { TempleSharedStorageKey } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

const STORAGE_KEY = TempleSharedStorageKey.LockUpEnabled;
const DEFAULT_VALUE = true;

export const getIsLockUpEnabled = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? stored === 'true' : DEFAULT_VALUE;
};

// TODO: remove this comment while making 'Security' settings section
// @ts-prune-ignore-next
export const useIsLockUpEnabled = () => useLocalStorage(STORAGE_KEY, DEFAULT_VALUE);
