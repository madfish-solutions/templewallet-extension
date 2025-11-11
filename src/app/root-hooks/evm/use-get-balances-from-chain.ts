import { useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { fetchBalancesViaMulticall } from 'lib/evm/on-chain/multicall-balances';
import { EvmAssetStandard } from 'lib/evm/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useEnabledEvmChains } from 'temple/front';

type TokenStandard = Exclude<EvmAssetStandard, EvmAssetStandard.NATIVE>;

export const useGetBalancesFromChain = (publicKeyHash: HexString, apiIsApplicable: (chainId: number) => boolean) => {
  const chains = useEnabledEvmChains();
  const rawBalances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const evmTokensMetadata = useEvmTokensMetadataRecordSelector();
  const evmCollectiblesMetadata = useEvmCollectiblesMetadataRecordSelector();

  const rawBalancesRef = useUpdatableRef(rawBalances);
  const evmTokensMetadataRef = useUpdatableRef(evmTokensMetadata);
  const evmCollectiblesMetadataRef = useUpdatableRef(evmCollectiblesMetadata);

  return useCallback(
    async (walletAddress: HexString, chainId: number, assetSlugsOverride?: string[]) => {
      let assetsSlugs = assetSlugsOverride ?? Object.keys(rawBalancesRef.current[chainId] ?? {});

      if (assetsSlugs.length === 0) {
        assetsSlugs = [EVM_TOKEN_SLUG];
      }

      const network = chains.find(chain => chain.chainId === chainId);

      if (!network) {
        return { error: new Error(`Network ${chainId} is not enabled`) };
      }

      const throwOnTimeout = apiIsApplicable(chainId);
      const descriptors = assetsSlugs.map(assetSlug => ({
        assetSlug,
        standard: (evmTokensMetadataRef.current[chainId]?.[assetSlug]?.standard ??
          evmCollectiblesMetadataRef.current[chainId]?.[assetSlug]?.standard) as TokenStandard
      }));

      const batchableRequests = descriptors.filter(
        descriptor => isDefined(descriptor.standard) && !isEvmNativeTokenSlug(descriptor.assetSlug)
      );

      let multicallBalances: StringRecord = {};
      let multicallFailures: StringRecord<Error> = {};

      if (batchableRequests.length > 0) {
        try {
          const result = await fetchBalancesViaMulticall(network, walletAddress, batchableRequests, { throwOnTimeout });
          multicallBalances = result.balances;
          multicallFailures = result.failed;
        } catch (err) {
          console.warn('Multicall balance batch failed, retrying sequentially', err);
          multicallFailures = batchableRequests.reduce<StringRecord<Error>>((acc, { assetSlug }) => {
            acc[assetSlug] = err instanceof Error ? err : new Error(String(err));
            return acc;
          }, {});
        }
      }

      const fallbackSlugs = new Set([
        ...descriptors
          .filter(({ assetSlug, standard }) => !standard || isEvmNativeTokenSlug(assetSlug))
          .map(d => d.assetSlug),
        ...Object.keys(multicallFailures)
      ]);

      const fallbackRequests = Array.from(fallbackSlugs).map(assetSlug => ({
        assetSlug,
        standard: descriptors.find(descriptor => descriptor.assetSlug === assetSlug)?.standard
      }));

      const fallbackResults = await Promise.allSettled(
        fallbackRequests.map(({ assetSlug, standard }) =>
          evmOnChainBalancesRequestsExecutor
            .executeRequest({
              network,
              assetSlug,
              account: walletAddress,
              assetStandard: standard,
              throwOnTimeout
            })
            .then(result => result.toFixed())
        )
      );

      const balances: StringRecord = { ...multicallBalances };
      let firstError: Error | undefined;

      fallbackResults.forEach((result, index) => {
        const { assetSlug } = fallbackRequests[index];

        if (result.status === 'fulfilled') {
          balances[assetSlug] = result.value;
          return;
        }

        const reason = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        if (!firstError) {
          firstError = reason;
        }
      });

      Object.entries(multicallFailures).forEach(([assetSlug, reason]) => {
        if (!(assetSlug in balances) && !firstError) {
          firstError = reason;
        }
      });

      const dataIsEmpty = Object.keys(balances).length === 0;
      const error = firstError;

      if (dataIsEmpty) {
        return { error };
      }

      console.info(`Successfully fetched balances from node for chainId: ${network.chainId}`);

      return {
        data: balances,
        error
      };
    },
    [evmCollectiblesMetadataRef, evmTokensMetadataRef, rawBalancesRef, chains, apiIsApplicable]
  );
};
