import React, { FC, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useTezosChainAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useTezosChainByChainId } from 'temple/front';

import { TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface TezosChainTokensTabProps {
  chainId: string;
  publicKeyHash: string;
}

export const TezosChainTokensTab: FC<TezosChainTokensTabProps> = ({ chainId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { manageActive } = useManageAssetsState();

  const leadingAssets = useMemo(() => (chainId === TEZOS_MAINNET_CHAIN_ID ? [TEMPLE_TOKEN_SLUG] : []), [chainId]);

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useTezosChainAccountTokensListingLogic(
    publicKeyHash,
    chainId,
    hideZeroBalance,
    leadingAssets,
    manageActive
  );

  const tokensView = useMemo<JSX.Element[]>(() => {
    const tokensJsx = paginatedSlugs.map(assetSlug => (
      <TezosListItem
        key={assetSlug}
        network={network}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
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
  }, [network, paginatedSlugs, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

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
