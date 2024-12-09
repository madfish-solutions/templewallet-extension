import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { EvmListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface Props {
  publicKeyHash: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const EvmAssetsList = memo<Props>(({ publicKeyHash, searchValue, onAssetSelect }) => {
  const enabledChains = useEnabledEvmChains();
  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);
  const tokensSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const enabledEvmAssetsSlugs = useMemo(
    () =>
      enabledChains
        .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
        .concat(tokensSlugs),
    [enabledChains, tokensSlugs]
  );

  const enabledEvmAssetsSlugsSorted = useMemoWithCompare(
    () => enabledEvmAssetsSlugs.sort(tokensSortPredicate),
    [enabledEvmAssetsSlugs, tokensSortPredicate]
  );

  const allEvmChains = useAllEvmChains();
  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (chainId: number, slug: string) =>
      slug === EVM_TOKEN_SLUG ? allEvmChains[chainId]?.currency : metadata[chainId]?.[slug],
    [allEvmChains, metadata]
  );

  const searchedSlugs = useMemo(
    () => searchEvmTokensWithNoMeta(searchValue, enabledEvmAssetsSlugsSorted, getMetadata, getSlugWithChainId),
    [enabledEvmAssetsSlugsSorted, getMetadata, searchValue]
  );

  return (
    <>
      {searchedSlugs.length === 0 && <EmptyState />}

      {searchedSlugs.map(chainSlug => {
        const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

        return (
          <EvmListItem
            key={chainSlug}
            network={allEvmChains[chainId]}
            assetSlug={assetSlug}
            publicKeyHash={publicKeyHash}
            onClick={e => onAssetSelect(e, chainSlug)}
          />
        );
      })}
    </>
  );
});
