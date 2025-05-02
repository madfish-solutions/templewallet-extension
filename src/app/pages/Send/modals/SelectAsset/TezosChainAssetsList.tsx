import React, { memo, MouseEvent, RefObject, useCallback, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useTezosChainByChainId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TokensListView } from './tokens-list-view';

interface Props {
  chainId: string;
  publicKeyHash: string;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const TezosChainAssetsList = memo<Props>(({ chainId, publicKeyHash, searchValue, onAssetSelect }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, chainId);

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);

  const assetsSlugs = useMemoWithCompare<string[]>(() => {
    const gasTokensSlugs: string[] = [TEZ_TOKEN_SLUG];

    return gasTokensSlugs.concat(Array.from(tokensSlugs).sort(tokensSortPredicate));
  }, [tokensSortPredicate, tokensSlugs]);

  const getAssetMetadata = useGetChainTokenOrGasMetadata(chainId);

  const searchedSlugs = useMemo(
    () => searchTezosChainAssetsWithNoMeta(searchValue, assetsSlugs, getAssetMetadata, s => s),
    [assetsSlugs, getAssetMetadata, searchValue]
  );

  const renderListItem = useCallback(
    (slug: string, index: number, ref?: RefObject<TokenListItemElement>) => (
      <TezosTokenListItem
        key={slug}
        index={index}
        network={network}
        publicKeyHash={publicKeyHash}
        assetSlug={slug}
        showTags={false}
        onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))}
        ref={ref}
      />
    ),
    [chainId, network, onAssetSelect, publicKeyHash]
  );

  return <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>;
});
