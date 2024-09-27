import { AUTOLOCK_TIME_STORAGE_KEY } from 'lib/constants';
import { DEFAULT_LOCK_UP_ENABLED, DEFAULT_WALLET_AUTOLOCK_TIME } from 'lib/fixed-times';
import { fetchFromStorage } from 'lib/storage';
import { useStorage } from 'lib/temple/front';
import { TempleSharedStorageKey } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

const LEGACY_STORAGE_KEY = TempleSharedStorageKey.LockUpEnabled;

export const getLockUpTimeout = async () => {
  const newVersionTimeout = await fetchFromStorage<number>(AUTOLOCK_TIME_STORAGE_KEY);

  if (newVersionTimeout) {
    return newVersionTimeout;
  }

  const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);

  return legacyStored === String(DEFAULT_LOCK_UP_ENABLED) || legacyStored === null
    ? DEFAULT_WALLET_AUTOLOCK_TIME
    : Infinity;
};

export const useLockUpTimeout = () => {
  const [newVersionTimeout, setNewVersionTimeout] = useStorage<number>(AUTOLOCK_TIME_STORAGE_KEY);
  const [legacyIsLockup] = useLocalStorage(LEGACY_STORAGE_KEY, DEFAULT_LOCK_UP_ENABLED);

  const lockUpTimeout = newVersionTimeout ?? (legacyIsLockup ? DEFAULT_WALLET_AUTOLOCK_TIME : Infinity);

  return [lockUpTimeout, setNewVersionTimeout] as const;
};
