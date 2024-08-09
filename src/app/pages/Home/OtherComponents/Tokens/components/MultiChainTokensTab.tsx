import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { useAccountTokensListingLogic } from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug } from 'lib/assets/utils';
import { useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { getTokensViewWithPromo } from '../utils';

import { EvmListItem, TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface MultiChainTokensTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainTokensTab = memo<MultiChainTokensTabProps>(({ accountTezAddress, accountEvmAddress }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { manageActive } = useAssetsViewState();

  const tezosChains = useAllTezosChains();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useAccountTokensListingLogic(
    accountTezAddress,
    accountEvmAddress,
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

      const [chainKind, chainId, assetSlug] = fromChainAssetSlug(chainSlug);

      if (chainKind === TempleChainKind.Tezos) {
        return (
          <TezosListItem
            network={tezosChains[chainId]}
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
          chainId={chainId as number}
          assetSlug={assetSlug}
          publicKeyHash={accountEvmAddress}
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

    return getTokensViewWithPromo(tokensJsx, promoJsx, paginatedSlugs.length);
  }, [paginatedSlugs, manageActive, accountEvmAddress, tezosChains, accountTezAddress]);

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  return (
    <TokensTabBase
      tokensCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
    >
      {tokensView}
    </TokensTabBase>
  );
});
