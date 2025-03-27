import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';

import {
  useEvmAccountTokensForListing,
  useEvmAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useChainsSlugsGrouping } from 'app/hooks/listing-logic/use-slugs-grouping';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { getTokensViewWithPromo } from '../utils';

import { EvmListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  publicKeyHash: HexString;
}

export const EvmTokensTab = memo<Props>(({ publicKeyHash }) => {
  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} />;

  return <TabContent publicKeyHash={publicKeyHash} />;
});

const TabContent: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted } = useEvmAccountTokensForListing(publicKeyHash, hideZeroBalance);

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledChainSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, tokens, tokensSortPredicate } = useEvmAccountTokensForListing(
    publicKeyHash,
    hideZeroBalance
  );

  const allChainsSlugs = useMemo(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug)),
    [tokens]
  );

  const allChainsSlugsSorted = useMemoWithCompare(
    () => allChainsSlugs.sort(tokensSortPredicate),
    [allChainsSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainSlugsSorted, allChainsSlugsSorted);

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
  publicKeyHash: HexString;
  allSlugsSorted: string[];
  groupByNetwork: boolean;
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ publicKeyHash, allSlugsSorted, groupByNetwork, manageActive }) => {
  const { displayedSlugs, isSyncing, loadNext, searchValue, isInSearchMode, setSearchValue } =
    useEvmAccountTokensListingLogic(allSlugsSorted);

  const groupedSlugs = useChainsSlugsGrouping<number>(displayedSlugs, groupByNetwork);

  const mainnetChain = useEthereumMainnetChain();
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
      return groupedSlugs.map(([chainId, chainSlugs], gi) => (
        <React.Fragment key={chainId}>
          <div className={clsx('mb-0.5 p-1 text-font-description-bold', gi > 0 && 'mt-4')}>
            {evmChains[chainId]?.name ?? 'Unknown chain'}
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
        const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

        return (
          <EvmListItem
            key={chainSlug}
            network={evmChains[chainId]!}
            assetSlug={slug}
            publicKeyHash={publicKeyHash}
            manageActive={manageActive}
          />
        );
      });
    }
  }, [groupedSlugs, displayedSlugs, manageActive, evmChains, publicKeyHash]);

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
