import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';

import {
  useAccountTokensForListing,
  useAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useChainsSlugsGrouping } from 'app/hooks/listing-logic/use-slugs-grouping';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { getTokensViewWithPromo } from '../utils';

import { EvmListItem, TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainTokensTab = memo<Props>(({ accountTezAddress, accountEvmAddress }) => {
  const { manageActive } = useAssetsViewState();

  if (manageActive)
    return <TabContentWithManageActive accountTezAddress={accountTezAddress} accountEvmAddress={accountEvmAddress} />;

  return <TabContent accountTezAddress={accountTezAddress} accountEvmAddress={accountEvmAddress} />;
});

const TabContent: FC<Props> = ({ accountTezAddress, accountEvmAddress }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted } = useAccountTokensForListing(
    accountTezAddress,
    accountEvmAddress,
    hideZeroBalance
  );

  return (
    <TabContentBase
      accountTezAddress={accountTezAddress}
      accountEvmAddress={accountEvmAddress}
      allSlugsSorted={enabledChainsSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ accountTezAddress, accountEvmAddress }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, tezTokens, evmTokens, tokensSortPredicate } = useAccountTokensForListing(
    accountTezAddress,
    accountEvmAddress,
    hideZeroBalance
  );

  const tokensChainsSlugs = useMemo(
    () =>
      tezTokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        .concat(
          evmTokens
            .filter(({ status }) => status !== 'removed')
            .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
        ),
    [tezTokens, evmTokens]
  );

  const otherChainSlugsSorted = useMemoWithCompare(
    () => tokensChainsSlugs.sort(tokensSortPredicate),
    [tokensChainsSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainsSlugsSorted, otherChainSlugsSorted);

  return (
    <TabContentBase
      accountTezAddress={accountTezAddress}
      accountEvmAddress={accountEvmAddress}
      allSlugsSorted={allSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps extends Props {
  allSlugsSorted: string[];
  groupByNetwork: boolean;
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(
  ({ accountTezAddress, accountEvmAddress, allSlugsSorted, groupByNetwork, manageActive }) => {
    const { displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
      useAccountTokensListingLogic(allSlugsSorted);

    const groupedSlugs = useChainsSlugsGrouping(displayedSlugs, groupByNetwork);

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const tokensView = useMemo(() => {
      const promoJsx = manageActive ? null : (
        <PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionVariant.Text}
          pageName="Token page"
        />
      );

      if (groupedSlugs)
        return groupedSlugs.map(([chainId, chainSlugs], gi) => {
          const chain = typeof chainId === 'number' ? evmChains[chainId] : tezosChains[chainId];

          return (
            <React.Fragment key={chainId}>
              <div className={clsx('mb-0.5 p-1 text-font-description-bold', gi > 0 && 'mt-4')}>
                {chain?.name ?? 'Unknown chain'}
              </div>

              {(() => {
                const tokensJsx = buildTokensJsxArray(chainSlugs);

                if (gi > 0) return tokensJsx;

                return getTokensViewWithPromo(tokensJsx, promoJsx);
              })()}
            </React.Fragment>
          );
        });

      const tokensJsx = buildTokensJsxArray(displayedSlugs);

      if (manageActive) return tokensJsx;

      return getTokensViewWithPromo(tokensJsx, promoJsx);

      function buildTokensJsxArray(chainSlugs: string[]) {
        return chainSlugs.map(chainSlug => {
          const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

          if (chainKind === TempleChainKind.Tezos) {
            return (
              <TezosListItem
                network={tezosChains[chainId]!}
                key={chainSlug}
                publicKeyHash={accountTezAddress}
                assetSlug={assetSlug}
                manageActive={manageActive}
              />
            );
          }

          return (
            <EvmListItem
              key={chainSlug}
              network={evmChains[chainId]!}
              assetSlug={assetSlug}
              publicKeyHash={accountEvmAddress}
              manageActive={manageActive}
            />
          );
        });
      }
    }, [groupedSlugs, displayedSlugs, evmChains, tezosChains, manageActive, accountEvmAddress, accountTezAddress]);

    return (
      <TokensTabBase
        tokensCount={displayedSlugs.length}
        searchValue={searchValue}
        loadNextPage={loadNext}
        onSearchValueChange={setSearchValue}
        isSyncing={isSyncing}
      >
        {tokensView}
      </TokensTabBase>
    );
  }
);
