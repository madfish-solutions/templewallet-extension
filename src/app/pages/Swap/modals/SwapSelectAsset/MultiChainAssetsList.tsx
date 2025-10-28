import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { TOKEN_ITEM_HEIGHT } from 'app/pages/Swap/constants';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { useFirstValue, useLifiEvmAllTokensSlugs } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useLifiEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
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
import {
  EvmChain,
  TezosChain,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { TempleChainKind } from 'temple/types';

interface ItemData {
  searchedSlugs: string[];
  tezosPublicKeyHash: string;
  evmPublicKeyHash: HexString;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  showOnlyFavorites?: boolean;
  showFavoritesMark?: boolean;
  onAssetSelect: (e: React.MouseEvent, slug: string) => void;
}

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
    const { lifiTokenSlugs, isLoading } = useLifiEvmAllTokensSlugs();

    const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();

    const tezosBalances = useAllAccountBalancesSelector(accountTezAddress, TEZOS_MAINNET_CHAIN_ID);
    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);

    const isEvmNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

        return isDefined(getEvmBalance(chainId as number, assetSlug));
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

    const filterZeroBalances = useMemo(() => activeField === 'input', [activeField]);
    const showFavoritesMark = useMemo(() => activeField === 'output', [activeField]);

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

      const result: string[] = [];

      if (filterZeroBalances) {
        result.push(
          ...enabledTezChains
            .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
            .filter(isTezNonZeroBalance)
        );
        result.push(
          ...enabledEvmChains
            .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
            .filter(isEvmNonZeroBalance)
        );
      }

      result.push(
        ...(filterZeroBalances
          ? route3tokensSlugs
              .map(slug => toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, slug))
              .filter(isTezNonZeroBalance)
          : [])
      );
      result.push(...(filterZeroBalances ? evmTokensSlugs.filter(isEvmNonZeroBalance) : lifiTokenSlugs));

      return result;
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
      enabledEvmChains
    ]);

    const enabledAssetsSlugsSorted = useMemoWithCompare(
      () => enabledAssetsSlugs.sort(tokensSortPredicate),
      [enabledAssetsSlugs, tokensSortPredicate]
    );

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const getTezMetadata = useGetTokenOrGasMetadata();
    const evmMetadata = useEvmTokensMetadataRecordSelector();
    const lifiMetadata = useLifiEvmTokensMetadataRecordSelector();

    const getEvmMetadata = useCallback(
      (chainId: number, slug: string) =>
        slug === EVM_TOKEN_SLUG
          ? evmChains[chainId]?.currency
          : evmMetadata[chainId]?.[slug] ?? lifiMetadata[chainId]?.[slug],
      [evmChains, evmMetadata, lifiMetadata]
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

    if (isLoading && !filterZeroBalances) return <PageLoader stretch />;
    if (searchedSlugs.length === 0) return <EmptyState />;

    const itemData: ItemData = {
      searchedSlugs,
      tezosPublicKeyHash: accountTezAddress,
      evmPublicKeyHash: accountEvmAddress,
      tezosChains,
      evmChains,
      showOnlyFavorites,
      showFavoritesMark,
      onAssetSelect
    };

    return (
      <List
        overscanCount={10}
        itemKey={index => searchedSlugs[index]}
        height={window.innerHeight}
        itemCount={searchedSlugs.length}
        style={{ paddingBottom: 16 }}
        itemSize={TOKEN_ITEM_HEIGHT}
        width="100%"
        itemData={itemData}
      >
        {TokenListItemRenderer}
      </List>
    );
  }
);

const TokenListItemRenderer = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const {
    searchedSlugs,
    tezosPublicKeyHash,
    evmPublicKeyHash,
    tezosChains,
    evmChains,
    showOnlyFavorites,
    showFavoritesMark,
    onAssetSelect
  } = data;
  const slug = searchedSlugs[index];
  const [chainKind, chainId, assetSlug] = parseChainAssetSlug(slug);

  if (chainKind === TempleChainKind.Tezos) {
    return (
      <div style={style} key={slug} className="px-4">
        <TezosTokenListItem
          index={index}
          network={tezosChains[chainId]!}
          publicKeyHash={tezosPublicKeyHash}
          assetSlug={assetSlug}
          showTags={false}
          showOnlyFavorites={showOnlyFavorites}
          showFavoritesMark={showFavoritesMark}
          onClick={e => onAssetSelect(e, slug)}
        />
      </div>
    );
  }

  return (
    <div style={style} key={slug} className="px-4">
      <EvmTokenListItem
        index={index}
        network={evmChains[chainId]!}
        assetSlug={assetSlug}
        publicKeyHash={evmPublicKeyHash}
        requiresVisibility={false}
        showOnlyFavorites={showOnlyFavorites}
        showFavoritesMark={showFavoritesMark}
        onClick={e => onAssetSelect(e, slug)}
      />
    </div>
  );
};
