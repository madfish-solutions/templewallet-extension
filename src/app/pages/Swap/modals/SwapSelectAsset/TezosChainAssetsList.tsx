import React, { memo, MouseEvent, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from 'app/atoms/EmptyState';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { TezosListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosChainByChainId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface Props {
  chainId: string;
  route3tokensSlugs: string[];
  filterZeroBalances: boolean;
  publicKeyHash: string;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const TezosChainAssetsList = memo<Props>(
  ({ chainId, route3tokensSlugs, filterZeroBalances, publicKeyHash, searchValue, onAssetSelect }) => {
    const network = useTezosChainByChainId(chainId);
    if (!network) throw new DeadEndBoundaryError();

    const balances = useAllAccountBalancesSelector(publicKeyHash, chainId);
    const isNonZeroBalance = useCallback(
      (slug: string) => {
        const balance = balances[slug];
        return isDefined(balance) && balance !== '0';
      },
      [balances]
    );

    const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);
    const getAssetMetadata = useGetChainTokenOrGasMetadata(chainId);

    const assetsSlugs = useMemoWithCompare<string[]>(() => {
      const gasTokensSlugs: string[] = [TEZ_TOKEN_SLUG];

      return gasTokensSlugs.concat(Array.from(route3tokensSlugs).sort(tokensSortPredicate));
    }, [tokensSortPredicate, route3tokensSlugs]);

    const filteredAssets = useMemo(() => {
      const applicableSlugs = filterZeroBalances ? assetsSlugs.filter(isNonZeroBalance) : assetsSlugs;
      return searchTezosChainAssetsWithNoMeta(searchValue, applicableSlugs, getAssetMetadata, slug => slug);
    }, [filterZeroBalances, assetsSlugs, searchValue, getAssetMetadata, isNonZeroBalance]);

    return (
      <>
        {filteredAssets.length === 0 && <EmptyState />}

        {filteredAssets.map(slug => (
          <TezosListItem
            key={slug}
            network={network}
            publicKeyHash={publicKeyHash}
            assetSlug={slug}
            showTags={false}
            onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))}
          />
        ))}
      </>
    );
  }
);
