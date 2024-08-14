import { useEffect, useRef, useState } from 'react';

import { Subscription } from '@taquito/taquito';

import { useUpdatableRef } from 'lib/ui/hooks';
import { getReadOnlyTezos } from 'temple/tezos';

export function useOnTezosBlock(rpcUrl: string, callback: (blockHash: string) => void, pause = false) {
  const blockHashRef = useRef<string>();
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (pause) return;

    const tezos = getReadOnlyTezos(rpcUrl);

    let sub: Subscription<string>;
    spawnSub();
    return () => sub.close();

    function spawnSub() {
      sub = tezos.stream.subscribe('head');

      sub.on('data', hash => {
        if (blockHashRef.current && blockHashRef.current !== hash) {
          callbackRef.current(hash);
        }
        blockHashRef.current = hash;
      });

      sub.on('error', err => {
        console.error(err);
        sub.close();
        spawnSub();
      });
    }
  }, [pause, rpcUrl]);
}

export const useTezosBlockLevel = (rpcUrl: string) => {
  const [blockLevel, setBlockLevel] = useState<number>();

  useEffect(() => {
    const tezos = getReadOnlyTezos(rpcUrl);

    const subscription = tezos.stream.subscribeBlock('head');

    subscription.on('data', block => {
      setBlockLevel(block.header.level);
    });

    return () => subscription.close();
  }, [rpcUrl]);

  return blockLevel;
};
