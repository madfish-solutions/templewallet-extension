import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLifiEvmTokensSlugs } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useLifiEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEvmChainByChainId } from 'temple/front/chains';
import { EvmNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

interface Props {
  chainId: number;
  filterZeroBalances: boolean;
  publicKeyHash: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

interface ItemData {
  searchedSlugs: string[];
  publicKeyHash: HexString;
  network: EvmNetworkEssentials;
  onAssetSelect: (e: React.MouseEvent, slug: string) => void;
  chainId: number;
}

export const ITEM_HEIGHT = 56;

export const EvmChainAssetsList = memo<Props>(
  ({ chainId, filterZeroBalances, publicKeyHash, searchValue, onAssetSelect }) => {
    const network = useEvmChainByChainId(chainId);
    if (!network) throw new DeadEndBoundaryError();

    const { lifiTokenSlugs, isLoading } = useLifiEvmTokensSlugs(chainId);
    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);

    const isEvmNonZeroBalance = useCallback(
      (assetSlug: string) => {
        return isDefined(getEvmBalance(chainId as number, assetSlug));
      },
      [chainId, getEvmBalance]
    );

    const tokensSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);
    const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

    const evmChainAssetsSlugs = useMemo(() => {
      const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];

      return filterZeroBalances ? gasTokensSlugs.concat(tokensSlugs).filter(isEvmNonZeroBalance) : lifiTokenSlugs;
    }, [filterZeroBalances, isEvmNonZeroBalance, lifiTokenSlugs, tokensSlugs]);

    const evmChainAssetsSlugsSorted = useMemoWithCompare(
      () => evmChainAssetsSlugs.toSorted(tokensSortPredicate),
      [evmChainAssetsSlugs, tokensSortPredicate]
    );

    const metadata = useEvmTokensMetadataRecordSelector();
    const lifiMetadata = useLifiEvmTokensMetadataRecordSelector();

    const getMetadata = useCallback(
      (slug: string) =>
        slug === EVM_TOKEN_SLUG ? network?.currency : metadata[chainId]?.[slug] ?? lifiMetadata[chainId]?.[slug],
      [chainId, lifiMetadata, metadata, network?.currency]
    );

    const searchedSlugs = useMemo(
      () => searchEvmChainTokensWithNoMeta(searchValue, evmChainAssetsSlugsSorted, getMetadata, s => s),
      [evmChainAssetsSlugsSorted, getMetadata, searchValue]
    );

    if (searchedSlugs.length === 0) return <EmptyState />;
    if (isLoading) return <PageLoader stretch />;

    const itemData: ItemData = {
      searchedSlugs,
      publicKeyHash,
      network,
      onAssetSelect,
      chainId
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
  const { searchedSlugs, publicKeyHash, network, onAssetSelect, chainId } = data;
  const slug = searchedSlugs[index];

  return (
    <div style={style} key={slug} className={clsx('px-4')}>
      <EvmTokenListItem
        index={index}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        network={network}
        requiresVisibility={false}
        onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.EVM, chainId, slug))}
      />
    </div>
  );
};
