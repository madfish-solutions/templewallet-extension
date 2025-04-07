import { memo, useEffect, useRef } from 'react';

import { once } from 'lodash';
import * as ViemUtils from 'viem/utils';

import { dispatch } from 'app/store';
import { setEvmTokensMetadataLoading } from 'app/store/evm/actions';
import { useEvmStoredTokensRecordSelector } from 'app/store/evm/assets/selectors';
import { EvmStoredAssetsRecords } from 'app/store/evm/assets/state';
import { useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import {
  processLoadedEvmTokensMetadataAction,
  putEvmTokensMetadataAction
} from 'app/store/evm/tokens-metadata/actions';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { isValidFetchedEvmMetadata } from 'app/store/evm/tokens-metadata/utils';
import { getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { fetchEvmTokensMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { useUpdatableRef } from 'lib/ui/hooks';
import { EvmChain, useEnabledEvmChains } from 'temple/front';

export const AppEvmTokensMetadataLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const prevPkhRef = useRef('');
  const evmChains = useEnabledEvmChains();
  const prevEvmChainsRef = useRef<EvmChain[]>([]);
  const isLoading = useEvmTokensMetadataLoadingSelector();
  const isLoadingRef = useUpdatableRef(isLoading);

  const storedTokensRecord = useEvmStoredTokensRecordSelector();
  const prevStoredTokensRef = useRef<EvmStoredAssetsRecords>({});
  const tokensMetadataRecord = useEvmTokensMetadataRecordSelector();

  const checkedRef = useRef<Record<number, string[]>>({});

  useEffect(() => {
    if (
      prevPkhRef.current === publicKeyHash &&
      prevEvmChainsRef.current === evmChains &&
      prevStoredTokensRef.current === storedTokensRecord
    ) {
      return;
    }

    prevPkhRef.current = publicKeyHash;
    prevEvmChainsRef.current = evmChains;
    prevStoredTokensRef.current = storedTokensRecord;

    if (isLoadingRef.current) return;

    const currentAccountTokens = storedTokensRecord[publicKeyHash];

    const dispatchSetEvmTokensMetadataLoadingToTrue = once(() => dispatch(setEvmTokensMetadataLoading(true)));

    Promise.allSettled(
      evmChains.map(chain => {
        const { chainId } = chain;

        const chainTokensRecord = currentAccountTokens?.[chainId];
        const chainMetadataRecord = tokensMetadataRecord[chainId];

        const allSlugs = chainTokensRecord ? Object.keys(chainTokensRecord) : [];
        const checkedSlugs = checkedRef.current[chainId] ?? [];

        const slugsWithoutMeta = allSlugs.filter(slug => !chainMetadataRecord?.[slug] && !checkedSlugs.includes(slug));

        if (!slugsWithoutMeta.length) return;

        checkedRef.current[chainId] = checkedSlugs.concat(slugsWithoutMeta);

        dispatchSetEvmTokensMetadataLoadingToTrue();

        if (isSupportedChainId(chainId)) {
          return getEvmTokensMetadata(publicKeyHash, chainId).then(data => {
            dispatch(processLoadedEvmTokensMetadataAction({ chainId, data }));

            const slugsLeftWithoutMeta = data.items
              .filter(item => !isValidFetchedEvmMetadata(item))
              .map(item => toTokenSlug(ViemUtils.getAddress(item.contract_address)))
              .filter(slug => slugsWithoutMeta.includes(slug));

            if (!slugsLeftWithoutMeta.length) return;

            return loadEvmTokensMetadataFromChain(slugsLeftWithoutMeta, chain);
          });
        }

        return loadEvmTokensMetadataFromChain(slugsWithoutMeta, chain);
      })
    ).then(() => void dispatch(setEvmTokensMetadataLoading(false)));
  }, [evmChains, storedTokensRecord, publicKeyHash, isLoadingRef, tokensMetadataRecord]);

  return null;
});

function loadEvmTokensMetadataFromChain(slugsWithoutMeta: string[], chain: EvmChain) {
  return fetchEvmTokensMetadataFromChain(chain, slugsWithoutMeta).then(
    fetchedMetadata => void dispatch(putEvmTokensMetadataAction({ chainId: chain.chainId, records: fetchedMetadata })),
    error => void console.error(error)
  );
}
