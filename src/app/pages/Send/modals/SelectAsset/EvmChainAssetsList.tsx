import React, { memo, useMemo, MouseEvent, useCallback, RefObject } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensListView } from './tokens-list-view';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const EvmChainAssetsList = memo<Props>(({ chainId, publicKeyHash, searchValue, onAssetSelect }) => {
  const chain = useEvmChainByChainId(chainId);
  const tokensSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);
  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  if (!chain) throw new DeadEndBoundaryError();

  const enabledEvmChainAssetsSlugs = useMemo(() => {
    const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];

    return gasTokensSlugs.concat(tokensSlugs);
  }, [tokensSlugs]);

  const enabledEvmChainAssetsSlugsSorted = useMemoWithCompare(
    () => enabledEvmChainAssetsSlugs.sort(tokensSortPredicate),
    [enabledEvmChainAssetsSlugs, tokensSortPredicate]
  );

  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (slug: string) => (slug === EVM_TOKEN_SLUG ? chain?.currency : metadata[chainId]?.[slug]),
    [chain, metadata, chainId]
  );

  const searchedSlugs = useMemo(
    () => searchEvmChainTokensWithNoMeta(searchValue, enabledEvmChainAssetsSlugsSorted, getMetadata, s => s),
    [enabledEvmChainAssetsSlugsSorted, getMetadata, searchValue]
  );

  const renderListItem = useCallback(
    (slug: string, index: number, ref?: RefObject<TokenListItemElement>) => (
      <EvmTokenListItem
        key={slug}
        index={index}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        network={chain}
        onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.EVM, chainId, slug))}
        ref={ref}
      />
    ),
    [chain, chainId, onAssetSelect, publicKeyHash]
  );

  return <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>;
});
