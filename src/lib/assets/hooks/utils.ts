import type { StoredAssetStatus } from 'app/store/assets/state';

export const getAssetStatus = (
  atomicBalance: string | undefined,
  storedStatus?: StoredAssetStatus
): Exclude<StoredAssetStatus, 'idle'> => {
  if (!storedStatus || storedStatus === 'idle') return Number(atomicBalance) > 0 ? 'enabled' : 'disabled';

  return storedStatus;
};
