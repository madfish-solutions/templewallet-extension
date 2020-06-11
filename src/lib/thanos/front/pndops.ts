import * as React from "react";
import { useTezos, useNetwork, useStorage } from "lib/thanos/front";

export interface PendingOperation {
  kind: string;
  hash: string;
  amount?: number;
  destination?: string;
  addedAt: string;
}

export function usePendingOperations() {
  const tezos = useTezos();
  const network = useNetwork();

  const allowed = React.useMemo(() => Boolean(network.tzStats), [
    network.tzStats,
  ]);

  const [pndOps, setPndOps] = useStorage<PendingOperation[]>(
    `pndops_${tezos.checksum}`,
    []
  );

  const addPndOps = React.useCallback(
    (opsToAdd: PendingOperation[]) => {
      if (allowed) {
        setPndOps((ops) => [...opsToAdd, ...ops]);
      }
    },
    [setPndOps, allowed]
  );

  const removePndOps = React.useCallback(
    (opsToRemove: { hash: string }[]) => {
      setPndOps((ops) =>
        ops.filter((o) => opsToRemove.every((otr) => otr.hash !== o.hash))
      );
    },
    [setPndOps]
  );

  return {
    pndOps,
    setPndOps,
    addPndOps,
    removePndOps,
  };
}
