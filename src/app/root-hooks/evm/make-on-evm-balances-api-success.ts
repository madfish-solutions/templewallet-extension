import { dispatch } from 'app/store';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import { processLoadedEvmAssetsBalancesAction } from 'app/store/evm/balances/actions';
import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmNetworkEssentials } from 'temple/networks';

import { SuccessPayload } from './use-refresh-if-active';

export type ManualAssets = Record<number, { network: EvmNetworkEssentials; assetsSlugs: string[] }>;

export const makeOnEvmBalancesApiSuccess =
  (
    publicKeyHash: HexString,
    manualAssetsByChainId: ManualAssets = {},
    setLoadingApi?: (chainId: number, value: boolean) => void
  ) =>
  ({ chainId, data }: SuccessPayload<BalancesResponse>) => {
    dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data }));
    dispatch(
      processLoadedEvmAssetsBalancesAction({
        publicKeyHash,
        chainId,
        data,
        assetsToPreventBalanceErase: manualAssetsByChainId[chainId]?.assetsSlugs
      })
    );
    setLoadingApi?.(chainId, false);
  };
