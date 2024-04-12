import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { useAllTokensSelector } from 'app/store/assets/selectors';
import { getAccountAssetsStoreKey } from 'app/store/assets/utils';
import { putTokensMetadataAction, setTokensMetadataLoadingAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { useGetTokenMetadata } from 'lib/metadata';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useAllTezosChains } from 'temple/front';

export const useMetadataLoading = (publicKeyHash: string) => {
  const allTezosNetworks = useAllTezosChains();
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
      Object.values(allTezosNetworks).map(network => {
        const key = getAccountAssetsStoreKey(publicKeyHash, network.chainId);
        const tokensRecord = allTokens[key];
        const slugs = tokensRecord ? Object.keys(tokensRecord) : [];
        const slugsWithoutMeta = slugs.filter(slug => !getMetadata(slug) && !checkedRef.current.includes(slug));

        if (!slugsWithoutMeta.length) return null;

        if (!willLoad) {
          willLoad = true;
          dispatch(setTokensMetadataLoadingAction(true));
        }

        return loadTokensMetadata(network.rpcBaseURL, slugsWithoutMeta).then(
          fetchedMetadata => {
            checkedRef.current = checkedRef.current.concat(slugsWithoutMeta);
            dispatch(putTokensMetadataAction({ records: fetchedMetadata }));
          },
          error => {
            console.error(error);
          }
        );
      })
    ).then(() => void dispatch(setTokensMetadataLoadingAction(false)));
  }, [allTezosNetworks, allTokens, getMetadata, isLoading, publicKeyHash]);
};
