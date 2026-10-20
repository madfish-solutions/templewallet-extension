import React, { memo, MouseEvent, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { useFirstValue } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokensListView } from 'app/templates/tokens/tokens-list-view';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosChainByChainId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SWAP_SELECT_ASSET_SCROLLABLE_ID } from '../../constants';

interface Props {
  chainId: string;
  activeField: SwapFieldName;
  publicKeyHash: string;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const TezosChainAssetsList = memo<Props>(
  ({ chainId, activeField, publicKeyHash, searchValue, onAssetSelect }) => {
    const network = useTezosChainByChainId(chainId);
    if (!network) throw new DeadEndBoundaryError();

    const showFavorites = activeField === 'output';
    const filterZeroBalances = activeField === 'input';

    const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();

    const balances = useAllAccountBalancesSelector(publicKeyHash, chainId);
    const isNonZeroBalance = useCallback(
      (slug: string) => {
        const balance = balances[slug];
        return isDefined(balance) && balance !== '0';
      },
      [balances]
    );

    const rawTokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId, showFavorites);
    const tokensSortPredicate = useFirstValue(rawTokensSortPredicate);

    const getAssetMetadata = useGetChainTokenOrGasMetadata(chainId);

    const assetsSlugs = useMemoWithCompare<string[]>(() => {
      const gasTokensSlugs: string[] = [TEZ_TOKEN_SLUG];

      return gasTokensSlugs.concat(Array.from(route3tokensSlugs)).sort(tokensSortPredicate);
    }, [tokensSortPredicate, route3tokensSlugs]);

    const filteredAssets = useMemo(() => {
      const applicableSlugs = filterZeroBalances ? assetsSlugs.filter(isNonZeroBalance) : assetsSlugs;
      return searchTezosChainAssetsWithNoMeta(searchValue, applicableSlugs, getAssetMetadata, slug => slug);
    }, [filterZeroBalances, assetsSlugs, searchValue, getAssetMetadata, isNonZeroBalance]);

    return (
      <TokensListView slugs={filteredAssets} scrollElementId={SWAP_SELECT_ASSET_SCROLLABLE_ID}>
        {slug => (
          <TezosTokenListItem
            network={network}
            publicKeyHash={publicKeyHash}
            assetSlug={slug}
            showTags={false}
            showFavoritesMark={showFavorites}
            onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))}
          />
        )}
      </TokensListView>
    );
  }
);
