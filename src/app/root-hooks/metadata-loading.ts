import { memo, useEffect } from 'react';

import { dispatch } from 'app/store';
import { useAllTokensSelector } from 'app/store/tezos/assets/selectors';
import { getAccountAssetsStoreKey } from 'app/store/tezos/assets/utils';
import { putTokensMetadataAction, setTokensMetadataLoadingAction } from 'app/store/tezos/tokens-metadata/actions';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { useGetTokenMetadata } from 'lib/metadata';
import { loadTokensMetadata } from 'lib/metadata/fetch';
import { useMetadataLoadAttempts } from 'lib/metadata/load-attempts';
import { useEnabledTezosChains } from 'temple/front';

export const AppTezosTokensMetadataLoading = memo<{ publicKeyHash: string }>(({ publicKeyHash }) => {
  const tezosChains = useEnabledTezosChains();
  const allTokens = useAllTokensSelector();
  const getMetadata = useGetTokenMetadata();
  const isLoading = useTokensMetadataLoadingSelector();
  const { attempts, retryTick } = useMetadataLoadAttempts();

  useEffect(() => {
    if (isLoading) dispatch(setTokensMetadataLoadingAction(false));

    return () => void dispatch(setTokensMetadataLoadingAction(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;

    let willLoad = false;

    const fetchers = tezosChains.flatMap(chain => {
      const key = getAccountAssetsStoreKey(publicKeyHash, chain.chainId);
      const tokensRecord = allTokens[key];
      const slugs = tokensRecord ? Object.keys(tokensRecord) : [];
      const slugsWithoutMeta = slugs.filter(slug => !getMetadata(slug) && attempts.isDue(slug));

      if (!slugsWithoutMeta.length) return [];

      if (!willLoad) {
        willLoad = true;
        dispatch(setTokensMetadataLoadingAction(true));
      }

      const fetcher = loadTokensMetadata(chain, slugsWithoutMeta).then(
        fetchedMetadata => void dispatch(putTokensMetadataAction({ records: fetchedMetadata }))
      );

      return [attempts.track(slugsWithoutMeta, fetcher)];
    });

    Promise.allSettled(fetchers).then(() => void dispatch(setTokensMetadataLoadingAction(false)));
  }, [tezosChains, allTokens, publicKeyHash, attempts, retryTick]);

  return null;
});
