import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { uniq } from 'lodash';

import { PageLoader } from 'app/atoms/Loader';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { use3RouteEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-3route-metadata/selectors';
import { useLifiConnectedEvmTokensMetadataRecordSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokensListView } from 'app/templates/tokens/tokens-list-view';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { SWAP_SELECT_ASSET_SCROLLABLE_ID } from '../../constants';
import { SwapFieldName } from '../../form/interfaces';

import { use3RouteEvmTokensSlugs, useFirstValue, useLifiEvmTokensSlugs } from './hooks';

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
  return (
    <TokensListView slugs={searchedSlugs} scrollElementId={SWAP_SELECT_ASSET_SCROLLABLE_ID}>
      {slug => (
        <EvmTokenListItem
          assetSlug={slug}
          publicKeyHash={publicKeyHash}
          network={network}
          showFavoritesMark={showFavoritesMark}
          onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.EVM, chainId, slug))}
        />
      )}
    </TokensListView>
  );
});
