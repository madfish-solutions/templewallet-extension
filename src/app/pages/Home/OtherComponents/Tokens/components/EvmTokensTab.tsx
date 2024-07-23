import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { useEvmAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-evm-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug } from 'lib/assets/utils';

import { EvmListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface EvmTokensTabProps {
  publicKeyHash: HexString;
}

export const EvmTokensTab: FC<EvmTokensTabProps> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { manageActive } = useAssetsViewState();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmAccountTokensListingLogic(
    publicKeyHash,
    hideZeroBalance,
    groupByNetwork,
    manageActive
  );

  const tokensView = useMemo(() => {
    const tokensJsx = paginatedSlugs.map((chainSlug, index) => {
      if (!chainSlug.includes(CHAIN_SLUG_SEPARATOR)) {
        return (
          <div key={chainSlug} className={clsx('mb-0.5 p-1 text-font-description-bold', index > 0 && 'mt-4')}>
            {chainSlug}
          </div>
        );
      }

      const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

      return (
        <EvmListItem
          key={chainSlug}
          chainId={chainId}
          assetSlug={slug}
          publicKeyHash={publicKeyHash}
          manageActive={manageActive}
        />
      );
    });

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
