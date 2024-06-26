import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { useSelector } from '../../root-state.selector';

import { AssetSlugBalanceRecord } from './state';

export const useRawEvmChainAccountBalancesSelector = (
  publicKeyHash: HexString,
  chainId: number
): AssetSlugBalanceRecord =>
  useSelector(state => state.evmBalances.balancesAtomic[publicKeyHash]?.[chainId]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmAssetBalanceSelector = (
  publicKeyHash: HexString,
  chainId: number,
  assetSlug: string
): string | undefined => useSelector(state => state.evmBalances.balancesAtomic[publicKeyHash]?.[chainId])?.[assetSlug];
