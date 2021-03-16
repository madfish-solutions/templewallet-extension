import * as React from "react";
import constate from "constate";
import { trigger } from "swr";
import { Subscription } from "@taquito/taquito";
import {
  useTezos,
  useRelevantAccounts,
  useAllAssetsRef,
  getBalanceSWRKey,
  confirmOperation,
} from "lib/temple/front";

export const [NewBlockTriggersProvider, useBlockTriggers] = constate(
  useNewBlockTriggers
);

function useNewBlockTriggers() {
  const tezos = useTezos();
  const allAccounts = useRelevantAccounts();
  const allAssetsRef = useAllAssetsRef();

  const triggerNewBlock = React.useCallback(() => {
    for (const acc of allAccounts) {
      for (const asset of allAssetsRef.current) {
        trigger(getBalanceSWRKey(tezos, asset, acc.publicKeyHash), true);
      }
      trigger(["delegate", tezos.checksum, acc.publicKeyHash], true);
    }
  }, [allAccounts, allAssetsRef, tezos]);

  useOnBlock(triggerNewBlock);

  const confirmOperationAndTriggerNewBlock = React.useCallback<
    typeof confirmOperation
  >(
    async (...args) => {
      const result = await confirmOperation(...args);
      triggerNewBlock();
      return result;
    },
    [triggerNewBlock]
  );

  return {
    triggerNewBlock,
    confirmOperationAndTriggerNewBlock,
  };
}

export function useOnBlock(callback: (blockHash: string) => void) {
  const tezos = useTezos();
  const blockHashRef = React.useRef<string>();

  React.useEffect(() => {
    let sub: Subscription<string>;
    spawnSub();
    return () => sub.close();

    function spawnSub() {
      sub = tezos.stream.subscribe("head");

      sub.on("data", (hash) => {
        if (blockHashRef.current && blockHashRef.current !== hash) {
          callback(hash);
        }
        blockHashRef.current = hash;
      });
      sub.on("error", (err) => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        sub.close();
        spawnSub();
      });
    }
  }, [tezos, callback]);
}
