import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useRetryableSWR } from 'lib/swr';
import {
  useTezos,
  fetchBalance,
  ReactiveTezosToolkit,
  michelEncoder,
  loadFastRpcClient,
  useAssetMetadata
} from 'lib/temple/front';

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

export function useBalance(assetSlug: string, address: string, opts: UseBalanceOptions = {}) {
  const nativeTezos = useTezos();
  const assetMetadata = useAssetMetadata(assetSlug);

  const tezos = useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      const t = new ReactiveTezosToolkit(
        loadFastRpcClient(rpc),
        rpc
        // lambda view contract for custom RPC may be here
        // currently we don't call lambda view for custom RPC
        // but if we need to do this, we have to load chainId and pick lambdaView
        // from settings with this chainId
      );
      t.setPackerProvider(michelEncoder);
      return t;
    }
    return nativeTezos;
  }, [opts.networkRpc, nativeTezos]);

  const fetchBalanceLocal = useCallback(
    () => fetchBalance(tezos, assetSlug, assetMetadata, address),
    [tezos, address, assetSlug, assetMetadata]
  );

  const displayed = opts.displayed ?? true;

  return useRetryableSWR(displayed ? getBalanceSWRKey(tezos, assetSlug, address) : null, fetchBalanceLocal, {
    suspense: opts.suspense ?? true,
    revalidateOnFocus: false,
    dedupingInterval: 20_000,
    initialData: opts.initial
  });
}

export function useBalanceSWRKey(assetSlug: string, address: string) {
  const tezos = useTezos();
  return getBalanceSWRKey(tezos, assetSlug, address);
}

export function getBalanceSWRKey(tezos: ReactiveTezosToolkit, assetSlug: string, address: string) {
  return ['balance', tezos.checksum, assetSlug, address];
}
