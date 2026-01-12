import React, { memo, useMemo, MouseEvent, useCallback, RefObject, ReactNode } from 'react';

import { useTezosAccountTokensForListing } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllTezosChains } from 'temple/front';

import { TokensListView } from './tokens-list-view';

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
    (slug: string, index: number, ref?: RefObject<TokenListItemElement | null>): ReactNode => {
      const [_, chainId, assetSlug] = parseChainAssetSlug(slug);

      return (
        <TezosTokenListItem
          key={slug}
          index={index}
          network={tezosChains[chainId]}
          publicKeyHash={publicKeyHash}
          assetSlug={assetSlug}
          showTags={false}
          onClick={e => onAssetSelect(e, slug)}
          ref={ref}
        />
      );
    },
    [onAssetSelect, publicKeyHash, tezosChains]
  );

  return <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>;
});
