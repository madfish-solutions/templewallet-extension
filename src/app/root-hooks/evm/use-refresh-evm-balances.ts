import { useCallback } from 'react';

import { dispatch } from 'app/store';
import { processLoadedOnchainBalancesAction } from 'app/store/evm/balances/actions';
import { EvmNetworkEssentials } from 'temple/networks';

import { useGetBalancesFromChain } from './use-get-balances-from-chain';

interface RefreshOptions {
  reason?: string;
}

export const useRefreshEvmBalances = (publicKeyHash: HexString, apiIsApplicable: (chainId: number) => boolean) => {
  const getBalancesFromChain = useGetBalancesFromChain(publicKeyHash, apiIsApplicable);

  return useCallback(
    async (network: EvmNetworkEssentials | undefined, slugs: string[], options?: RefreshOptions) => {
      if (!network) {
        if (options?.reason) {
          console.warn(`Skipping balances refresh (no network): ${options.reason}`);
        }
        return;
      }

      const uniqueSlugs = Array.from(new Set(slugs));
      if (uniqueSlugs.length === 0) return;

      try {
        const result = await getBalancesFromChain(publicKeyHash, network.chainId, uniqueSlugs);
        const data = result?.data;
        if (!data) return;

        const balances = uniqueSlugs.reduce<Record<string, string>>((acc, slug) => {
          const value = data[slug];
          if (value !== undefined) {
            acc[slug] = value;
          }

          return acc;
        }, {});

        if (Object.keys(balances).length === 0) return;

        dispatch(
          processLoadedOnchainBalancesAction({
            account: publicKeyHash,
            chainId: network.chainId,
            balances,
            timestamp: Date.now()
          })
        );
      } catch (err) {
        const context = options?.reason ? ` (${options.reason})` : '';
        console.error(`Failed to refresh balances${context}`, err);
      }
    },
    [getBalancesFromChain, publicKeyHash]
  );
};
