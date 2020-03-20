import * as React from "react";
import useSWR from "swr";
import { useReadyThanos } from "lib/thanos/front/ready";

export function useBalance(address: string, suspense?: boolean) {
  const { tezos, network } = useReadyThanos();

  const fetchBalance = React.useCallback(async () => {
    const amount = await tezos.tz.getBalance(address);
    return tezos.format("mutez", "tz", amount);
  }, [tezos, address]);

  return useSWR([address, network.rpcBaseURL], fetchBalance, {
    suspense
  });
}
