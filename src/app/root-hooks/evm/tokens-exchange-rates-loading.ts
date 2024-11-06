import { memo } from 'react';

import { dispatch } from 'app/store';
import { setEvmTokensExchangeRatesLoading } from 'app/store/evm/actions';
import { useEvmTokensExchangeRatesLoadingSelector } from 'app/store/evm/selectors';
import { processLoadedEvmExchangeRatesAction } from 'app/store/evm/tokens-exchange-rates/actions';
import { getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { RATES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useEnabledEvmChains } from 'temple/front';

/** Note: Rates are updated only for the given account's tokens */
export const AppEvmTokensExchangeRatesLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const evmChains = useEnabledEvmChains();
  const isLoading = useEvmTokensExchangeRatesLoadingSelector();

  const apiSupportedChainIds = useMemoWithCompare(
    () => evmChains.map(({ chainId }) => (isSupportedChainId(chainId) ? chainId : null)).filter(isTruthy),
    [evmChains]
  );

  useInterval(
    () => {
      if (isLoading) return;

      dispatch(setEvmTokensExchangeRatesLoading(true));

      Promise.allSettled(
        apiSupportedChainIds.map(async chainId => {
          const data = await getEvmTokensMetadata(publicKeyHash, chainId);

          dispatch(processLoadedEvmExchangeRatesAction({ chainId, data }));
        })
      ).then(() => void dispatch(setEvmTokensExchangeRatesLoading(false)));
    },
    [apiSupportedChainIds, publicKeyHash],
    RATES_SYNC_INTERVAL
  );

  return null;
});
