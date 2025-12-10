import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { TOKEN_ITEM_HEIGHT } from 'app/pages/Swap/constants';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { useFirstValue, useLifiEvmTokensSlugs } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useLifiConnectedEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
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

interface ItemData {
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
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const EvmChainAssetsList = memo<Props>(({ chainId, activeField, publicKeyHash, searchValue, onAssetSelect }) => {
  const network = useEvmChainByChainId(chainId);
  if (!network) throw new DeadEndBoundaryError();

  const { lifiTokenSlugs, isLoading } = useLifiEvmTokensSlugs(chainId);
  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);

  const isEvmNonZeroBalance = useCallback(
    (assetSlug: string) => {
      return isDefined(getEvmBalance(chainId, assetSlug));
    },
    [chainId, getEvmBalance]
  );
  const showFavoritesMark = useMemo(() => activeField === 'output', [activeField]);
  const filterZeroBalances = useMemo(() => activeField === 'input', [activeField]);

  const tokensSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);

  const rawTokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId, showFavoritesMark);
  const tokensSortPredicate = useFirstValue(rawTokensSortPredicate);

  const evmChainAssetsSlugs = useMemo(() => {
    const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];

    return filterZeroBalances ? gasTokensSlugs.concat(tokensSlugs).filter(isEvmNonZeroBalance) : lifiTokenSlugs;
  }, [filterZeroBalances, isEvmNonZeroBalance, lifiTokenSlugs, tokensSlugs]);

  const evmChainAssetsSlugsSorted = useMemoWithCompare(
    () => evmChainAssetsSlugs.toSorted(tokensSortPredicate),
    [evmChainAssetsSlugs, tokensSortPredicate]
  );

  const metadata = useEvmTokensMetadataRecordSelector();
  const lifiMetadata = useLifiConnectedEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (slug: string) =>
      slug === EVM_TOKEN_SLUG ? network?.currency : metadata[chainId]?.[slug] ?? lifiMetadata[chainId]?.[slug],
    [chainId, lifiMetadata, metadata, network?.currency]
  );

  const searchedSlugs = useMemo(
    () => searchEvmChainTokensWithNoMeta(searchValue, evmChainAssetsSlugsSorted, getMetadata, s => s),
    [evmChainAssetsSlugsSorted, getMetadata, searchValue]
  );

  if (isLoading && !filterZeroBalances) return <PageLoader stretch />;
  if (searchedSlugs.length === 0) return <EmptyState />;

  const itemData: ItemData = {
    searchedSlugs,
    publicKeyHash,
    network,
    onAssetSelect,
    chainId,
    showFavoritesMark
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
});

const TokenListItemRenderer = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const { searchedSlugs, publicKeyHash, network, onAssetSelect, chainId, showFavoritesMark } = data;
  const slug = searchedSlugs[index];

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
