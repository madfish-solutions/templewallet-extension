import React, { memo, useMemo, MouseEvent, useCallback, RefObject, useState } from 'react';

import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { TokensListView } from 'app/pages/Send/modals/SelectAsset/tokens-list-view';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs, useEnabledTezosAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllEvmChains, useAllTezosChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { TempleChainKind } from 'temple/types';

interface Props {
  activeField: SwapFieldName;
  accountTezAddress: string;
  accountEvmAddress: HexString;
  showOnlyFavorites?: boolean;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const MultiChainAssetsList = memo<Props>(
  ({ accountTezAddress, activeField, accountEvmAddress, showOnlyFavorites, searchValue, onAssetSelect }) => {
    const tezTokensSlugs = useEnabledTezosAccountTokenSlugs(accountTezAddress);
    const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);

    const { favoriteTokens = [] } = useFavoriteTokens();
    const enabledTezChains = useEnabledTezosChains();
    const enabledEvmChains = useEnabledEvmChains();

    const showFavoritesMark = useMemo(() => activeField === 'output', [activeField]);

    const rawTokensSortPredicate = useAccountTokensSortPredicate(
      accountTezAddress,
      accountEvmAddress,
      showFavoritesMark
    );
    const [tokensSortPredicate] = useState(() => rawTokensSortPredicate);

    const enabledAssetsSlugs = useMemo(() => {
      if (showOnlyFavorites) {
        return [...favoriteTokens];
      }
      return enabledTezChains
        .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
        .concat(
          enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
          tezTokensSlugs,
          evmTokensSlugs
        );
    }, [showOnlyFavorites, favoriteTokens, enabledTezChains, enabledEvmChains, tezTokensSlugs, evmTokensSlugs]);

    const enabledAssetsSlugsSorted = useMemoWithCompare(
      () => enabledAssetsSlugs.sort(tokensSortPredicate),
      [enabledAssetsSlugs, tokensSortPredicate]
    );

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const getTezMetadata = useGetTokenOrGasMetadata();
    const evmMetadata = useEvmTokensMetadataRecordSelector();

    const getEvmMetadata = useCallback(
      (chainId: number, slug: string) =>
        slug === EVM_TOKEN_SLUG ? evmChains[chainId]?.currency : evmMetadata[chainId]?.[slug],
      [evmChains, evmMetadata]
    );

    const searchedSlugs = useMemo(
      () =>
        searchAssetsWithNoMeta(
          searchValue,
          enabledAssetsSlugsSorted,
          getTezMetadata,
          getEvmMetadata,
          slug => slug,
          getSlugFromChainSlug
        ),
      [enabledAssetsSlugsSorted, getEvmMetadata, getTezMetadata, searchValue]
    );

    const renderListItem = useCallback(
      (chainSlug: string, index: number, ref?: RefObject<TokenListItemElement>) => {
        const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

        if (chainKind === TempleChainKind.Tezos) {
          return (
            <TezosTokenListItem
              key={chainSlug}
              index={index}
              network={tezosChains[chainId]!}
              publicKeyHash={accountTezAddress}
              assetSlug={assetSlug}
              showTags={false}
              showFavoritesMark={showFavoritesMark}
              showOnlyFavorites={showOnlyFavorites}
              onClick={e => onAssetSelect(e, chainSlug)}
              ref={ref}
            />
          );
        }

        return (
          <EvmTokenListItem
            key={chainSlug}
            index={index}
            network={evmChains[chainId]!}
            assetSlug={assetSlug}
            publicKeyHash={accountEvmAddress}
            showFavoritesMark={showFavoritesMark}
            showOnlyFavorites={showOnlyFavorites}
            onClick={e => onAssetSelect(e, chainSlug)}
            ref={ref}
          />
        );
      },
      [
        accountEvmAddress,
        accountTezAddress,
        evmChains,
        onAssetSelect,
        showFavoritesMark,
        showOnlyFavorites,
        tezosChains
      ]
    );

    return (
      <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto">
        <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>
      </div>
    );
  }
);
