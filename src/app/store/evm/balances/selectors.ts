import { getEvmAssetRecordKey } from 'lib/utils/evm.utils';

import { useSelector } from '../../root-state.selector';

export const useAllEvmBalancesSelector = () => useSelector(state => state.evmBalances.balancesAtomic);

export const useAccountEvmBalancesSelector = (publicKeyHash: HexString) =>
  useSelector(state => state.evmBalances.balancesAtomic[publicKeyHash]);

export const useAccountEvmTokenBalanceSelector = (publicKeyHash: HexString, assetSlug: string, chainId: number) =>
  useAccountEvmBalancesSelector(publicKeyHash)[getEvmAssetRecordKey(assetSlug, chainId)];
