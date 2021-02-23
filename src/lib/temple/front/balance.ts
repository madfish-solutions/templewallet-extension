import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import {
  TempleAsset,
  useTezos,
  fetchBalance,
  getAssetKey,
  ReactiveTezosToolkit,
} from "lib/temple/front";

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
};

export function useBalance(
  asset: TempleAsset,
  address: string,
  opts: UseBalanceOptions = {}
) {
  const nativeTezos = useTezos();

  const tezos = React.useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      return new ReactiveTezosToolkit(
        rpc,
        rpc
        // lambda view contract for custom RPC may be here
        // currently we don't call lambda view for custom RPC
        // but if we need to do this, we have to load chainId and pick lambdaView
        // from settings with this chainId
      );
    }
    return nativeTezos;
  }, [opts.networkRpc, nativeTezos]);

  const fetchBalanceLocal = React.useCallback(
    () => fetchBalance(tezos, asset, address),
    [tezos, asset, address]
  );

  const displayed = opts.displayed ?? true;

  return useRetryableSWR(
    displayed ? getBalanceSWRKey(tezos, asset, address) : null,
    fetchBalanceLocal,
    {
      suspense: opts.suspense ?? true,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );
}

export function useBalanceSWRKey(asset: TempleAsset, address: string) {
  const tezos = useTezos();
  return getBalanceSWRKey(tezos, asset, address);
}

export function getBalanceSWRKey(
  tezos: ReactiveTezosToolkit,
  asset: TempleAsset,
  address: string
) {
  return ["balance", tezos.checksum, getAssetKey(asset), address];
}
