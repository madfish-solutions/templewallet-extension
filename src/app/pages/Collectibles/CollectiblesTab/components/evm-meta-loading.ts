import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { setEvmCollectiblesMetadataLoading } from 'app/store/evm/actions';
import { useEvmStoredCollectiblesRecordSelector } from 'app/store/evm/assets/selectors';
import {
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction
} from 'app/store/evm/collectibles-metadata/actions';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { getEvmCollectiblesMetadata } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { fetchEvmCollectiblesMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { useEnabledEvmChains } from 'temple/front';

/** TODO: Might wanna tune this loading logic either via pagination or queueing.
 * Pagination for Collectibles is planned for the future.
 */
export const useEvmCollectiblesMetadataLoading = (publicKeyHash: HexString) => {
  const evmChains = useEnabledEvmChains();
  const isLoading = useEvmCollectiblesMetadataLoadingSelector();

  const storedCollectiblesRecord = useEvmStoredCollectiblesRecordSelector();
  const collectiblesMetadataRecord = useEvmCollectiblesMetadataRecordSelector();

  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (isLoading) return;

    Promise.allSettled(
      evmChains.map(async chain => {
        const { chainId } = chain;

        const currentAccountCollectibles = storedCollectiblesRecord[publicKeyHash];
        const chainCollectiblesRecord = currentAccountCollectibles?.[chainId];
        const chainMetadataRecord = collectiblesMetadataRecord[chainId];

        const slugs = chainCollectiblesRecord ? Object.keys(chainCollectiblesRecord) : [];
        const slugsWithoutMeta = slugs.filter(
          slug => !chainMetadataRecord?.[slug] && !checkedRef.current.includes(slug)
        );

        if (!slugsWithoutMeta.length) return null;

        checkedRef.current = checkedRef.current.concat(slugsWithoutMeta);

        dispatch(setEvmCollectiblesMetadataLoading(true));

        if (isSupportedChainId(chainId))
          try {
            return await getEvmCollectiblesMetadata(publicKeyHash, chainId).then(data => {
              dispatch(processLoadedEvmCollectiblesMetadataAction({ chainId, data }));
            });
          } catch {
            // Supported by the API chains might fall off. Happened with Eth Sepolia testnet (chain ID: 11155111)
          }

        return fetchEvmCollectiblesMetadataFromChain(chain, slugsWithoutMeta).then(
          fetchedMetadata => void dispatch(putEvmCollectiblesMetadataAction({ chainId, records: fetchedMetadata })),
          error => void console.error(error)
        );
      })
    ).then(() => void dispatch(setEvmCollectiblesMetadataLoading(false)));
  }, [evmChains, storedCollectiblesRecord, publicKeyHash]);
};
