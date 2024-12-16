import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { EvmListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const EvmChainAssetsList = memo<Props>(({ chainId, publicKeyHash, searchValue, onAssetSelect }) => {
  const chain = useEvmChainByChainId(chainId);
  const tokensSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);
  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  if (!chain) throw new DeadEndBoundaryError();

  const enabledEvmChainAssetsSlugs = useMemo(() => {
    const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];

    return gasTokensSlugs.concat(tokensSlugs);
  }, [tokensSlugs]);

  const enabledEvmChainAssetsSlugsSorted = useMemoWithCompare(
    () => enabledEvmChainAssetsSlugs.sort(tokensSortPredicate),
    [enabledEvmChainAssetsSlugs, tokensSortPredicate]
  );

  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (slug: string) => (slug === EVM_TOKEN_SLUG ? chain?.currency : metadata[chainId]?.[slug]),
    [chain, metadata, chainId]
  );

  const searchedSlugs = useMemo(
    () => searchEvmChainTokensWithNoMeta(searchValue, enabledEvmChainAssetsSlugsSorted, getMetadata, s => s),
    [enabledEvmChainAssetsSlugsSorted, getMetadata, searchValue]
  );

  return (
    <>
      {searchedSlugs.length === 0 && <EmptyState />}

      {searchedSlugs.map(slug => (
        <EvmListItem
          key={slug}
          assetSlug={slug}
          publicKeyHash={publicKeyHash}
          network={chain}
          onClick={e => onAssetSelect(e, toChainAssetSlug(TempleChainKind.EVM, chainId, slug))}
        />
      ))}
    </>
  );
});
