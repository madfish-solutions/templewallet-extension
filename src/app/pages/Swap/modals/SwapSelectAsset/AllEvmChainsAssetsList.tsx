import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { ITEM_HEIGHT } from 'app/pages/Swap/modals/SwapSelectAsset/EvmChainAssetsList';
import { useLifiEvmAllTokensSlugs } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { EvmChain, useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface ItemData {
  searchedSlugs: string[];
  publicKeyHash: HexString;
  evmChains: StringRecord<EvmChain>;
  onAssetSelect: (e: React.MouseEvent, slug: string) => void;
}

interface Props {
  accountEvmAddress: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
  filterZeroBalances: boolean;
}

export const AllEvmChainsAssetsList = memo<Props>(
  ({ accountEvmAddress, searchValue, onAssetSelect, filterZeroBalances }) => {
    const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);
    const enabledEvmChains = useEnabledEvmChains();
    const { lifiTokenSlugs, isLoading } = useLifiEvmAllTokensSlugs();

    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);

    const isEvmNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug);
        return isDefined(getEvmBalance(chainId as number, assetSlug));
      },
      [getEvmBalance]
    );

    const tokensSortPredicate = useEvmAccountTokensSortPredicate(accountEvmAddress);

    const enabledAssetsSlugs = useMemo(() => {
      const result: string[] = [];

      if (filterZeroBalances) {
        result.push(
          ...enabledEvmChains
            .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
            .filter(isEvmNonZeroBalance)
        );
      }

      result.push(...(filterZeroBalances ? evmTokensSlugs.filter(isEvmNonZeroBalance) : lifiTokenSlugs));

      return result;
    }, [enabledEvmChains, evmTokensSlugs, filterZeroBalances, isEvmNonZeroBalance, lifiTokenSlugs]);

    const enabledAssetsSlugsSorted = useMemoWithCompare(
      () => enabledAssetsSlugs.sort(tokensSortPredicate),
      [enabledAssetsSlugs, tokensSortPredicate]
    );

    const evmChains = useAllEvmChains();
    const evmMetadata = useEvmTokensMetadataRecordSelector();

    const getMetadata = useCallback(
      (chainId: number, slug: string) =>
        slug === EVM_TOKEN_SLUG ? evmChains[chainId]?.currency : evmMetadata[chainId]?.[slug],
      [evmChains, evmMetadata]
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
      onAssetSelect
    };

    return (
      <List
        overscanCount={10}
        itemKey={index => searchedSlugs[index]}
        height={window.innerHeight}
        itemCount={searchedSlugs.length}
        style={{ paddingBottom: 16 }}
        itemSize={ITEM_HEIGHT}
        width="100%"
        itemData={itemData}
      >
        {TokenListItemRenderer}
      </List>
    );
  }
);

const TokenListItemRenderer = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const { searchedSlugs, publicKeyHash, evmChains, onAssetSelect } = data;
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
        onClick={e => onAssetSelect(e, slug)}
      />
    </div>
  );
};
