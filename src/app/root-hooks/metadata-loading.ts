import { memo, useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { useAllTokensSelector } from 'app/store/tezos/assets/selectors';
import { getAccountAssetsStoreKey } from 'app/store/tezos/assets/utils';
import { putTokensMetadataAction, setTokensMetadataLoadingAction } from 'app/store/tezos/tokens-metadata/actions';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { useGetTokenMetadata } from 'lib/metadata';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useEnabledTezosChains } from 'temple/front';

export const AppTezosTokensMetadataLoading = memo<{ publicKeyHash: string }>(({ publicKeyHash }) => {
  const tezosChains = useEnabledTezosChains();
  const allTokens = useAllTokensSelector();
  const getMetadata = useGetTokenMetadata();
  const isLoading = useTokensMetadataLoadingSelector();

  useEffect(() => {
    if (isLoading) dispatch(setTokensMetadataLoadingAction(false));

    return () => void dispatch(setTokensMetadataLoadingAction(false));
  }, []);

  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (isLoading) return;

    let willLoad = false;

    Promise.allSettled(
      tezosChains.map(chain => {
        const key = getAccountAssetsStoreKey(publicKeyHash, chain.chainId);
        const tokensRecord = allTokens[key];
        const slugs = tokensRecord ? Object.keys(tokensRecord) : [];
        const slugsWithoutMeta = slugs.filter(slug => !getMetadata(slug) && !checkedRef.current.includes(slug));

        if (!slugsWithoutMeta.length) return null;

        checkedRef.current = checkedRef.current.concat(slugsWithoutMeta);

        if (!willLoad) {
          willLoad = true;
          dispatch(setTokensMetadataLoadingAction(true));
        }

        return loadTokensMetadata(chain, slugsWithoutMeta).then(
          fetchedMetadata => void dispatch(putTokensMetadataAction({ records: fetchedMetadata })),
          error => void console.error(error)
        );
      })
    ).then(() => void dispatch(setTokensMetadataLoadingAction(false)));
  }, [tezosChains, allTokens, publicKeyHash]);

  return null;
});
