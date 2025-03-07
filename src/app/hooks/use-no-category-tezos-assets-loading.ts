import { useMemo } from 'react';

import { dispatch } from 'app/store';
import { refreshNoCategoryTezosAssetsMetadataActions } from 'app/store/tezos/no-category-assets-metadata/actions';
import { useNoCategoryTezosAssetsMetadataLoadingSelector } from 'app/store/tezos/no-category-assets-metadata/selectors';
import { NO_CATEGORY_ASSETS_METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInterval, useUpdatableRef } from 'lib/ui/hooks';
import { useAllTezosChains } from 'temple/front';

export const useNoCategoryTezosAssetsLoading = (publicKeyHash: string) => {
  const allTezosChains = useAllTezosChains();
  const rpcUrls = useMemo(
    () => Object.fromEntries(Object.entries(allTezosChains).map(([chainId, { rpcBaseURL }]) => [chainId, rpcBaseURL])),
    [allTezosChains]
  );
  const loading = useNoCategoryTezosAssetsMetadataLoadingSelector();
  const loadingRef = useUpdatableRef(loading);

  useInterval(
    () => {
      !loadingRef.current &&
        dispatch(
          refreshNoCategoryTezosAssetsMetadataActions.submit({
            associatedAccountPkh: publicKeyHash,
            rpcUrls
          })
        );
    },
    [loadingRef, publicKeyHash, rpcUrls],
    NO_CATEGORY_ASSETS_METADATA_SYNC_INTERVAL
  );
};
