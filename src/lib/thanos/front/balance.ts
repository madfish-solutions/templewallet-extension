import * as React from "react";
import useSWR from "swr";
import BigNumber from "bignumber.js";
import { useReadyThanos } from "lib/thanos/front/ready";

export function useBalance(address: string, suspense?: boolean) {
  const { tezos, network } = useReadyThanos();

  const fetchBalance = React.useCallback(async () => {
    const amount = await tezos.tz.getBalance(address);
    return tezos.format("mutez", "tz", amount) as BigNumber;
  }, [tezos, address]);

  return useSWR(["balance", address, network.rpcBaseURL], fetchBalance, {
    refreshInterval: 10_000,
    dedupingInterval: 15_000,
    suspense
  });
}
