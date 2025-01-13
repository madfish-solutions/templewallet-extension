import React, { FC, memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';

import { getTokensViewWithPromo } from '../utils';

import { EvmListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainTokensTab = memo<Props>(({ chainId, publicKeyHash }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} network={network} />;

  return <TabContent publicKeyHash={publicKeyHash} network={network} />;
});

interface TabContentProps {
  publicKeyHash: HexString;
  network: EvmChain;
}

const TabContent: FC<TabContentProps> = ({ publicKeyHash, network }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted } = useEvmChainAccountTokensForListing(publicKeyHash, network.chainId, hideZeroBalance);

  return (
    <TabContentBase
      allSlugsSorted={enabledSlugsSorted}
      publicKeyHash={publicKeyHash}
      network={network}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<TabContentProps> = ({ publicKeyHash, network }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, tokens, tokensSortPredicate } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideZeroBalance
  );

  const storedSlugs = useMemo(
    () => tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug),
    [tokens]
  );

  const allStoredSlugsSorted = useMemoWithCompare(
    () => storedSlugs.sort(tokensSortPredicate),
    [storedSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledSlugsSorted, allStoredSlugsSorted);

  return (
    <TabContentBase
      allSlugsSorted={allSlugsSorted}
      publicKeyHash={publicKeyHash}
      network={network}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  allSlugsSorted: string[];
  publicKeyHash: HexString;
  network: EvmChain;
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(({ allSlugsSorted, publicKeyHash, network, manageActive }) => {
  const { displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );

  const tokensView = useMemo(() => {
    const tokensJsx = displayedSlugs.map(slug => (
      <EvmListItem
        key={slug}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        network={network}
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
  }, [displayedSlugs, manageActive, network, publicKeyHash]);

  return (
    <TokensTabBase
      tokensCount={displayedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      network={network}
    >
      {tokensView}
    </TokensTabBase>
  );
});
