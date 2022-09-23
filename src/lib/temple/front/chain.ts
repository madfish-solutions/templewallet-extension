import { useCallback, useEffect, useRef } from 'react';

import { Subscription } from '@taquito/taquito';
import constate from 'constate';
import { useSWRConfig } from 'swr';

import { confirmOperation } from 'lib/temple/operation';

import { getBalanceSWRKey } from './balance';
import { useTezos, useRelevantAccounts } from './ready';

export const [NewBlockTriggersProvider, useBlockTriggers] = constate(useNewBlockTriggers);

function useNewBlockTriggers() {
  const { mutate } = useSWRConfig();
  const tezos = useTezos();
  const allAccounts = useRelevantAccounts();

  const triggerNewBlock = useCallback(() => {
    for (const acc of allAccounts) {
      mutate(getBalanceSWRKey(tezos, 'tez', acc.publicKeyHash));
      mutate(['delegate', tezos.checksum, acc.publicKeyHash]);
    }
  }, [allAccounts, mutate, tezos]);

  useOnBlock(triggerNewBlock);

  const confirmOperationAndTriggerNewBlock = useCallback<typeof confirmOperation>(
    async (...args) => {
      const result = await confirmOperation(...args);
      triggerNewBlock();
      return result;
    },
    [triggerNewBlock]
  );

  return {
    triggerNewBlock,
    confirmOperationAndTriggerNewBlock
  };
}

export function useOnBlock(callback: (blockHash: string) => void) {
  const tezos = useTezos();
  const blockHashRef = useRef<string>();

  useEffect(() => {
    let sub: Subscription<string>;
    spawnSub();
    return () => sub.close();

    function spawnSub() {
      sub = tezos.stream.subscribe('head');

      sub.on('data', hash => {
        if (blockHashRef.current && blockHashRef.current !== hash) {
          callback(hash);
        }
        blockHashRef.current = hash;
      });
      sub.on('error', err => {
        console.error(err);
        sub.close();
        spawnSub();
      });
    }
  }, [tezos, callback]);
}
