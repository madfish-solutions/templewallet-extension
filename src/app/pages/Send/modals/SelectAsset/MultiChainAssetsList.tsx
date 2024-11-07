import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { EvmListItem, TezosListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs, useEnabledTezosAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface Props {
  accountTezAddress: string;
  accountEvmAddress: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

export const MultiChainAssetsList = memo<Props>(
  ({ accountTezAddress, accountEvmAddress, searchValue, onAssetSelect }) => {
    const tezTokensSlugs = useEnabledTezosAccountTokenSlugs(accountTezAddress);
    const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);

    const enabledTezChains = useEnabledTezosChains();
    const enabledEvmChains = useEnabledEvmChains();

    const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

    const enabledAssetsSlugs = useMemo(
      () =>
        enabledTezChains
          .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
          .concat(
            enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
            tezTokensSlugs,
            evmTokensSlugs
          ),
      [enabledTezChains, enabledEvmChains, tezTokensSlugs, evmTokensSlugs]
    );

    const enabledAssetsSlugsSorted = useMemoWithCompare(
      () => enabledAssetsSlugs.sort(tokensSortPredicate),
      [enabledAssetsSlugs, tokensSortPredicate]
    );

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const getTezMetadata = useGetTokenOrGasMetadata();
    const evmMetadata = useEvmTokensMetadataRecordSelector();

    const getEvmMetadata = useCallback(
      (chainId: number, slug: string) =>
        slug === EVM_TOKEN_SLUG ? evmChains[chainId]?.currency : evmMetadata[chainId]?.[slug],
      [evmChains, evmMetadata]
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

    return (
      <>
        {searchedSlugs.length === 0 && <EmptyState />}

        {searchedSlugs.map(chainSlug => {
          const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

          if (chainKind === TempleChainKind.Tezos) {
            return (
              <TezosListItem
                key={chainSlug}
                network={tezosChains[chainId]!}
                publicKeyHash={accountTezAddress}
                assetSlug={assetSlug}
                showTags={false}
                onClick={e => onAssetSelect(e, chainSlug)}
              />
            );
          }

          return (
            <EvmListItem
              key={chainSlug}
              network={evmChains[chainId]!}
              assetSlug={assetSlug}
              publicKeyHash={accountEvmAddress}
              onClick={e => onAssetSelect(e, chainSlug)}
            />
          );
        })}
      </>
    );
  }
);
