import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import { useTezos } from "lib/thanos/front";

export function useBalance(address: string, suspense = true) {
  const tezos = useTezos();

  const fetchBalanceLocal = React.useCallback(
    () => fetchBalance(address, tezos),
    [address, tezos]
  );

  return useRetryableSWR(
    ["balance", tezos.checksum, address],
    fetchBalanceLocal,
    {
      dedupingInterval: 20_000,
      suspense,
    }
  );
}

export async function fetchBalance(address: string, tezos: TezosToolkit) {
  const amount = await tezos.tz.getBalance(address);
  return tezos.format("mutez", "tz", amount) as BigNumber;
}
