import { useEffect, useRef } from 'react';

import { Subscription, TezosToolkit } from '@taquito/taquito';

import { useUpdatableRef } from 'lib/ui/hooks';

import { useTezos } from './ready';

export function useOnBlock(callback: (blockHash: string) => void, altTezos?: TezosToolkit, pause = false) {
  const currentTezos = useTezos();
  const blockHashRef = useRef<string>();
  const callbackRef = useUpdatableRef(callback);

  const tezos = altTezos || currentTezos;

  useEffect(() => {
    if (pause) return;

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
  }, [pause, tezos]);
}
