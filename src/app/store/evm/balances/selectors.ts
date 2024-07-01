import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { useSelector } from '../../root-state.selector';

import { AssetSlugBalanceRecord, ChainIdTokenSlugsBalancesRecord } from './state';

export const useRawEvmAccountBalancesSelector = (publicKeyHash: HexString): ChainIdTokenSlugsBalancesRecord =>
  useSelector(state => state.evmBalances.balancesAtomic[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

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
