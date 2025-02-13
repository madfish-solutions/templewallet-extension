import { useMemo } from 'react';

import { dispatch } from 'app/store';
import { refreshNoCategoryEvmAssetsMetadataActions } from 'app/store/evm/no-category-assets-metadata/actions';
import { useEvmNoCategoryAssetsMetadataLoadingSelector } from 'app/store/evm/no-category-assets-metadata/selectors';
import { NO_CATEGORY_ASSETS_METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useInterval, useUpdatableRef } from 'lib/ui/hooks';
import { useAllEvmChains } from 'temple/front';

export const useNoCategoryEvmAssetsLoading = (publicKeyHash: HexString) => {
  const allEvmChains = useAllEvmChains();
  const rpcUrls = useMemo(
    () => Object.fromEntries(Object.entries(allEvmChains).map(([chainId, { rpcBaseURL }]) => [chainId, rpcBaseURL])),
    [allEvmChains]
  );
  const loading = useEvmNoCategoryAssetsMetadataLoadingSelector();
  const loadingRef = useUpdatableRef(loading);

  useInterval(
    () => {
      !loadingRef.current &&
        dispatch(
          refreshNoCategoryEvmAssetsMetadataActions.submit({
            associatedAccountPkh: publicKeyHash,
            rpcUrls
          })
        );
    },
    [publicKeyHash, rpcUrls, loadingRef],
    NO_CATEGORY_ASSETS_METADATA_SYNC_INTERVAL,
    false
  );
};
