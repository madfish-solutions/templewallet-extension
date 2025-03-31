import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';

import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useChainsSlugsGrouping } from 'app/hooks/listing-logic/use-slugs-grouping';
import {
  useTezosAccountTokensForListing,
  useTezosAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { getTokensViewWithPromo } from '../utils';

import { TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  publicKeyHash: string;
}

export const TezosTokensTab = memo<Props>(({ publicKeyHash }) => {
  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} />;

  return <TabContent publicKeyHash={publicKeyHash} />;
});

const TabContent: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted } = useTezosAccountTokensForListing(publicKeyHash, hideZeroBalance);

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledChainsSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, tokens, tokensSortPredicate } = useTezosAccountTokensForListing(
    publicKeyHash,
    hideZeroBalance
  );

  const allTezosTokensSlugs = useMemo(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
    [tokens]
  );

  const allTezosTokensSlugsSorted = useMemoWithCompare(
    () => allTezosTokensSlugs.sort(tokensSortPredicate),
    [allTezosTokensSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainsSlugsSorted, allTezosTokensSlugsSorted);

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={allSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  publicKeyHash: string;
  allSlugsSorted: string[];
  groupByNetwork: boolean;
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ publicKeyHash, allSlugsSorted, groupByNetwork, manageActive }) => {
  const { displayedSlugs, isSyncing, isInSearchMode, loadNext, searchValue, setSearchValue } =
    useTezosAccountTokensListingLogic(allSlugsSorted);

  const groupedSlugs = useChainsSlugsGrouping<string>(displayedSlugs, groupByNetwork);

  const mainnetChain = useTezosMainnetChain();
  const tezosChains = useAllTezosChains();
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

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
      return groupedSlugs.map(([chainId, chainSlugs], gi) => (
        <React.Fragment key={chainId}>
          <div className={clsx('mb-0.5 p-1 text-font-description-bold', gi > 0 && 'mt-4')}>
            {tezosChains[chainId]?.name ?? 'Unknown chain'}
          </div>

          {(() => {
            const tokensJsx = buildTokensJsxArray(chainSlugs);

            if (gi > 0) return tokensJsx;

            return getTokensViewWithPromo(tokensJsx, promoJsx);
          })()}
        </React.Fragment>
      ));

    const tokensJsx = buildTokensJsxArray(displayedSlugs);

    return getTokensViewWithPromo(tokensJsx, promoJsx);

    function buildTokensJsxArray(chainSlugs: string[]) {
      return chainSlugs.map(chainSlug => {
        const [_, chainId, assetSlug] = fromChainAssetSlug<string>(chainSlug);

        return (
          <TezosListItem
            network={tezosChains[chainId]}
            key={chainSlug}
            publicKeyHash={publicKeyHash}
            assetSlug={assetSlug}
            scam={mainnetTokensScamSlugsRecord[assetSlug]}
            manageActive={manageActive}
          />
        );
      });
    }
  }, [groupedSlugs, displayedSlugs, tezosChains, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

  return (
    <TokensTabBase
      tokensCount={displayedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
    >
      {tokensView}
    </TokensTabBase>
  );
});
