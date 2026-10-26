import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { uniq } from 'lodash';
import { ListChildComponentProps, VariableSizeList as List } from 'react-window';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { use3RouteEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-3route-metadata/selectors';
import { useLifiConnectedEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
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

import { TOKEN_ITEM_HEIGHT } from '../../constants';
import { SwapFieldName } from '../../form/interfaces';

import { BRIDGE_CARD_HEIGHT, BridgeCard, BridgeDirection } from './bridge-card';
import { use3RouteEvmTokensSlugs, useFirstValue, useLifiEvmTokensSlugs } from './hooks';

const BRIDGE_CARD_ROW_HEIGHT = BRIDGE_CARD_HEIGHT + 8;

interface ItemData {
  bridgeDirection?: BridgeDirection;
  headerRowsCount: number;
  showFavoritesMark: boolean;
  searchedSlugs: string[];
  publicKeyHash: HexString;
  network: EvmNetworkEssentials;
  onAssetSelect: (e: React.MouseEvent, slug: string) => void;
  chainId: number;
}

interface Props {
  chainId: number;
  activeField: SwapFieldName;
  publicKeyHash: HexString;
  searchValue: string;
  bridgeDirection?: BridgeDirection;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const EvmChainAssetsList = memo<Props>(
  ({ chainId, activeField, publicKeyHash, searchValue, bridgeDirection, onAssetSelect }) => {
    const network = useEvmChainByChainId(chainId);
    if (!network) throw new DeadEndBoundaryError();

    const { lifiTokenSlugs, isLoading: lifiTokensSlugsLoading } = useLifiEvmTokensSlugs(chainId);
    const { route3EvmTokenSlugs, isLoading: route3EvmTokensSlugsLoading } = use3RouteEvmTokensSlugs(chainId);
    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);

    const isEvmNonZeroBalance = useCallback(
      (assetSlug: string) => {
        return isDefined(getEvmBalance(chainId, assetSlug));
      },
      [chainId, getEvmBalance]
    );
    const showFavoritesMark = activeField === 'output';
    const filterZeroBalances = activeField === 'input';

    const headerRowsCount = bridgeDirection ? 1 : 0;

    const tokensSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);

    const rawTokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId, showFavoritesMark);
    const tokensSortPredicate = useFirstValue(rawTokensSortPredicate);

    const evmChainAssetsSlugs = useMemo(() => {
      const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];

      return filterZeroBalances
        ? gasTokensSlugs.concat(tokensSlugs).filter(isEvmNonZeroBalance)
        : uniq(lifiTokenSlugs.concat(route3EvmTokenSlugs));
    }, [filterZeroBalances, isEvmNonZeroBalance, lifiTokenSlugs, route3EvmTokenSlugs, tokensSlugs]);

    const evmChainAssetsSlugsSorted = useMemoWithCompare(
      () => evmChainAssetsSlugs.toSorted(tokensSortPredicate),
      [evmChainAssetsSlugs, tokensSortPredicate]
    );

    const metadata = useEvmTokensMetadataRecordSelector();
    const lifiMetadata = useLifiConnectedEvmTokensMetadataRecordSelector();
    const route3EvmMetadata = use3RouteEvmTokensMetadataRecordSelector();

    const getMetadata = useCallback(
      (slug: string) =>
        slug === EVM_TOKEN_SLUG
          ? network?.currency
          : (metadata[chainId]?.[slug] ?? lifiMetadata[chainId]?.[slug] ?? route3EvmMetadata[chainId]?.[slug]),
      [chainId, lifiMetadata, metadata, network?.currency, route3EvmMetadata]
    );

    const searchedSlugs = useMemo(
      () => searchEvmChainTokensWithNoMeta(searchValue, evmChainAssetsSlugsSorted, getMetadata, s => s),
      [evmChainAssetsSlugsSorted, getMetadata, searchValue]
    );

    if ((lifiTokensSlugsLoading || route3EvmTokensSlugsLoading) && !filterZeroBalances) return <PageLoader stretch />;
    if (searchedSlugs.length === 0)
      return (
        <>
          {bridgeDirection && (
            <div className="px-4 pb-2 shrink-0">
              <BridgeCard direction={bridgeDirection} />
            </div>
          )}
          <EmptyState />
        </>
      );

    const itemData: ItemData = {
      bridgeDirection,
      headerRowsCount,
      searchedSlugs,
      publicKeyHash,
      network,
      onAssetSelect,
      chainId,
      showFavoritesMark
    };

    return (
      <List
        key={bridgeDirection ? 'with-bridge-card' : 'without-bridge-card'}
        overscanCount={10}
        itemKey={index => (bridgeDirection && index === 0 ? 'bridge-card' : searchedSlugs[index - headerRowsCount])}
        height={window.innerHeight}
        itemCount={searchedSlugs.length + headerRowsCount}
        style={{ paddingBottom: 16 }}
        itemSize={index => (bridgeDirection && index === 0 ? BRIDGE_CARD_ROW_HEIGHT : TOKEN_ITEM_HEIGHT)}
        estimatedItemSize={TOKEN_ITEM_HEIGHT}
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
    publicKeyHash,
    network,
    onAssetSelect,
    chainId,
    showFavoritesMark,
    bridgeDirection,
    headerRowsCount
  } = data;

  if (bridgeDirection && index === 0)
    return (
      <div style={style} className="px-4 pb-2">
        <BridgeCard direction={bridgeDirection} />
      </div>
    );

  const slug = searchedSlugs[index - headerRowsCount];

  return (
    <div style={style} key={slug} className={clsx('px-4')}>
      <EvmTokenListItem
        index={index}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        network={network}
        requiresVisibility={false}
        showFavoritesMark={showFavoritesMark}
        onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.EVM, chainId, slug))}
      />
    </div>
  );
};
