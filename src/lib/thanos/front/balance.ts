import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import {
  ThanosAsset,
  useTezos,
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
  const tezos = React.useMemo(() => {
    if (ops.networkRpc) {
      const rpc = ops.networkRpc;
      const t = new ReactiveTezosToolkit(rpc);
      t.setProvider({ rpc });
      return t;
    }
    return nativeTezos;
  }, [ops.networkRpc, nativeTezos]);

  const fetchBalanceLocal = React.useCallback(
    () => fetchBalance(tezos, asset, address),
    [tezos, asset, address]
  );

  return useRetryableSWR(
    ["balance", tezos.checksum, asset.symbol, address],
    fetchBalanceLocal,
    {
      dedupingInterval: 20_000,
      suspense: ops.suspense ?? true,
    }
  );
}
