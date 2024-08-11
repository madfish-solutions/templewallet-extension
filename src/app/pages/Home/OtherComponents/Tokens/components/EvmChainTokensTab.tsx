import React, { FC, memo, useMemo } from 'react';

import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { getTokensViewWithPromo } from '../utils';

import { EvmListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainTokensTab = memo<Props>(({ chainId, publicKeyHash }) => {
  const { manageActive } = useAssetsViewState();

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} chainId={chainId} />;

  return <TabContent publicKeyHash={publicKeyHash} chainId={chainId} />;
});

const TabContent: FC<Props> = ({ publicKeyHash, chainId }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted } = useEvmChainAccountTokensForListing(publicKeyHash, chainId, hideZeroBalance);

  return (
    <TabContentBase
      allSlugsSorted={enabledSlugsSorted}
      publicKeyHash={publicKeyHash}
      chainId={chainId}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash, chainId }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, tokens, tokensSortPredicate } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    chainId,
    hideZeroBalance
  );

  const allStoredSlugsSorted = useMemoWithCompare(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ slug }) => slug)
        .sort(tokensSortPredicate),
    [tokens, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledSlugsSorted, allStoredSlugsSorted);

  return (
    <TabContentBase
      allSlugsSorted={allSlugsSorted}
      publicKeyHash={publicKeyHash}
      chainId={chainId}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  allSlugsSorted: string[];
  publicKeyHash: HexString;
  chainId: number;
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ allSlugsSorted, publicKeyHash, chainId, manageActive }) => {
  const { displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmChainAccountTokensListingLogic(
    allSlugsSorted,
    chainId
  );

  const tokensView = useMemo(() => {
    const tokensJsx = displayedSlugs.map(slug => (
      <EvmListItem
        key={slug}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        chainId={chainId}
        manageActive={manageActive}
      />
    ));

    if (manageActive) return tokensJsx;

    const promoJsx = (
      <PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionVariant.Text}
        pageName="Token page"
      />
    );

    return getTokensViewWithPromo(tokensJsx, promoJsx);
  }, [displayedSlugs, manageActive, chainId, publicKeyHash]);

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
});
