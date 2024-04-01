import { useEffect } from 'react';

import { useTezosNetwork } from 'temple/front';
import { loadTezosChainId } from 'temple/tezos';

export const useTezosChainIdCheck = () => {
  const { rpcUrl, chainId, name } = useTezosNetwork();

  useEffect(
    () =>
      void loadTezosChainId(rpcUrl).then(chid => {
        if (chid !== chainId)
          alert(
            `Warning! Tezos RPC '${name}'(${rpcUrl}) has changed its network. Please, remove it & add again if needed.`
          );
      }),
    [rpcUrl, chainId, name]
  );
};
