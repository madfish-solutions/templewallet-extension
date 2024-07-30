import { isDefined } from '@rnw-community/shared';

import type { StoredAssetStatus } from 'app/store/tezos/assets/state';
import { ALL_PREDEFINED_METADATAS_RECORD } from 'lib/assets/known-tokens';
import { isTruthy } from 'lib/utils';

const isPredefinedAsset = (assetSlug?: string) =>
  isTruthy(assetSlug) && isDefined(ALL_PREDEFINED_METADATAS_RECORD[assetSlug]);

export const isAssetStatusIdle = (storedStatus?: StoredAssetStatus): storedStatus is undefined | 'idle' =>
  !storedStatus || storedStatus === 'idle';

export const getAssetStatus = (
  atomicBalance: string | undefined,
  storedStatus?: StoredAssetStatus,
  assetSlug?: string
): Exclude<StoredAssetStatus, 'idle'> => {
  if (isAssetStatusIdle(storedStatus))
    return Number(atomicBalance) > 0 || isPredefinedAsset(assetSlug) ? 'enabled' : 'disabled';

  return storedStatus;
};
