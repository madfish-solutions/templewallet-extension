import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import {
  ThanosAsset,
  useTezos,
  useSettings,
  fetchBalance,
  getAssetKey,
  ReactiveTezosToolkit,
} from "lib/thanos/front";

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
};

export function useBalance(
  asset: ThanosAsset,
  address: string,
  opts: UseBalanceOptions = {}
) {
  const nativeTezos = useTezos();
  const settings = useSettings();

  const tezos = React.useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      return new ReactiveTezosToolkit(
        rpc,
        rpc,
        settings.lambdaContracts?.[rpc]
      );
    }
    return nativeTezos;
  }, [opts.networkRpc, nativeTezos, settings.lambdaContracts]);

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

export function useBalanceSWRKey(asset: ThanosAsset, address: string) {
  const tezos = useTezos();
  return getBalanceSWRKey(tezos, asset, address);
}

export function getBalanceSWRKey(
  tezos: ReactiveTezosToolkit,
  asset: ThanosAsset,
  address: string
) {
  return ["balance", tezos.checksum, getAssetKey(asset), address];
}
