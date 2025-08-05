import { isEqual } from 'lodash';

import { dispatch } from 'app/store';
import { processLoadedEvmAssetsAction } from 'app/store/evm/assets/actions';
import { processLoadedEvmAssetsBalancesAction } from 'app/store/evm/balances/actions';
import { processLoadedEvmCollectiblesMetadataAction } from 'app/store/evm/collectibles-metadata/actions';
import { processLoadedEvmExchangeRatesAction } from 'app/store/evm/tokens-exchange-rates/actions';
import { processLoadedEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';

import { EtherlinkBalancesResponse } from './get-etherlink-balances';
import { SuccessPayload } from './use-refresh-if-active';

export const makeOnEtherlinkApiSuccess =
  (publicKeyHash: HexString, setLoadingApi?: (chainId: number, isLoading: boolean) => void) =>
  ({ chainId, data, timestamp }: SuccessPayload<EtherlinkBalancesResponse>) => {
    const { balanceItems, nftItems, ...restData } = data;
    dispatch(
      processLoadedEvmTokensMetadataAction({
        chainId,
        data: { ...restData, items: data.balanceItems.filter(({ supports_erc }) => isEqual(supports_erc, ['erc20'])) }
      })
    );
    dispatch(
      processLoadedEvmCollectiblesMetadataAction({
        chainId,
        data: {
          ...restData,
          updated_at: new Date(data.updated_at),
          items: data.nftItems
        }
      })
    );
    const onlyBalancesData = { ...restData, items: data.balanceItems };
    dispatch(processLoadedEvmAssetsAction({ publicKeyHash, chainId, data: onlyBalancesData }));
    dispatch(
      processLoadedEvmAssetsBalancesAction({
        publicKeyHash,
        chainId,
        data: onlyBalancesData
      })
    );
    dispatch(processLoadedEvmExchangeRatesAction({ chainId, data: onlyBalancesData, timestamp }));
    setLoadingApi?.(chainId, false);
  };
