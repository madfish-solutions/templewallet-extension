import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { TOKEN_ITEM_HEIGHT } from 'app/pages/Swap/constants';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { useFirstValue, useLifiEvmAllTokensSlugs } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useLifiEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { EvmChain, useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { useFavoriteTokens } from 'temple/front/use-favorite-tokens';
import { TempleChainKind } from 'temple/types';

interface ItemData {
  searchedSlugs: string[];
  publicKeyHash: HexString;
  evmChains: StringRecord<EvmChain>;
  showOnlyFavorites?: boolean;
  showFavoritesMark?: boolean;
  onAssetSelect: (e: React.MouseEvent, slug: string) => void;
}

interface Props {
  activeField: SwapFieldName;
  accountEvmAddress: HexString;
  showOnlyFavorites?: boolean;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const AllEvmChainsAssetsList = memo<Props>(
  ({ accountEvmAddress, activeField, showOnlyFavorites, searchValue, onAssetSelect }) => {
    const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);
    const enabledEvmChains = useEnabledEvmChains();
    const { lifiTokenSlugs, isLoading } = useLifiEvmAllTokensSlugs();

    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);

    const isEvmNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

        // Disable Etherlink
        if (chainId === COMMON_MAINNET_CHAIN_IDS.etherlink) return false;

        return isDefined(getEvmBalance(chainId as number, assetSlug));
      },
      [getEvmBalance]
    );

    const { favoriteTokens = [] } = useFavoriteTokens();

    const filterZeroBalances = useMemo(() => activeField === 'input', [activeField]);
    const showFavoritesMark = useMemo(() => activeField === 'output', [activeField]);

    const rawTokensSortPredicate = useEvmAccountTokensSortPredicate(accountEvmAddress, showFavoritesMark);
    const tokensSortPredicate = useFirstValue(rawTokensSortPredicate);

    const enabledAssetsSlugs = useMemo(() => {
      if (showOnlyFavorites) {
        return favoriteTokens.filter(token => token.startsWith('evm'));
      }

      const nativeAssets = filterZeroBalances
        ? enabledEvmChains
            .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
            .filter(isEvmNonZeroBalance)
        : [];

      const tokenAssets = filterZeroBalances ? evmTokensSlugs.filter(isEvmNonZeroBalance) : lifiTokenSlugs;

      return [...nativeAssets, ...tokenAssets];
    }, [
      enabledEvmChains,
      evmTokensSlugs,
      favoriteTokens,
      filterZeroBalances,
      isEvmNonZeroBalance,
      lifiTokenSlugs,
      showOnlyFavorites
    ]);

    const enabledAssetsSlugsSorted = useMemoWithCompare(
      () => enabledAssetsSlugs.sort(tokensSortPredicate),
      [enabledAssetsSlugs, tokensSortPredicate]
    );

    const evmChains = useAllEvmChains();
    const evmMetadata = useEvmTokensMetadataRecordSelector();
    const lifiMetadata = useLifiEvmTokensMetadataRecordSelector();

    const getMetadata = useCallback(
      (chainId: number, slug: string) =>
        slug === EVM_TOKEN_SLUG
          ? evmChains[chainId]?.currency
          : evmMetadata[chainId]?.[slug] ?? lifiMetadata[chainId]?.[slug],
      [evmChains, evmMetadata, lifiMetadata]
    );

    const searchedSlugs = useMemo(
      () => searchEvmTokensWithNoMeta(searchValue, enabledAssetsSlugsSorted, getMetadata, getSlugWithChainId),
      [enabledAssetsSlugsSorted, getMetadata, searchValue]
    );

    if (isLoading && !filterZeroBalances) return <PageLoader stretch />;
    if (searchedSlugs.length === 0) return <EmptyState />;

    const itemData: ItemData = {
      searchedSlugs,
      publicKeyHash: accountEvmAddress,
      evmChains,
      onAssetSelect,
      showFavoritesMark,
      showOnlyFavorites
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
  const { searchedSlugs, publicKeyHash, evmChains, showOnlyFavorites, showFavoritesMark, onAssetSelect } = data;
  const slug = searchedSlugs[index];
  const [_, chainId, assetSlug] = parseChainAssetSlug(slug);

  return (
    <div style={style} key={slug} className="px-4">
      <EvmTokenListItem
        index={index}
        network={evmChains[chainId]!}
        assetSlug={assetSlug}
        publicKeyHash={publicKeyHash}
        requiresVisibility={false}
        showOnlyFavorites={showOnlyFavorites}
        showFavoritesMark={showFavoritesMark}
        onClick={e => onAssetSelect(e, slug)}
      />
    </div>
  );
};
