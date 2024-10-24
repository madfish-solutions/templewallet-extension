import { AUTOLOCK_TIME_STORAGE_KEY } from 'lib/constants';
import { DEFAULT_WALLET_AUTOLOCK_TIME } from 'lib/fixed-times';
import { fetchFromStorage } from 'lib/storage';
import { useStorage } from 'lib/temple/front/storage';

export const getLockUpTimeout = async () =>
  (await fetchFromStorage<number>(AUTOLOCK_TIME_STORAGE_KEY)) ?? DEFAULT_WALLET_AUTOLOCK_TIME;

export const useLockUpTimeout = () => {
  const [newVersionTimeout, setNewVersionTimeout] = useStorage<number>(AUTOLOCK_TIME_STORAGE_KEY);

  return [newVersionTimeout ?? DEFAULT_WALLET_AUTOLOCK_TIME, setNewVersionTimeout] as const;
};
