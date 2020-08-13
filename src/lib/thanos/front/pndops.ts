import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { useTezos, useNetwork, useStorage } from "lib/thanos/front";
import { ThanosNetwork } from "../types";

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

  const allowed = React.useMemo(() => isAllowed(network), [network]);

  const [pndOps, setPndOps] = useStorage<PendingOperation[]>(
    getKey(tezos.checksum),
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

export async function addPendingOperations(
  network: ThanosNetwork,
  tezosChecksum: string,
  opsToAdd: PendingOperation[]
) {
  if (isAllowed(network)) {
    const key = getKey(tezosChecksum);
    const items = await browser.storage.local.get([key]);
    if (key in items) {
      await browser.storage.local.set({
        [key]: [...opsToAdd, ...items[key]],
      });
    }
  }
}

function isAllowed(network: ThanosNetwork) {
  return Boolean(network.tzStats);
}

function getKey(tezosChecksum: string) {
  return `pndops_${tezosChecksum}`;
}
