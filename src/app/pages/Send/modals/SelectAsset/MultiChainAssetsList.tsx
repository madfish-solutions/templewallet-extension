import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { EvmListItem, TezosListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useTezosAccountTokens } from 'lib/assets/hooks/tokens';
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
    const tezTokens = useTezosAccountTokens(accountTezAddress);

    const enabledTezChains = useEnabledTezosChains();
    const enabledEvmChains = useEnabledEvmChains();

    const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

    const gasChainsSlugs = useMemo(
      () => [
        ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
        ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
      ],
      [enabledEvmChains, enabledTezChains]
    );

    // TODO: Show all tokens
    const enabledChainsSlugsSorted = useMemoWithCompare(() => {
      const enabledChainsSlugs = [
        ...gasChainsSlugs,
        ...tezTokens
          .filter(({ status }) => status === 'enabled')
          .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
      ];

      return enabledChainsSlugs.sort(tokensSortPredicate);
    }, [tezTokens, tokensSortPredicate, gasChainsSlugs]);

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const getTezMetadata = useGetTokenOrGasMetadata();
    const evmMetadata = useEvmTokensMetadataRecordSelector();

    const getEvmMetadata = useCallback(
      (chainId: number, slug: string) => {
        if (slug === EVM_TOKEN_SLUG) return evmChains[chainId]?.currency;

        return evmMetadata[chainId]?.[slug];
      },
      [evmChains, evmMetadata]
    );

    const searchedSlugs = useMemo(
      () =>
        searchAssetsWithNoMeta(
          searchValue,
          enabledChainsSlugsSorted,
          getTezMetadata,
          getEvmMetadata,
          slug => slug,
          getSlugFromChainSlug
        ),
      [enabledChainsSlugsSorted, getEvmMetadata, getTezMetadata, searchValue]
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
