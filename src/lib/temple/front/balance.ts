import { useCallback, useMemo } from "react";

import { useRetryableSWR } from "lib/swr";
import {
  useTezos,
  fetchBalance,
  ReactiveTezosToolkit,
  michelEncoder,
  loadFastRpcClient,
  useAssetMetadata,
} from "lib/temple/front";

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
};

export function useBalance(
  assetSlug: string,
  address: string,
  opts: UseBalanceOptions = {}
) {
  const nativeTezos = useTezos();
  const asssetMetadata = useAssetMetadata(assetSlug);

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
    () => fetchBalance(tezos, assetSlug, asssetMetadata, address),
    [tezos, address, assetSlug, asssetMetadata]
  );

  const displayed = opts.displayed ?? true;

  return useRetryableSWR(
    displayed ? getBalanceSWRKey(tezos, assetSlug, address) : null,
    fetchBalanceLocal,
    {
      suspense: opts.suspense ?? true,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );
}

export function useBalanceSWRKey(assetSlug: string, address: string) {
  const tezos = useTezos();
  return getBalanceSWRKey(tezos, assetSlug, address);
}

export function getBalanceSWRKey(
  tezos: ReactiveTezosToolkit,
  assetSlug: string,
  address: string
) {
  return ["balance", tezos.checksum, assetSlug, address];
}
