import { useCallback, useEffect, useMemo } from 'react';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { EvmBalancesSource } from 'app/store/evm/state';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { t } from 'lib/i18n';
import { useWindowIsActive } from 'lib/temple/front/window-is-active-context';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { serializeError } from 'lib/utils/serialize-error';
import { useLocation } from 'lib/woozie';
import { useEnabledEvmChains } from 'temple/front';

export interface SuccessPayload<T> {
  chainId: number;
  data: T;
  timestamp: number;
}

export interface ErrorPayload {
  chainId: number;
  error: string;
}

interface DataLoaderBase<T, C extends number> {
  type: EvmBalancesSource;
  isLoading: SyncFn<number, boolean>;
  /** This function is not triggered on getting new data or error */
  setLoading: (chainId: number, isLoading: boolean) => void;
  /** Return both fields to enable partial data application after an error */
  getData: (publicKeyHash: HexString, chainId: C) => Promise<{ data?: NonNullable<T>; error?: unknown }>;
  isApplicable: (chainId: number) => chainId is C;
  handleSuccess: SyncFn<SuccessPayload<NonNullable<T>>>;
  handleError: SyncFn<ErrorPayload>;
}

export interface ApiDataLoader<T, C extends number> extends DataLoaderBase<T, C> {
  type: 'api';
}

export interface OnchainDataLoader<T> extends DataLoaderBase<T, number> {
  type: 'onchain';
  getData: (publicKeyHash: HexString, chainId: number) => Promise<{ data?: NonNullable<T>; error?: unknown }>;
}

type DataLoader<T> = ApiDataLoader<T, any> | OnchainDataLoader<T>;

interface RefreshIfActiveConfig<L extends [DataLoader<any>, ...DataLoader<any>[]]> {
  getDataTimestamp: SyncFn<number, number>;
  loaders: L;
  publicKeyHash: HexString;
  syncInterval: number;
}

const validPaths = ['/send', '/swap', '/token'];

export const useRefreshIfActive = <L extends [DataLoader<any>, ...DataLoader<any>[]]>({
  getDataTimestamp,
  loaders,
  publicKeyHash,
  syncInterval
}: RefreshIfActiveConfig<L>) => {
  const evmChains = useEnabledEvmChains();
  const { filterChain } = useAssetsFilterOptionsSelector();
  const isTestnetMode = useTestnetModeEnabledSelector();
  const windowIsActive = useWindowIsActive();
  const { pathname } = useLocation();

  const shouldRefresh = useMemo(() => {
    if (pathname === '/') return true;
    return validPaths.some(path => pathname.startsWith(path));
  }, [pathname]);

  const tokenPathChainId = useMemo(() => {
    if (pathname.startsWith('/token')) {
      const parts = pathname.split('/');
      const id = parts[3];
      const maybeNum = Number(id);
      return isNaN(maybeNum) ? undefined : maybeNum;
    }
    return undefined;
  }, [pathname]);

  const chainsToRefresh = useMemoWithCompare(() => {
    if (filterChain) {
      return filterChain.kind === 'evm' ? [filterChain] : [];
    }

    if (tokenPathChainId !== undefined) {
      return evmChains.filter(c => c.chainId === tokenPathChainId);
    }

    return evmChains;
  }, [evmChains, tokenPathChainId, filterChain]);

  const refreshData = useCallback(
    async (chainId: number) => {
      for (const { type, isLoading, setLoading, getData, handleSuccess, handleError, isApplicable } of loaders) {
        if (!isApplicable(chainId) || (type === 'api' && isTestnetMode)) {
          continue;
        }

        if (type === 'api' && isLoading(chainId)) {
          return;
        }

        setLoading(chainId, true);

        const startTs = Date.now();
        try {
          const { data, error } = await getData(publicKeyHash, chainId);
          if (data !== undefined) {
            handleSuccess({ chainId, data, timestamp: startTs });
          }

          if (error !== undefined) {
            throw error;
          }

          return;
        } catch (e) {
          console.error(e);
          handleError({ chainId, error: serializeError(e) ?? t('unknownError') });
        }
      }
    },
    [publicKeyHash, loaders, isTestnetMode]
  );

  useEffect(() => {
    if (!windowIsActive || !shouldRefresh) return;

    const firstLoadTimeouts: NodeJS.Timeout[] = [];
    const refreshIntervals: NodeJS.Timeout[] = [];
    chainsToRefresh.forEach(({ chainId }) => {
      if (!loaders.some(loader => loader.isApplicable(chainId))) {
        return;
      }

      loaders.forEach(({ setLoading }) => setLoading(chainId, false));
      firstLoadTimeouts.push(
        setTimeout(() => {
          refreshData(chainId).then();

          refreshIntervals.push(setInterval(() => refreshData(chainId), syncInterval));
        }, Math.max(0, syncInterval - (Date.now() - getDataTimestamp(chainId))))
      );
    });

    return () => {
      firstLoadTimeouts.forEach(timeout => clearTimeout(timeout));
      refreshIntervals.forEach(interval => clearInterval(interval));
    };
  }, [
    refreshData,
    windowIsActive,
    syncInterval,
    loaders,
    publicKeyHash,
    getDataTimestamp,
    shouldRefresh,
    chainsToRefresh
  ]);
};
