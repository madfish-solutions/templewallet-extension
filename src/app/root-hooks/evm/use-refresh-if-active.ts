import { useCallback, useEffect, useMemo, useRef } from 'react';

import axios from 'axios';

import { useThisWindowLocation } from 'app/hooks/use-this-window-location';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { EvmBalancesSource } from 'app/store/evm/state';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { isAbortError, readRetryAfterMs } from 'lib/apis/utils';
import { t } from 'lib/i18n';
import { useWindowIsActive } from 'lib/temple/front/window-is-active-context';
import { useMemoWithCompare, useUpdatableRef } from 'lib/ui/hooks';
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
  /** Return both fields to enable partial data application after an error. `signal` aborts an in-flight load. */
  getData: (
    publicKeyHash: HexString,
    chainId: C,
    signal?: AbortSignal
  ) => Promise<{ data?: NonNullable<T>; error?: unknown }>;
  isApplicable: (chainId: number) => chainId is C;
  handleSuccess: SyncFn<SuccessPayload<NonNullable<T>>>;
  handleError: SyncFn<ErrorPayload>;
}

export interface ApiDataLoader<T, C extends number> extends DataLoaderBase<T, C> {
  type: 'api';
}

export interface OnchainDataLoader<T> extends DataLoaderBase<T, number> {
  type: 'onchain';
  getData: (
    publicKeyHash: HexString,
    chainId: number,
    signal?: AbortSignal
  ) => Promise<{ data?: NonNullable<T>; error?: unknown }>;
}

type DataLoader<T> = ApiDataLoader<T, any> | OnchainDataLoader<T>;

interface RefreshIfActiveConfig<L extends [DataLoader<any>, ...DataLoader<any>[]]> {
  getDataTimestamp: SyncFn<number, number>;
  loaders: L;
  publicKeyHash: HexString;
  syncInterval: number;
}

const validPaths = ['/send', '/swap', '/token'];

/** Axios (including the fetch adapter) puts the HTTP status on `response` and, in v1, on `status`. */
const isTooManyRequests = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;

  return error.response?.status === 429 || error.status === 429;
};

const abortedRefresh = () => new DOMException('The operation was aborted.', 'AbortError');

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
  // Active is forced on until this window's id loads. Scheduling in that gap fires, then the
  // real focus check starts the same chains again. Wait until the id is known.
  const { data: thisWindowLocation } = useThisWindowLocation();
  const windowLocationKnown = thisWindowLocation !== undefined;
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

  const loadersRef = useUpdatableRef(loaders);
  const getDataTimestampRef = useUpdatableRef(getDataTimestamp);
  const isTestnetModeRef = useUpdatableRef(isTestnetMode);
  /** Chain is not requested again until this time. Set from the last HTTP 429 `Retry-After`. */
  const pausedUntilRef = useRef(new Map<string, number>());
  /** Survives a new subscription. A resubscribe must not start a chain whose request is already running. */
  const controllersRef = useRef(new Map<string, AbortController>());

  const refreshData = useCallback(
    async (chainId: number, signal: AbortSignal) => {
      for (const {
        type,
        isLoading,
        setLoading,
        getData,
        handleSuccess,
        handleError,
        isApplicable
      } of loadersRef.current) {
        if (!isApplicable(chainId) || (type === 'api' && isTestnetModeRef.current)) {
          continue;
        }

        if (signal.aborted || (type === 'api' && isLoading(chainId))) {
          return;
        }

        setLoading(chainId, true);

        const startTs = Date.now();
        try {
          const { data, error } = await getData(publicKeyHash, chainId, signal);
          if (signal.aborted) {
            setLoading(chainId, false);

            return;
          }

          if (data !== undefined) {
            handleSuccess({ chainId, data, timestamp: startTs });
          }

          if (error !== undefined) {
            throw error;
          }

          return;
        } catch (e) {
          if (signal.aborted || isAbortError(e)) {
            setLoading(chainId, false);

            return;
          }

          if (isTooManyRequests(e)) {
            // A 429 is a pause. Recording it as an API error starts per-token on-chain reads,
            // and falling through starts the chain-wide loader. Stored balances stay as they are.
            // The caller waits out this response's `Retry-After` before trying the chain again.
            setLoading(chainId, false);

            return readRetryAfterMs(e) ?? 1000;
          }

          console.error(e);
          handleError({ chainId, error: serializeError(e) ?? t('unknownError') });
        }
      }

      return undefined;
    },
    [publicKeyHash, loadersRef, isTestnetModeRef]
  );

  useEffect(() => {
    const controllers = controllersRef.current;

    return () => {
      controllers.forEach(controller => controller.abort(abortedRefresh()));
      controllers.clear();
    };
  }, [controllersRef]);

  // Loader identities change when one chain accepts its first balances response. Reading them from a ref
  // keeps that from cancelling the other chains and requesting them again.
  // In-flight controllers stay across that resubscribe. Clearing them here was starting a second request
  // for every chain whose delay was already 0: the first timeout had sent, and abort cannot unsend it.
  useEffect(() => {
    if (!windowLocationKnown || !windowIsActive || !shouldRefresh) {
      controllersRef.current.forEach(controller => controller.abort(abortedRefresh()));
      controllersRef.current.clear();

      return;
    }

    const controllers = controllersRef.current;
    const firstLoadTimeouts: NodeJS.Timeout[] = [];
    const refreshIntervals: NodeJS.Timeout[] = [];

    const run = (chainId: number) => {
      const requestKey = `${publicKeyHash}:${chainId}`;
      if (controllers.has(requestKey)) return;

      if ((pausedUntilRef.current.get(requestKey) ?? 0) > Date.now()) return;

      const controller = new AbortController();
      controllers.set(requestKey, controller);
      void refreshData(chainId, controller.signal)
        .then(retryAfterMs => {
          if (typeof retryAfterMs === 'number') {
            pausedUntilRef.current.set(requestKey, Date.now() + retryAfterMs);
          }
        })
        .finally(() => {
          if (controllers.get(requestKey) === controller) controllers.delete(requestKey);
        });
    };

    chainsToRefresh.forEach(({ chainId }) => {
      const currentLoaders = loadersRef.current;
      if (!currentLoaders.some(loader => loader.isApplicable(chainId))) {
        return;
      }

      const requestKey = `${publicKeyHash}:${chainId}`;
      if (controllers.has(requestKey)) {
        refreshIntervals.push(setInterval(() => run(chainId), syncInterval));

        return;
      }

      currentLoaders.forEach(({ setLoading }) => setLoading(chainId, false));
      firstLoadTimeouts.push(
        setTimeout(
          () => {
            run(chainId);

            refreshIntervals.push(setInterval(() => run(chainId), syncInterval));
          },
          Math.max(0, syncInterval - (Date.now() - getDataTimestampRef.current(chainId)))
        )
      );
    });

    return () => {
      firstLoadTimeouts.forEach(timeout => clearTimeout(timeout));
      refreshIntervals.forEach(interval => clearInterval(interval));
    };
  }, [
    refreshData,
    windowIsActive,
    windowLocationKnown,
    syncInterval,
    publicKeyHash,
    shouldRefresh,
    chainsToRefresh,
    loadersRef,
    getDataTimestampRef,
    pausedUntilRef
  ]);
};
