import * as React from "react";
import { getAllBakers } from "lib/tezos-nodes";
import { useRetryableSWR } from "lib/swr";
import { useReadyThanos } from "lib/thanos/front/ready";

export function useKnownBakers() {
  const { network } = useReadyThanos();
  const { data: bakers } = useAllBakers(true);

  return React.useMemo(
    () =>
      bakers && bakers.length > 1 && network.type === "main" ? bakers : null,
    [bakers, network.type]
  );
}

export function useAllBakers(suspense?: boolean) {
  return useRetryableSWR("all-bakers", getAllBakers, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    suspense,
  });
}
