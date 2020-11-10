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
};

export function useBalance(
  asset: ThanosAsset,
  address: string,
  ops: UseBalanceOptions = {}
) {
  const nativeTezos = useTezos();
  const settings = useSettings();

  const tezos = React.useMemo(() => {
    if (ops.networkRpc) {
      const rpc = ops.networkRpc;
      return new ReactiveTezosToolkit(
        rpc,
        rpc,
        settings.lambdaContracts?.[rpc]
      );
    }
    return nativeTezos;
  }, [ops.networkRpc, nativeTezos, settings.lambdaContracts]);

  const fetchBalanceLocal = React.useCallback(
    () => fetchBalance(tezos, asset, address),
    [tezos, asset, address]
  );

  return useRetryableSWR(
    ["balance", tezos.checksum, asset.symbol, address],
    fetchBalanceLocal,
    {
      suspense: ops.suspense ?? true,
      revalidateOnFocus: false,
      dedupingInterval: 20_000,
    }
  );
}
