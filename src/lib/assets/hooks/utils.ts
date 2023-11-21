import type { StoredAssetStatus } from 'app/store/assets/state';

export const getAssetStatus = (
  atomicBalance: string | undefined,
  storedStatus?: StoredAssetStatus
): StoredAssetStatus => storedStatus || (Number(atomicBalance) > 0 ? 'enabled' : 'disabled');
