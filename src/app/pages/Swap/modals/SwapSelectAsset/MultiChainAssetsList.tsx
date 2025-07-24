import React, { memo, useMemo, MouseEvent, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

import { PageLoader } from 'app/atoms/Loader';
import { getSlugFromChainSlug } from 'app/hooks/listing-logic/utils';
import { ITEM_HEIGHT } from 'app/pages/Swap/modals/SwapSelectAsset/EvmChainAssetsList';
import { useLifiEvmAllTokensSlugs } from 'app/pages/Swap/modals/SwapSelectAsset/hooks';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs, useEnabledTezosAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  EvmChain,
  TezosChain,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { TempleChainKind } from 'temple/types';
import { EmptyState } from 'app/atoms/EmptyState';

interface Props {
  filterZeroBalances: boolean;
  accountTezAddress: string;
  accountEvmAddress: HexString;
  searchValue: string;
  onAssetSelect: (e: MouseEvent, chainSlug: string) => void;
}

interface ItemData {
  searchedSlugs: string[];
  tezosPublicKeyHash: string;
  evmPublicKeyHash: HexString;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  onAssetSelect: (e: React.MouseEvent, slug: string) => void;
}

export const MultiChainAssetsList = memo<Props>(
  ({ filterZeroBalances, accountTezAddress, accountEvmAddress, searchValue, onAssetSelect }) => {
    const tezTokensSlugs = useEnabledTezosAccountTokenSlugs(accountTezAddress);
    const evmTokensSlugs = useEnabledEvmAccountTokenSlugs(accountEvmAddress);
    const { lifiTokenSlugs, isLoading } = useLifiEvmAllTokensSlugs();

    const tezosBalances = useAllAccountBalancesSelector(accountTezAddress, TEZOS_MAINNET_CHAIN_ID);
    const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);

    const isEvmNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug);
        return isDefined(getEvmBalance(chainId as number, assetSlug));
      },
      [getEvmBalance]
    );

    const isTezNonZeroBalance = useCallback(
      (chainSlug: string) => {
        const [, , assetSlug] = parseChainAssetSlug(chainSlug);
        const balance = tezosBalances[assetSlug];
        return isDefined(balance) && balance !== '0';
      },
      [tezosBalances]
    );

    const enabledTezChains = useEnabledTezosChains();
    const enabledEvmChains = useEnabledEvmChains();

    const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

    const enabledAssetsSlugs = useMemo(() => {
      const result: string[] = [];

      if (filterZeroBalances) {
        result.push(
          ...enabledTezChains
            .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
            .filter(isTezNonZeroBalance)
        );
        result.push(
          ...enabledEvmChains
            .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
            .filter(isEvmNonZeroBalance)
        );
      }

      result.push(...(filterZeroBalances ? tezTokensSlugs.filter(isTezNonZeroBalance) : []));
      result.push(...(filterZeroBalances ? evmTokensSlugs.filter(isEvmNonZeroBalance) : lifiTokenSlugs));

      return result;
    }, [
      filterZeroBalances,
      tezTokensSlugs,
      isTezNonZeroBalance,
      evmTokensSlugs,
      isEvmNonZeroBalance,
      lifiTokenSlugs,
      enabledTezChains,
      enabledEvmChains
    ]);

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

    if (isLoading) return <PageLoader stretch />;
    if (searchedSlugs.length === 0) return <EmptyState />;

    const itemData: ItemData = {
      searchedSlugs,
      tezosPublicKeyHash: accountTezAddress,
      evmPublicKeyHash: accountEvmAddress,
      tezosChains: tezosChains,
      evmChains: evmChains,
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

export const TokenListItemRenderer = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const { searchedSlugs, tezosPublicKeyHash, evmPublicKeyHash, tezosChains, evmChains, onAssetSelect } = data;
  const slug = searchedSlugs[index];
  const [chainKind, chainId, assetSlug] = parseChainAssetSlug(slug);

  if (chainKind === TempleChainKind.Tezos) {
    return (
      <div style={style} key={slug} className="px-4">
        <TezosTokenListItem
          index={index}
          network={tezosChains[chainId]!}
          publicKeyHash={tezosPublicKeyHash}
          assetSlug={assetSlug}
          showTags={false}
          onClick={e => onAssetSelect(e, slug)}
        />
      </div>
    );
  }

  return (
    <div style={style} key={slug} className="px-4">
      <EvmTokenListItem
        index={index}
        network={evmChains[chainId]!}
        assetSlug={assetSlug}
        publicKeyHash={evmPublicKeyHash}
        requiresVisibility={false}
        onClick={e => onAssetSelect(e, slug)}
      />
    </div>
  );
};
