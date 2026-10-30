import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { uniq } from 'lodash';

import { PageLoader } from 'app/atoms/Loader';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { use3RouteEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-3route-metadata/selectors';
import { useLifiConnectedEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokensListView } from 'app/templates/tokens/tokens-list-view';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { TempleChainKind } from 'temple/types';

import { SWAP_SELECT_ASSET_SCROLLABLE_ID } from '../../constants';
import { SwapFieldName } from '../../form/interfaces';

import { useFirstValue, useLifiEvmAllTokensSlugs, use3RouteEvmAllTokensSlugs } from './hooks';

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
    const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);
    const { lifiTokenSlugs, isLoading: lifiTokensLoading } = useLifiEvmAllTokensSlugs();
    const { route3EvmTokenSlugs, isLoading: route3EvmTokensLoading } = use3RouteEvmAllTokensSlugs();

    const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();

    const tezosBalances = useAllAccountBalancesSelector(accountTezAddress, TEZOS_MAINNET_CHAIN_ID);
    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);

    const isEvmNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

        const balance = getEvmBalance(chainId as number, assetSlug);
        return isDefined(balance) && balance.gt(0);
      },
      [getEvmBalance]
    );

    const isTezNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, , assetSlug] = parseChainAssetSlug(chainSlug);
        const balance = tezosBalances[assetSlug];
        return isDefined(balance) && balance !== '0';
      },
      [tezosBalances]
    );

    const { favoriteTokens = [] } = useFavoriteTokens();
    const enabledTezChains = useEnabledTezosChains();
    const enabledEvmChains = useEnabledEvmChains();

    const filterZeroBalances = activeField === 'input';
    const showFavoritesMark = activeField === 'output';

    const rawTokensSortPredicate = useAccountTokensSortPredicate(
      accountTezAddress,
      accountEvmAddress,
      showFavoritesMark
    );
    const tokensSortPredicate = useFirstValue(rawTokensSortPredicate);

    const enabledAssetsSlugs = useMemo(() => {
      if (showOnlyFavorites) {
        return favoriteTokens.filter(token => token.startsWith('evm'));
      }

      if (!filterZeroBalances) {
        return uniq(lifiTokenSlugs.concat(route3EvmTokenSlugs));
      }

      return enabledTezChains
        .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
        .filter(isTezNonZeroBalance)
        .concat(
          enabledEvmChains
            .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
            .filter(isEvmNonZeroBalance),
          route3tokensSlugs
            .map(slug => toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, slug))
            .filter(isTezNonZeroBalance),
          evmTokensSlugs.filter(isEvmNonZeroBalance)
        );
    }, [
      showOnlyFavorites,
      filterZeroBalances,
      route3tokensSlugs,
      isTezNonZeroBalance,
      evmTokensSlugs,
      isEvmNonZeroBalance,
      lifiTokenSlugs,
      favoriteTokens,
      enabledTezChains,
      enabledEvmChains,
      route3EvmTokenSlugs
    ]);

    const enabledAssetsSlugsSorted = useMemoWithCompare(
      () => enabledAssetsSlugs.toSorted(tokensSortPredicate),
      [enabledAssetsSlugs, tokensSortPredicate]
    );

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const getTezMetadata = useGetTokenOrGasMetadata();
    const evmMetadata = useEvmTokensMetadataRecordSelector();
    const lifiMetadata = useLifiConnectedEvmTokensMetadataRecordSelector();
    const route3EvmMetadata = use3RouteEvmTokensMetadataRecordSelector();

    const getEvmMetadata = useCallback(
      (chainId: number, slug: string) =>
        slug === EVM_TOKEN_SLUG
          ? evmChains[chainId]?.currency
          : (evmMetadata[chainId]?.[slug] ?? lifiMetadata[chainId]?.[slug] ?? route3EvmMetadata[chainId]?.[slug]),
      [evmChains, evmMetadata, lifiMetadata, route3EvmMetadata]
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

    if ((lifiTokensLoading || route3EvmTokensLoading) && !filterZeroBalances) return <PageLoader stretch />;
    return (
      <TokensListView slugs={searchedSlugs} scrollElementId={SWAP_SELECT_ASSET_SCROLLABLE_ID}>
        {slug => {
          const [chainKind, chainId, assetSlug] = parseChainAssetSlug(slug);

          if (chainKind === TempleChainKind.Tezos) {
            return (
              <TezosTokenListItem
                network={tezosChains[chainId]}
                publicKeyHash={accountTezAddress}
                assetSlug={assetSlug}
                showTags={false}
                showOnlyFavorites={showOnlyFavorites}
                showFavoritesMark={showFavoritesMark}
                onClick={e => onAssetSelect(e, slug)}
              />
            );
          }

          return (
            <EvmTokenListItem
              network={evmChains[chainId]}
              assetSlug={assetSlug}
              publicKeyHash={accountEvmAddress}
              showOnlyFavorites={showOnlyFavorites}
              showFavoritesMark={showFavoritesMark}
              onClick={e => onAssetSelect(e, slug)}
            />
          );
        }}
      </TokensListView>
    );
  }
);
