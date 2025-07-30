import React, { memo, useMemo, MouseEvent, useCallback, RefObject } from 'react';

import { getSlugWithChainId } from 'app/hooks/listing-logic/utils';
import { TokensListView } from 'app/pages/Send/modals/SelectAsset/tokens-list-view';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface Props {
  accountEvmAddress: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const AllEvmChainsAssetsList = memo<Props>(({ accountEvmAddress, searchValue, onAssetSelect }) => {
  const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);
  const enabledEvmChains = useEnabledEvmChains();

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(accountEvmAddress);

  const enabledAssetsSlugs = useMemo(
    () =>
      enabledEvmChains
        .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
        .concat(evmTokensSlugs),
    [enabledEvmChains, evmTokensSlugs]
  );

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

  const renderListItem = useCallback(
    (chainSlug: string, index: number, ref?: RefObject<TokenListItemElement>) => {
      const [_chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

      return (
        <EvmTokenListItem
          key={chainSlug}
          index={index}
          network={evmChains[chainId]!}
          assetSlug={assetSlug}
          publicKeyHash={accountEvmAddress}
          onClick={e => onAssetSelect(e, chainSlug)}
          ref={ref}
        />
      );
    },
    [accountEvmAddress, evmChains, onAssetSelect]
  );

  return (
    <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto">
      <TokensListView slugs={searchedSlugs}>{renderListItem}</TokensListView>
    </div>
  );
});
