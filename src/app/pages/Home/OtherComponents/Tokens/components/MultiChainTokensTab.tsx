import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { useAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-account-tokens-listing-logic';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug } from 'lib/assets/utils';
import { useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmListItem, TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface MultiChainTokensTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainTokensTab = memo<MultiChainTokensTabProps>(({ accountTezAddress, accountEvmAddress }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { manageActive } = useManageAssetsState();

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

    if (paginatedSlugs.length < 5) {
      tokensJsx.push(promoJsx);
    } else {
      tokensJsx.splice(2, 0, promoJsx);
    }

    return tokensJsx;
  }, [paginatedSlugs, tezosChains, manageActive]);

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
});
