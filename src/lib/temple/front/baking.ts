import * as React from "react";
import { getAllBakers, getBaker } from "lib/tezos-nodes";
import { useRetryableSWR } from "lib/swr";
import { useTezos, useNetwork } from "lib/temple/front";

export function useDelegate(address: string, suspense = true) {
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

  return useRetryableSWR(["delegate", tezos.checksum, address], getDelegate, {
    dedupingInterval: 20_000,
    suspense,
  });
}

export function useKnownBaker(address: string | null, suspense = true) {
  const net = useNetwork();
  const fetchBaker = React.useCallback(async () => {
    if (!address) return null;
    try {
      return await getBaker(address);
    } catch (_err) {
      return null;
    }
  }, [address]);
  return useRetryableSWR(
    net.type === "main" && address ? ["baker", address] : null,
    fetchBaker,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      suspense,
    }
  );
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
