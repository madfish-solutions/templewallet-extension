import { memo, useEffect } from 'react';

import { once } from 'lodash';
import * as ViemUtils from 'viem/utils';

import { dispatch } from 'app/store';
import { setEvmTokensMetadataLoading } from 'app/store/evm/actions';
import { useEvmStoredTokensRecordSelector } from 'app/store/evm/assets/selectors';
import { useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import {
  processLoadedEvmTokensMetadataAction,
  putEvmTokensMetadataAction
} from 'app/store/evm/tokens-metadata/actions';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { isValidFetchedEvmMetadata } from 'app/store/evm/tokens-metadata/utils';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { toChainAssetSlug } from 'lib/assets/utils';
import { fetchEvmTokensMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { useMetadataLoadAttempts } from 'lib/metadata/load-attempts';
import { useUpdatableRef } from 'lib/ui/hooks';
import { EvmChain, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const AppEvmTokensMetadataLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const evmChains = useEnabledEvmChains();
  const isLoading = useEvmTokensMetadataLoadingSelector();
  const isLoadingRef = useUpdatableRef(isLoading);
  const isTestnetMode = useTestnetModeEnabledSelector();

  const storedTokensRecord = useEvmStoredTokensRecordSelector();
  const tokensMetadataRecord = useEvmTokensMetadataRecordSelector();
  const tokensMetadataRecordRef = useUpdatableRef(tokensMetadataRecord);
  const { attempts, retryTick } = useMetadataLoadAttempts();

  useEffect(() => {
    if (isLoadingRef.current) return;

    const currentAccountTokens = storedTokensRecord[publicKeyHash];

    const dispatchSetEvmTokensMetadataLoadingToTrue = once(() => dispatch(setEvmTokensMetadataLoading(true)));

    const fetchers = evmChains.flatMap(chain => {
      const { chainId } = chain;

      const chainTokensRecord = currentAccountTokens?.[chainId];
      const chainMetadataRecord = tokensMetadataRecordRef.current[chainId];

      const allSlugs = chainTokensRecord ? Object.keys(chainTokensRecord) : [];

      const slugsWithoutMeta = allSlugs.filter(
        slug => !chainMetadataRecord?.[slug] && attempts.isDue(toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
      );

      if (!slugsWithoutMeta.length) return [];

      dispatchSetEvmTokensMetadataLoadingToTrue();

      const fetcher =
        isSupportedChainId(chainId) && !isTestnetMode
          ? getEvmTokensMetadata(publicKeyHash, chainId).then(data => {
              dispatch(processLoadedEvmTokensMetadataAction({ chainId, data }));

              const slugsLeftWithoutMeta = data.items
                .filter(item => !isValidFetchedEvmMetadata(item))
                .map(item => toTokenSlug(ViemUtils.getAddress(item.contract_address)))
                .filter(slug => slugsWithoutMeta.includes(slug));

              if (!slugsLeftWithoutMeta.length) return;

              return loadEvmTokensMetadataFromChain(slugsLeftWithoutMeta, chain);
            })
          : loadEvmTokensMetadataFromChain(slugsWithoutMeta, chain);

      return [
        attempts.track(
          slugsWithoutMeta.map(slug => toChainAssetSlug(TempleChainKind.EVM, chainId, slug)),
          fetcher
        )
      ];
    });

    Promise.allSettled(fetchers).then(() => void dispatch(setEvmTokensMetadataLoading(false)));
  }, [
    evmChains,
    isLoadingRef,
    tokensMetadataRecordRef,
    storedTokensRecord,
    publicKeyHash,
    isTestnetMode,
    attempts,
    retryTick
  ]);

  return null;
});

function loadEvmTokensMetadataFromChain(slugsWithoutMeta: string[], chain: EvmChain) {
  return fetchEvmTokensMetadataFromChain(chain, slugsWithoutMeta).then(
    fetchedMetadata => void dispatch(putEvmTokensMetadataAction({ chainId: chain.chainId, records: fetchedMetadata }))
  );
}
