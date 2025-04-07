import { useCallback, useEffect } from 'react';

import { ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { t } from 'lib/i18n';
import { useWindowIsActive } from 'lib/temple/front/window-is-active-context';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { serializeError } from 'lib/utils/serialize-error';
import { useEnabledEvmChains } from 'temple/front';

export interface SuccessPayload<T> {
  chainId: number;
  data: T;
  timestamp: number;
}

export interface ErrorPayload {
  chainId: number;
  error: string;
  timestamp: number;
}

interface RefreshIfActiveConfig<T> {
  getDataTimestamp: SyncFn<ChainID, number>;
  isLoading: SyncFn<number, boolean>;
  publicKeyHash: string;
  /** This function is not triggered on getting new data or error */
  setLoading: (chainId: number, isLoading: boolean) => void;
  getData: (publicKeyHash: string, chainId: ChainID) => Promise<T>;
  handleSuccess: SyncFn<SuccessPayload<T>>;
  handleError: SyncFn<ErrorPayload>;
  syncInterval: number;
}

export const useRefreshIfActive = <T>({
  getDataTimestamp,
  isLoading,
  publicKeyHash,
  setLoading,
  getData,
  handleSuccess,
  handleError,
  syncInterval
}: RefreshIfActiveConfig<T>) => {
  const evmChains = useEnabledEvmChains();
  const windowIsActive = useWindowIsActive();

  const apiSupportedChainIds = useMemoWithCompare(
    () => evmChains.map(({ chainId }) => (isSupportedChainId(chainId) ? chainId : null)).filter(isTruthy),
    [evmChains]
  );

  const refreshData = useCallback(
    async (chainId: ChainID) => {
      if (isLoading(chainId)) return;

      setLoading(chainId, true);

      const startTs = Date.now();
      getData(publicKeyHash, chainId)
        .then(data => handleSuccess({ chainId, data, timestamp: startTs }))
        .catch(error => {
          console.error(error);
          handleError({ chainId, error: serializeError(error) ?? t('unknownError'), timestamp: startTs });
        });
    },
    [isLoading, publicKeyHash, setLoading, getData, handleSuccess, handleError]
  );

  useEffect(() => {
    if (!windowIsActive) return;

    const firstLoadTimeouts: NodeJS.Timeout[] = [];
    const refreshIntervals: NodeJS.Timer[] = [];
    apiSupportedChainIds.forEach(chainId => {
      setLoading(chainId, false);
      firstLoadTimeouts.push(
        setTimeout(() => {
          refreshData(chainId);

          refreshIntervals.push(setInterval(() => refreshData(chainId), syncInterval));
        }, Math.max(0, syncInterval - (Date.now() - getDataTimestamp(chainId))))
      );
    });

    return () => {
      firstLoadTimeouts.forEach(timeout => clearTimeout(timeout));
      refreshIntervals.forEach(interval => clearInterval(interval));
    };
  }, [apiSupportedChainIds, refreshData, windowIsActive, syncInterval, setLoading, publicKeyHash, getDataTimestamp]);
};
