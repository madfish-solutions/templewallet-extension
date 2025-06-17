import { useCallback } from 'react';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useEnabledEvmChains } from 'temple/front';

export const useGetBalancesFromChain = (publicKeyHash: HexString, apiIsApplicable: (chainId: number) => boolean) => {
  const chains = useEnabledEvmChains();
  const rawBalances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const evmTokensMetadata = useEvmTokensMetadataRecordSelector();
  const evmCollectiblesMetadata = useEvmCollectiblesMetadataRecordSelector();

  const rawBalancesRef = useUpdatableRef(rawBalances);
  const evmTokensMetadataRef = useUpdatableRef(evmTokensMetadata);
  const evmCollectiblesMetadataRef = useUpdatableRef(evmCollectiblesMetadata);

  return useCallback(
    async (walletAddress: HexString, chainId: number) => {
      let assetsSlugs = Object.keys(rawBalancesRef.current[chainId] ?? {});

      if (assetsSlugs.length === 0) {
        assetsSlugs = [EVM_TOKEN_SLUG];
      }

      const results = await Promise.allSettled(
        assetsSlugs.map(assetSlug =>
          evmOnChainBalancesRequestsExecutor
            .executeRequest({
              network: {
                chainId,
                rpcBaseURL: chains.find(chain => chain.chainId === chainId)!.rpcBaseURL
              },
              assetSlug,
              account: walletAddress,
              assetStandard:
                evmTokensMetadataRef.current[chainId]?.[assetSlug]?.standard ??
                evmCollectiblesMetadataRef.current[chainId]?.[assetSlug]?.standard,
              throwOnTimeout: apiIsApplicable(chainId)
            })
            .then(result => result.toFixed())
        )
      );
      const dataIsEmpty = !results.some(result => result.status === 'fulfilled');
      const error = results.find((res): res is PromiseRejectedResult => res.status === 'rejected')?.reason;

      if (dataIsEmpty) {
        return { error };
      }

      return {
        data: results.reduce<StringRecord>((acc, result, index) => {
          if (result.status === 'fulfilled') {
            const assetSlug = assetsSlugs[index];
            acc[assetSlug] = result.value;
          }

          return acc;
        }, {}),
        error
      };
    },
    [evmCollectiblesMetadataRef, evmTokensMetadataRef, rawBalancesRef, chains, apiIsApplicable]
  );
};
