import React, { memo, useMemo, MouseEvent } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { useTezosAccountTokensForListing } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { TezosListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useAllTezosChains } from 'temple/front';

interface Props {
  publicKeyHash: string;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const TezosAssetsList = memo<Props>(({ publicKeyHash, searchValue, onAssetSelect }) => {
  const { enabledChainsSlugsSorted } = useTezosAccountTokensForListing(publicKeyHash, false);

  const tezosChains = useAllTezosChains();

  const getMetadata = useGetTokenOrGasMetadata();

  const searchedSlugs = useMemo(
    () => searchTezosAssetsWithNoMeta(searchValue, enabledChainsSlugsSorted, getMetadata, getSlugWithChainId),
    [enabledChainsSlugsSorted, getMetadata, searchValue]
  );

  return (
    <>
      {searchedSlugs.length === 0 && <EmptyState variant="searchUniversal" />}

      {searchedSlugs.map(chainSlug => {
        const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

        return (
          <TezosListItem
            network={tezosChains[chainId]}
            key={chainSlug}
            publicKeyHash={publicKeyHash}
            assetSlug={assetSlug}
            showTags={false}
            onClick={e => onAssetSelect(e, chainSlug)}
          />
        );
      })}
    </>
  );
});
