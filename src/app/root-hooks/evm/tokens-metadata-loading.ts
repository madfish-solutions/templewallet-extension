import { memo, useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { setEvmTokensMetadataLoading } from 'app/store/evm/actions';
import { useEvmStoredTokensRecordSelector } from 'app/store/evm/assets/selectors';
import { useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import {
  processLoadedEvmTokensMetadataAction,
  putEvmTokensMetadataAction
} from 'app/store/evm/tokens-metadata/actions';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm/api';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { fetchEvmTokensMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { useEnabledEvmChains } from 'temple/front';

export const AppEvmTokensMetadataLoading = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  const evmChains = useEnabledEvmChains();
  const isLoading = useEvmTokensMetadataLoadingSelector();

  const storedTokensRecord = useEvmStoredTokensRecordSelector();
  const tokensMetadataRecord = useEvmTokensMetadataRecordSelector();

  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (isLoading) return;

    Promise.allSettled(
      evmChains.map(chain => {
        const { chainId } = chain;

        const currentAccountTokens = storedTokensRecord[publicKeyHash];
        const chainTokensRecord = currentAccountTokens?.[chainId];
        const chainMetadataRecord = tokensMetadataRecord[chainId];

        const slugs = chainTokensRecord ? Object.keys(chainTokensRecord) : [];
        const slugsWithoutMeta = slugs.filter(
          slug => !chainMetadataRecord?.[slug] && !checkedRef.current.includes(slug)
        );

        if (!slugsWithoutMeta.length) return null;

        checkedRef.current = checkedRef.current.concat(slugsWithoutMeta);

        dispatch(setEvmTokensMetadataLoading(true));

        if (isSupportedChainId(chainId)) {
          return getEvmTokensMetadata(publicKeyHash, chainId).then(data => {
            dispatch(processLoadedEvmTokensMetadataAction({ chainId, data }));
          });
        }

        return fetchEvmTokensMetadataFromChain(chain, slugsWithoutMeta).then(
          fetchedMetadata => void dispatch(putEvmTokensMetadataAction({ chainId, records: fetchedMetadata })),
          error => void console.error(error)
        );
      })
    ).then(() => void dispatch(setEvmTokensMetadataLoading(false)));
  }, [evmChains, storedTokensRecord, publicKeyHash]);

  return null;
});
