import type { StoredAssetStatus } from 'app/store/assets/state';

export const isAssetStatusIdle = (storedStatus?: StoredAssetStatus): storedStatus is undefined | 'idle' =>
  !storedStatus || storedStatus === 'idle';

export const getAssetStatus = (
  atomicBalance: string | undefined,
  storedStatus?: StoredAssetStatus
): Exclude<StoredAssetStatus, 'idle'> => {
  if (isAssetStatusIdle(storedStatus)) return Number(atomicBalance) > 0 ? 'enabled' : 'disabled';

  return storedStatus;
};
