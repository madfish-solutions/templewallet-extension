import { useMemo } from 'react';

import { useAllAccounts } from 'lib/temple/front/ready';
import { TempleAccountType } from 'lib/temple/types';

/** Filters out Tezos accounts, irrelevant for given Chain ID */
export function useRelevantAccounts(tezosChainId: string) {
  const allAccounts = useAllAccounts();

  return useMemo(
    () =>
      allAccounts.filter(acc => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return (
              Boolean(acc.tezosAddress) && // To know if logic (interface) remained
              acc.chainId === tezosChainId
            );

          case TempleAccountType.WatchOnly:
            return acc.chain === 'tezos' ? !acc.chainId || acc.chainId === tezosChainId : true;

          default:
            return true;
        }
      }),
    [tezosChainId, allAccounts]
  );
}
