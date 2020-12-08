import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import {
  ThanosAsset,
  useTezos,
  useSettings,
  fetchBalance,
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
    displayed ? ["balance", tezos.checksum, asset.symbol, address] : null,
    fetchBalanceLocal,
    {
      suspense: opts.suspense ?? true,
      revalidateOnFocus: false,
      dedupingInterval: 180_000,
    }
  );
}

export function useBalanceSWRKey(asset: ThanosAsset, address: string) {
  const tezos = useTezos();
  return ["balance", tezos.checksum, asset.symbol, address];
}
