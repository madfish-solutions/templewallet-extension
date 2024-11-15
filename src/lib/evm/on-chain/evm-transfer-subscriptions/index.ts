import { useCallback, useEffect, useMemo, useRef } from 'react';

import constate from 'constate';
import { isEqual } from 'lodash';

import { getEvmNetworks } from 'lib/apis/chainlist';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useTypedSWR } from 'lib/swr';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { useEnabledEvmChains } from 'temple/front';

import { EvmTransfersListener } from './evm-transfers-listener';

interface ListeningStateEntry {
  listener: EvmTransfersListener;
  subscriptions: Map<string, Set<EmptyFn>>;
}

export const [EvmTransferSubscriptionsProvider, useEvmTransferSubscriptions] = constate(() => {
  const enabledEvmChains = useEnabledEvmChains();
  const listeningStateRef = useRef<Map<number, Map<HexString, ListeningStateEntry>>>(new Map());

  const enabledChainsHttpRpcs = useMemo(() => {
    const result = new Map<number, string>();
    enabledEvmChains.forEach(({ chainId, rpcBaseURL }) => result.set(chainId, rpcBaseURL));

    return result;
  }, [enabledEvmChains]);
  const prevEnabledChainsHttpRpcsRef = useRef(enabledChainsHttpRpcs);

  const { data: chainidNetworks } = useTypedSWR('evm-chainid-networks', getEvmNetworks, {
    suspense: false,
    shouldRetryOnError: true,
    errorRetryInterval: 10_000
  });

  const wssUrlsByChainId = useMemo(() => {
    if (!chainidNetworks) return {};

    const result: Record<number, string[]> = {};
    chainidNetworks.forEach(({ chainId, rpc }) => {
      if (!enabledChainsHttpRpcs.has(chainId)) {
        return;
      }

      const chainUrls = rpc
        .map(({ url }) => url)
        .filter(url => {
          if (!url.startsWith('wss://') || url.includes('${')) {
            return false;
          }

          try {
            const parsedUrl = new URL(url);
            const searchParamsNames = Array.from(parsedUrl.searchParams.keys());

            return (
              searchParamsNames.length === 0 ||
              (searchParamsNames.length === 1 && searchParamsNames[0].toLowerCase().includes('chainid'))
            );
          } catch (e) {
            return false;
          }
        });

      if (chainUrls.length > 0) {
        result[chainId] = chainUrls;
      }
    });

    return result;
  }, [chainidNetworks, enabledChainsHttpRpcs]);
  const prevWssUrlsByChainIdRef = useRef(wssUrlsByChainId);

  useWillUnmount(() => {
    listeningStateRef.current.forEach(chainIdStateEntries => {
      chainIdStateEntries.forEach(stateEntry => {
        stateEntry.listener.finalize();
      });
    });
  });

  const makeEvmTransfersListener = useCallback(
    (account: HexString, chainId: number) => {
      const httpRpcUrl = enabledChainsHttpRpcs.get(chainId);

      if (!httpRpcUrl) {
        return;
      }

      return new EvmTransfersListener({
        account,
        mainHttpRpcUrl: httpRpcUrl,
        otherRpcUrls: wssUrlsByChainId[chainId] ?? [],
        // There is no way to get that the native token balance has changed without getting it after each block
        // or getting the block itself
        onNewBlock: () => {
          listeningStateRef.current
            .get(chainId)
            ?.get(account)
            ?.subscriptions.get(EVM_TOKEN_SLUG)
            ?.forEach(cb => cb());
        },
        onTokenTransfer: assetSlug => {
          const storedAssetSlug = assetSlug.toLowerCase();

          listeningStateRef.current
            .get(chainId)
            ?.get(account)
            ?.subscriptions.get(storedAssetSlug)
            ?.forEach(cb => cb());
        }
      });
    },
    [enabledChainsHttpRpcs, wssUrlsByChainId]
  );

  const subscribe = useCallback(
    (chainId: number, account: HexString, assetSlug: string, callback: EmptyFn) => {
      const storedAssetSlug = assetSlug.toLowerCase();
      let subscriptionsByChainId = listeningStateRef.current.get(chainId);
      if (!subscriptionsByChainId) {
        subscriptionsByChainId = new Map();
        listeningStateRef.current.set(chainId, subscriptionsByChainId);
      }
      let listeningStateEntry = subscriptionsByChainId.get(account);
      if (!listeningStateEntry) {
        const listener = makeEvmTransfersListener(account, chainId);

        if (!listener) {
          console.error(`No HTTP RPC URL for chain ${chainId}`);

          return;
        }

        listeningStateEntry = { subscriptions: new Map(), listener };
        subscriptionsByChainId.set(account, listeningStateEntry);
      }
      const { subscriptions } = listeningStateEntry;
      let subscriptionsByAsset = subscriptions.get(storedAssetSlug);
      if (!subscriptionsByAsset) {
        subscriptionsByAsset = new Set();
        subscriptions.set(storedAssetSlug, subscriptionsByAsset);
      }
      subscriptionsByAsset.add(callback);
    },
    [makeEvmTransfersListener]
  );

  const unsubscribe = useCallback((chainId: number, account: HexString, assetSlug: string, callback: EmptyFn) => {
    const storedAssetSlug = assetSlug.toLowerCase();
    const chainIdStateEntries = listeningStateRef.current.get(chainId);
    const listeningStateEntry = chainIdStateEntries?.get(account);

    if (!listeningStateEntry) {
      return;
    }

    const { listener, subscriptions } = listeningStateEntry;
    const subscriptionsByAsset = subscriptions.get(storedAssetSlug);

    if (!subscriptionsByAsset) {
      return;
    }

    subscriptionsByAsset.delete(callback);
    if (subscriptionsByAsset.size === 0) {
      subscriptions.delete(storedAssetSlug);
    }
    if (subscriptions.size === 0) {
      listener.finalize();
      chainIdStateEntries!.delete(account);
    }
  }, []);

  useEffect(() => {
    if (
      isEqual(prevWssUrlsByChainIdRef.current, wssUrlsByChainId) &&
      isEqual(prevEnabledChainsHttpRpcsRef.current, enabledChainsHttpRpcs)
    ) {
      return;
    }

    listeningStateRef.current.forEach((chainIdStateEntries, chainId) => {
      const prevWssUrls = prevWssUrlsByChainIdRef.current[chainId] ?? [];
      const newWssUrls = wssUrlsByChainId[chainId] ?? [];

      if (isEqual(prevWssUrls, newWssUrls)) {
        return;
      }

      chainIdStateEntries.forEach((stateEntry, account) => {
        stateEntry.listener.finalize();
        const newListener = makeEvmTransfersListener(account, chainId);

        if (newListener) {
          stateEntry.listener = newListener;
        } else {
          chainIdStateEntries.delete(account);
        }
      });
    });
    prevWssUrlsByChainIdRef.current = wssUrlsByChainId;
    prevEnabledChainsHttpRpcsRef.current = enabledChainsHttpRpcs;
  }, [enabledChainsHttpRpcs, makeEvmTransfersListener, wssUrlsByChainId]);

  return { subscribe, unsubscribe };
});
