import { memo, MouseEvent, useCallback, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokensListView } from 'app/templates/tokens/tokens-list-view';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosChainByChainId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SELECT_ASSET_SCROLLABLE_ID } from './constants';

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
    (slug: string) => (
      <TezosTokenListItem
        network={network}
        publicKeyHash={publicKeyHash}
        assetSlug={slug}
        showTags={false}
        onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))}
      />
    ),
    [chainId, network, onAssetSelect, publicKeyHash]
  );

  return (
    <TokensListView slugs={searchedSlugs} scrollElementId={SELECT_ASSET_SCROLLABLE_ID}>
      {renderListItem}
    </TokensListView>
  );
});
