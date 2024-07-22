import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { useTezosAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-tezos-account-tokens-listing-logic';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug } from 'lib/assets/utils';
import { useAllTezosChains } from 'temple/front';

import { TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface TezosTokensTabProps {
  publicKeyHash: string;
}

export const TezosTokensTab: FC<TezosTokensTabProps> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { manageActive } = useManageAssetsState();

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tezosChains = useAllTezosChains();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useTezosAccountTokensListingLogic(
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
  }, [paginatedSlugs, tezosChains, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

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
