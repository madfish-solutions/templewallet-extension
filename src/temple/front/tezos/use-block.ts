import { useEffect, useRef, useState } from 'react';

import { Subscription } from '@taquito/taquito';

import { useUpdatableRef } from 'lib/ui/hooks';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';

export function useOnTezosBlock(network: TezosNetworkEssentials, callback: (blockHash: string) => void, pause = false) {
  const blockHashRef = useRef<string>();
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (pause) return;

    const tezos = getTezosReadOnlyRpcClient(network);

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
  }, [pause, network]);
}

export const useTezosBlockLevel = (network: TezosNetworkEssentials) => {
  const [blockLevel, setBlockLevel] = useState<number>();

  useEffect(() => {
    const tezos = getTezosReadOnlyRpcClient(network);

    const subscription = tezos.stream.subscribeBlock('head');

    subscription.on('data', block => {
      setBlockLevel(block.header.level);
    });

    return () => subscription.close();
  }, [network]);

  return blockLevel;
};
