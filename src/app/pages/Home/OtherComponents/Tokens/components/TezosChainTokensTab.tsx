import React, { FC, memo, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTezosChainAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { TEMPLE_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosChainAccountTokens } from 'lib/assets/hooks/tokens';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useTezosChainByChainId } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { getTokensViewWithPromo } from '../utils';

import { TezosListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  chainId: string;
  publicKeyHash: string;
}

export const TezosChainTokensTab = memo<Props>(({ chainId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} network={network} />;

  return <TabContent publicKeyHash={publicKeyHash} network={network} />;
});

interface TabContentProps {
  publicKeyHash: string;
  network: TezosNetworkEssentials;
}

const TabContent: FC<TabContentProps> = ({ publicKeyHash, network }) => {
  const { chainId } = network;

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { enabledTokenSlugsSorted } = useEnabledSlugsSorted(publicKeyHash, chainId);

  const { displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useTezosChainAccountTokensListingLogic(
    enabledTokenSlugsSorted,
    chainId
  );

  const tokensView = useMemo<JSX.Element[]>(() => {
    const tokensJsx = displayedSlugs.map(assetSlug => (
      <TezosListItem
        key={assetSlug}
        network={network}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        manageActive={false}
      />
    ));

    const promoJsx = (
      <PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionVariant.Text}
        pageName="Token page"
      />
    );

    return getTokensViewWithPromo(tokensJsx, promoJsx, displayedSlugs.length);
  }, [network, displayedSlugs, publicKeyHash, mainnetTokensScamSlugsRecord]);

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

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
};

const TabContentWithManageActive: FC<TabContentProps> = ({ publicKeyHash, network }) => {
  const { chainId } = network;

  const { enabledTokenSlugsSorted, tokens, tokensSortPredicate } = useEnabledSlugsSorted(publicKeyHash, chainId);

  const allTokensSlugsSorted = useMemoWithCompare(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ slug }) => slug)
        .sort(tokensSortPredicate),
    [tokens, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledTokenSlugsSorted, allTokensSlugsSorted);

  const { displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useTezosChainAccountTokensListingLogic(
    allSlugsSorted,
    chainId
  );

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tokensView = useMemo<JSX.Element[]>(
    () =>
      displayedSlugs.map(assetSlug => (
        <TezosListItem
          key={assetSlug}
          network={network}
          publicKeyHash={publicKeyHash}
          assetSlug={assetSlug}
          scam={mainnetTokensScamSlugsRecord[assetSlug]}
          manageActive={true}
        />
      )),
    [network, displayedSlugs, publicKeyHash, mainnetTokensScamSlugsRecord]
  );

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

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
};

const useEnabledSlugsSorted = (publicKeyHash: string, chainId: string) => {
  const { hideZeroBalance: filterZeroBalances } = useTokensListOptionsSelector();

  const leadingAssetsSlugs = useMemo(() => (chainId === TEZOS_MAINNET_CHAIN_ID ? [TEMPLE_TOKEN_SLUG] : []), [chainId]);

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useTezosChainAccountTokens(publicKeyHash, chainId);

  const balances = useAllAccountBalancesSelector(publicKeyHash, chainId);

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const leadingAssetsFiltered = useMemoWithCompare(
    () =>
      filterZeroBalances && leadingAssetsSlugs?.length
        ? leadingAssetsSlugs.filter(isNonZeroBalance)
        : leadingAssetsSlugs ?? [],
    [isNonZeroBalance, leadingAssetsSlugs, filterZeroBalances]
  );

  const nonLeadingTokenSlugsFilteredSorted = useMemoWithCompare(() => {
    const temp2 = [TEZ_TOKEN_SLUG, ...tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug)];

    return (filterZeroBalances ? temp2.filter(isNonZeroBalance) : temp2).sort(tokensSortPredicate);
  }, [tokens, isNonZeroBalance, tokensSortPredicate, filterZeroBalances]);

  const enabledTokenSlugsSorted = useMemo(
    () => Array.from(new Set(leadingAssetsFiltered.concat(nonLeadingTokenSlugsFilteredSorted))),
    [leadingAssetsFiltered, nonLeadingTokenSlugsFilteredSorted]
  );

  return {
    enabledTokenSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};
