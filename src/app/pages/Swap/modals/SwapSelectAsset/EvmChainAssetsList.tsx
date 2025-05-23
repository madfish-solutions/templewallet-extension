import React, { memo, useMemo, MouseEvent, useCallback, RefObject } from 'react';

import { PageLoader } from 'app/atoms/Loader';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useLifiEvmChainTokensMetadataSelector,
  useLifiEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensListView } from './tokens-list-view';

interface Props {
  chainId: number;
  filterZeroBalances: boolean;
  publicKeyHash: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const EvmChainAssetsList = memo<Props>(
  ({ chainId, filterZeroBalances, publicKeyHash, searchValue, onAssetSelect }) => {
    const network = useEvmChainByChainId(chainId);
    if (!network) throw new DeadEndBoundaryError();

    const { metadata: lifiEvmTokensMetadataRecord, isLoading } = useLifiEvmChainTokensMetadataSelector(chainId);
    const lifiTokenMetadataList = useMemo(
      () => Object.values(lifiEvmTokensMetadataRecord ?? {}),
      [lifiEvmTokensMetadataRecord]
    );
    const lifiTokenSlugs = useMemo(
      () => lifiTokenMetadataList.map(token => toTokenSlug(token.address, 0)),
      [lifiTokenMetadataList]
    );

    const tokensSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);
    const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

    const evmChainAssetsSlugs = useMemo(() => {
      const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];

      return gasTokensSlugs.concat(
        filterZeroBalances ? tokensSlugs : [...tokensSlugs, ...lifiTokenSlugs.slice(0, 100)]
      );
    }, [lifiTokenSlugs, filterZeroBalances, tokensSlugs]);

    const evmChainAssetsSlugsSorted = useMemoWithCompare(
      () => evmChainAssetsSlugs.sort(tokensSortPredicate),
      [evmChainAssetsSlugs, tokensSortPredicate]
    );

    const metadata = useEvmTokensMetadataRecordSelector();
    // const lifiMetadata = useLifiEvmTokensMetadataRecordSelector();
    // const unifiedMetadata = useMemo(() => metadata ?? lifiMetadata, [metadata, lifiMetadata]);

    const getMetadata = useCallback(
      (slug: string) =>
        slug === EVM_TOKEN_SLUG ? network?.currency : metadata[chainId]?.[slug] ?? lifiEvmTokensMetadataRecord[slug],
      [network?.currency, metadata, chainId, lifiEvmTokensMetadataRecord]
    );

    const searchedSlugs = useMemo(
      () => searchEvmChainTokensWithNoMeta(searchValue, evmChainAssetsSlugsSorted, getMetadata, s => s),
      [evmChainAssetsSlugsSorted, getMetadata, searchValue]
    );

    const renderListItem = useCallback(
      (slug: string, index: number, ref?: RefObject<TokenListItemElement>) => (
        <EvmTokenListItem
          key={slug}
          index={index}
          assetSlug={slug}
          publicKeyHash={publicKeyHash}
          network={network}
          onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.EVM, chainId, slug))}
          ref={ref}
        />
      ),
      [network, chainId, onAssetSelect, publicKeyHash]
    );

    return isLoading ? <PageLoader stretch /> : <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>;
  }
);
