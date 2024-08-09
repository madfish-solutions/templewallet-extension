import React, { FC, memo, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useEvmChainAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmChainAccountTokens } from 'lib/assets/hooks/tokens';
import { useEvmChainTokensSortPredicate } from 'lib/assets/use-sorting';
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

  const { enabledSlugsSorted } = useEnabledSlugsSorted(publicKeyHash, chainId, hideZeroBalance);

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

  const { enabledSlugsSorted, tokens, tokensSortPredicate } = useEnabledSlugsSorted(
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

const TabContentBase: FC<TabContentBaseProps> = ({ allSlugsSorted, publicKeyHash, chainId, manageActive }) => {
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
};

const useEnabledSlugsSorted = (publicKeyHash: HexString, chainId: number, filterZeroBalances: boolean) => {
  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useEvmChainAccountTokens(publicKeyHash, chainId);

  const balances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];

      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const enabledSlugsSorted = useMemoWithCompare(() => {
    const enabledSlugs = [
      EVM_TOKEN_SLUG,
      ...tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug)
    ];

    const enabledSlugsFiltered = filterZeroBalances ? enabledSlugs.filter(isNonZeroBalance) : enabledSlugs;

    return enabledSlugsFiltered.sort(tokensSortPredicate);
  }, [tokens, isNonZeroBalance, tokensSortPredicate, filterZeroBalances]);

  return {
    enabledSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};
