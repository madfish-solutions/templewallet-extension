import * as React from "react";
import useSWR from "swr";
import { useReadyThanos } from "lib/thanos/front/ready";

export function useBalance(address: string) {
  const { tezos, network } = useReadyThanos();

  const fetchBalance = React.useCallback(async () => {
    const amount = await tezos.tz.getBalance(address);
    return tezos.format("mutez", "tz", amount);
  }, [tezos, address]);

  const balancesSWR = useSWR([address, network.rpcBaseURL], fetchBalance, {
    suspense: true
  });

  return balancesSWR.data!;
}
