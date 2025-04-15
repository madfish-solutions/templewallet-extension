import { useSelector } from 'app/store/root-state.selector';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { AssetSlugBalanceRecord, ChainIdTokenSlugsBalancesRecord } from './state';

export const useRawEvmAccountBalancesSelector = (publicKeyHash: HexString): ChainIdTokenSlugsBalancesRecord =>
  useSelector(state => state.evmBalances.balancesAtomic[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

export const useEvmAccountBalancesTimestampsSelector = (publicKeyHash: HexString) =>
  useSelector(state => state.evmBalances.dataTimestamps[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmChainAccountBalancesSelector = (
  accountAddress: HexString,
  chainId: number
): AssetSlugBalanceRecord =>
  useSelector(state => state.evmBalances.balancesAtomic[accountAddress]?.[chainId]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmAssetBalanceSelector = (
  accountAddress: HexString,
  chainId: number,
  assetSlug: string
): string | undefined => useSelector(state => state.evmBalances.balancesAtomic[accountAddress]?.[chainId])?.[assetSlug];
