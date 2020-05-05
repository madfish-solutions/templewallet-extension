import * as React from "react";
import { getAllBakers, getBaker } from "lib/tezos-nodes";
import { useRetryableSWR } from "lib/swr";
import { useTezos, useNetwork } from "lib/thanos/front";

export function useDelegate(address: string, suspense?: boolean) {
  const tezos = useTezos();

  const getDelegate = React.useCallback(async () => {
    try {
      return await tezos.rpc.getDelegate(address);
    } catch (err) {
      if (err.status === 404) {
        return null;
      }

      throw err;
    }
  }, [address, tezos]);

  return useRetryableSWR(["delegate", address, tezos.checksum], getDelegate, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    suspense,
  });
}

export function useKnownBaker(address: string, suspense = true) {
  const net = useNetwork();
  const fetchBaker = React.useCallback(() => getBaker(address), [address]);
  const { data: baker } = useRetryableSWR(
    net.type === "main" ? ["baker", address] : null,
    fetchBaker,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      suspense,
    }
  );
  return baker;
}

export function useKnownBakers(suspense = true) {
  const net = useNetwork();
  const { data: bakers } = useRetryableSWR(
    net.type === "main" ? "all-bakers" : null,
    getAllBakers,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      suspense,
    }
  );

  return React.useMemo(() => (bakers && bakers.length > 1 ? bakers : null), [
    bakers,
  ]);
}
