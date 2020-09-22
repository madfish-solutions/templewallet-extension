import * as React from "react";
import { useTezos, useNetwork, useStorage } from "lib/thanos/front";
import { ThanosNetwork } from "lib/thanos/types";
import { append, remove } from "lib/thanos/pndops";
import { useAccount } from "lib/thanos/front/ready";

export interface PendingOperation {
  kind: string;
  hash: string;
  amount?: number;
  destination?: string;
  addedAt: string;
}

export function usePendingOperations() {
  const tezos = useTezos();
  const account = useAccount();
  const network = useNetwork();

  const [pndOps, setPndOps] = useStorage<PendingOperation[]>(
    getKey(tezos.checksum),
    []
  );

  const addPndOps = React.useCallback(
    (opsToAdd: PendingOperation[]) => {
      append(account.publicKeyHash, network.id, opsToAdd);
    },
    [account.publicKeyHash, network.id]
  );

  const removePndOps = React.useCallback(
    (opsToRemove: { hash: string }[]) => {
      remove(
        account.publicKeyHash,
        network.id,
        opsToRemove.map(({ hash }) => hash)
      );
    },
    [account.publicKeyHash, network.id]
  );

  return {
    pndOps,
    setPndOps,
    addPndOps,
    removePndOps,
  };
}

export async function addPendingOperations(
  network: ThanosNetwork,
  accPkh: string,
  opsToAdd: PendingOperation[]
) {
  if (isAllowed(network)) {
    await append(accPkh, network.id, opsToAdd);
  }
}

function isAllowed(network: ThanosNetwork) {
  return Boolean(network.tzStats);
}

function getKey(tezosChecksum: string) {
  return `pndops_${tezosChecksum}`;
}
