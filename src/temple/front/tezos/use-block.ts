import { useEffect, useRef, useState } from 'react';

import { Subscription, TezosToolkit } from '@taquito/taquito';

import { useUpdatableRef } from 'lib/ui/hooks';
import { getReadOnlyTezos } from 'temple/tezos';

import { useTezosNetworkRpcUrl } from '../networks';

export function useOnTezosBlock(callback: (blockHash: string) => void, altTezos?: TezosToolkit, pause = false) {
  const rpcUrl = useTezosNetworkRpcUrl();

  const blockHashRef = useRef<string>();
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (pause) return;

    const tezos = altTezos || getReadOnlyTezos(rpcUrl);

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
  }, [pause, rpcUrl, altTezos]);
}

export const useTezosBlockLevel = () => {
  const rpcUrl = useTezosNetworkRpcUrl();

  const [blockLevel, setBlockLevel] = useState<number>();

  useEffect(() => {
    const tezos = getReadOnlyTezos(rpcUrl);

    const subscription = tezos.stream.subscribeBlock('head');

    subscription.on('data', block => setBlockLevel(block.header.level));

    return () => subscription.close();
  }, [rpcUrl]);

  return blockLevel;
};
