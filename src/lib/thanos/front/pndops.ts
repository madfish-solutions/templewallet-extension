import * as React from "react";
import { useTezos, useStorage } from "lib/thanos/front";

export interface PendingOperation {
  hash: string;
}

export function useMyPendingOperations() {
  const tezos = useTezos();
  const [pndOps, setPndOps] = useStorage<PendingOperation[]>(
    `pndops_${tezos.checksum}`,
    []
  );

  const addPndOp = React.useCallback(
    (op: PendingOperation) => {
      setPndOps((ops) => [op, ...ops]);
    },
    [setPndOps]
  );

  const removePndOp = React.useCallback(
    (op: PendingOperation) => {
      setPndOps((ops) => ops.filter((o) => o.hash !== op.hash));
    },
    [setPndOps]
  );

  return {
    pndOps,
    setPndOps,
    addPndOp,
    removePndOp,
  };
}
