import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import { ThanosAsset, useTezos, fetchBalance } from "lib/thanos/front";

export function useBalance(
  asset: ThanosAsset,
  address: string,
  suspense = true
) {
  const tezos = useTezos();

  const fetchBalanceLocal = React.useCallback(
    () => fetchBalance(tezos, asset, address),
    [tezos, asset, address]
  );

  return useRetryableSWR(
    ["balance", tezos.checksum, asset.symbol, address],
    fetchBalanceLocal,
    {
      dedupingInterval: 20_000,
      suspense,
    }
  );
}
