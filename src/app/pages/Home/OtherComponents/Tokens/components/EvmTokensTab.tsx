import React, { FC, memo, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { useEvmAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { useChainsSlugsGrouping } from 'app/hooks/listing-logic/use-grouped-slugs';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens } from 'lib/assets/hooks/tokens';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { getTokensViewWithPromo } from '../utils';

import { EvmListItem } from './ListItem';
import { TokensTabBase } from './TokensTabBase';

interface Props {
  publicKeyHash: HexString;
}

export const EvmTokensTab = memo<Props>(({ publicKeyHash }) => {
  const { manageActive } = useAssetsViewState();

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} />;

  return <TabContent publicKeyHash={publicKeyHash} />;
});

const TabContent: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted } = useEnabledSlugsSorted(publicKeyHash, hideZeroBalance);

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledChainSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, tokens, tokensSortPredicate } = useEnabledSlugsSorted(
    publicKeyHash,
    hideZeroBalance
  );

  const allChainsSlugsSorted = useMemoWithCompare(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
        .sort(tokensSortPredicate),
    [tokens, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainSlugsSorted, allChainsSlugsSorted);

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={allSlugsSorted}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  publicKeyHash: HexString;
  allSlugsSorted: string[];
  groupByNetwork: boolean;
  manageActive: boolean;
}

const TabContentBase: FC<TabContentBaseProps> = ({ publicKeyHash, allSlugsSorted, groupByNetwork, manageActive }) => {
  const evmChains = useAllEvmChains();

  const { displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useEvmAccountTokensListingLogic(allSlugsSorted);

  const groupedSlugs = useChainsSlugsGrouping<number>(displayedSlugs, groupByNetwork);

  const tokensView = useMemo(() => {
    const promoJsx = manageActive ? null : (
      <PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionVariant.Text}
        pageName="Token page"
      />
    );

    if (groupedSlugs)
      return groupedSlugs.map(([chainId, chainSlugs], gi) => (
        <React.Fragment key={chainId}>
          <div className={clsx('mb-0.5 p-1 text-font-description-bold', gi > 0 && 'mt-4')}>
            {evmChains[chainId]?.name ?? 'Unknown chain'}
          </div>

          {(() => {
            const tokensJsx = buildTokensJsxArray(chainSlugs);

            if (gi > 0) return tokensJsx;

            return getTokensViewWithPromo(tokensJsx, promoJsx);
          })()}
        </React.Fragment>
      ));

    const tokensJsx = buildTokensJsxArray(displayedSlugs);

    return getTokensViewWithPromo(tokensJsx, promoJsx);

    function buildTokensJsxArray(chainSlugs: string[]) {
      return chainSlugs.map(chainSlug => {
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
    }
  }, [groupedSlugs, displayedSlugs, manageActive, evmChains, publicKeyHash]);

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

const useEnabledSlugsSorted = (publicKeyHash: HexString, filterZeroBalances: boolean) => {
  const tokens = useEvmAccountTokens(publicKeyHash);

  const enabledChains = useEnabledEvmChains();

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balances = useRawEvmAccountBalancesSelector(publicKeyHash);

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

      const balance = balances[chainId]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const enabledSlugs = useMemo(() => {
    const gasSlugs = enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG));

    const enabledTokensSlugs = tokens
      .filter(({ status }) => status === 'enabled')
      .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug));

    return gasSlugs.concat(enabledTokensSlugs);
  }, [tokens, enabledChains]);

  const enabledChainSlugsSorted = useMemoWithCompare(() => {
    const temp3 = filterZeroBalances ? enabledSlugs.filter(isNonZeroBalance) : enabledSlugs;

    return temp3.sort(tokensSortPredicate);
  }, [enabledSlugs, isNonZeroBalance, tokensSortPredicate, filterZeroBalances]);

  return {
    enabledChainSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};
