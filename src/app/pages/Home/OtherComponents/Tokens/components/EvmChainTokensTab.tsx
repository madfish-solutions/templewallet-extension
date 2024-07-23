import React, { FC, useMemo } from 'react';

import { useEvmChainAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-evm-chain-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';

import { EvmListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface EvmChainTokensTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainTokensTab: FC<EvmChainTokensTabProps> = ({ chainId, publicKeyHash }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { manageActive } = useAssetsViewState();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmChainAccountTokensListingLogic(
    publicKeyHash,
    chainId,
    hideZeroBalance,
    manageActive
  );

  const tokensView = useMemo(() => {
    const tokensJsx = paginatedSlugs.map(slug => (
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

    if (paginatedSlugs.length < 5) {
      tokensJsx.push(promoJsx);
    } else {
      tokensJsx.splice(2, 0, promoJsx);
    }

    return tokensJsx;
  }, [paginatedSlugs, manageActive]);

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  return (
    <TokensTabBase
      tokensView={tokensView}
      tokensCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
    />
  );
};
