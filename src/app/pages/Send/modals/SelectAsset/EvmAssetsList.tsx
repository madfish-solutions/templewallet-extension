import React, { memo, useMemo, MouseEvent, useCallback, RefObject, ReactNode } from 'react';

import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TokensListView } from './tokens-list-view';

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

  const renderListItem = useCallback(
    (chainSlug: string, index: number, ref?: RefObject<TokenListItemElement | null>): ReactNode => {
      const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

      return (
        <EvmTokenListItem
          key={chainSlug}
          index={index}
          network={allEvmChains[chainId]}
          assetSlug={assetSlug}
          publicKeyHash={publicKeyHash}
          onClick={e => onAssetSelect(e, chainSlug)}
          ref={ref}
        />
      );
    },
    [allEvmChains, onAssetSelect, publicKeyHash]
  );

  return <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>;
});
