import { memo, useMemo, MouseEvent, useCallback } from 'react';

import { useTezosAccountTokensForListing } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokensListView } from 'app/templates/tokens/tokens-list-view';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useAllTezosChains } from 'temple/front';

import { SELECT_ASSET_SCROLLABLE_ID } from './constants';

interface Props {
  publicKeyHash: string;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const TezosAssetsList = memo<Props>(({ publicKeyHash, searchValue, onAssetSelect }) => {
  const { enabledChainSlugsSorted } = useTezosAccountTokensForListing(publicKeyHash, false, false);

  const tezosChains = useAllTezosChains();

  const getMetadata = useGetTokenOrGasMetadata();

  const searchedSlugs = useMemo(
    () => searchTezosAssetsWithNoMeta(searchValue, enabledChainSlugsSorted, getMetadata, getSlugWithChainId),
    [enabledChainSlugsSorted, getMetadata, searchValue]
  );

  const renderListItem = useCallback(
    (slug: string) => {
      const [_, chainId, assetSlug] = parseChainAssetSlug(slug);

      return (
        <TezosTokenListItem
          network={tezosChains[chainId]}
          publicKeyHash={publicKeyHash}
          assetSlug={assetSlug}
          showTags={false}
          onClick={e => onAssetSelect(e, slug)}
        />
      );
    },
    [onAssetSelect, publicKeyHash, tezosChains]
  );

  return (
    <TokensListView slugs={searchedSlugs} scrollElementId={SELECT_ASSET_SCROLLABLE_ID}>
      {renderListItem}
    </TokensListView>
  );
});
