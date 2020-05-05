import * as React from "react";
import { useRetryableSWR } from "lib/swr";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import { useTezos } from "lib/thanos/front";

export function useBalance(address: string, suspense?: boolean) {
  const tezos = useTezos();

  const fetchBalanceLocal = React.useCallback(
    () => fetchBalance(address, tezos),
    [address, tezos]
  );

  return useRetryableSWR(
    getBalanceSWRKey(address, tezos.checksum),
    fetchBalanceLocal,
    {
      refreshInterval: 10_000,
      dedupingInterval: 15_000,
      suspense,
    }
  );
}

export async function fetchBalance(address: string, tezos: TezosToolkit) {
  const amount = await tezos.tz.getBalance(address);
  return tezos.format("mutez", "tz", amount) as BigNumber;
}

export function getBalanceSWRKey(address: string, tezosChecksum: string) {
  return ["balance", address, tezosChecksum];
}
