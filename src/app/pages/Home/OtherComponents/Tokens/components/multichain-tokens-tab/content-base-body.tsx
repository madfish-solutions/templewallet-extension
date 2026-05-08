import { FC, Ref, useContext, useMemo, useRef } from 'react';

import { range } from 'lodash';

import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { getGroupedTokensViewWithPromo, getTokensViewWithPromo } from '../../utils';
import { TokensTabBase, TokensTabBaseProps } from '../tokens-tab-base';

import { MultiChainTokensTabContext } from './context';

interface TabContentBaseBodyProps extends Pick<
  TokensTabBaseProps,
  'loadNextPage' | 'isSyncingTokens' | 'isInSearchMode' | 'shouldShowHiddenTokensHint'
> {
  manageActive: boolean;
  groupedSlugs: ChainGroupedSlugs | null;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  displayedSlugs: string[];
}

// React Compiler cannot handle this file because of some refs used during rendering
export const TabContentBaseBody: FC<TabContentBaseBodyProps> = ({
  manageActive,
  groupedSlugs,
  tezosChains,
  evmChains,
  displayedSlugs,
  ...restProps
}) => {
  const { accountTezAddress, accountEvmAddress, ...tokensTabBaseProps } = useContext(MultiChainTokensTabContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  const { tokensView, getElementIndex } = useMemo(() => {
    const promoJsx =
      manageActive || !PartnersPromotionModule || !AdsConstantsModule ? null : (
        <PartnersPromotionModule.PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
          pageName={AdsConstantsModule.HOME_PAGE_NAME}
          ref={promoRef}
        />
      );

    if (groupedSlugs) {
      return {
        tokensView: getGroupedTokensViewWithPromo({
          groupedSlugs,
          evmChains,
          tezosChains,
          promoJsx,
          firstListItemRef,
          firstHeaderRef,
          buildTokensJsxArray: (slugs, firstListItemRef, indexShift) =>
            buildTokensJsxArray(
              mainnetTokensScamSlugsRecord,
              slugs,
              tezosChains,
              evmChains,
              accountTezAddress,
              accountEvmAddress,
              manageActive,
              firstListItemRef,
              indexShift
            )
        }),
        getElementIndex: () =>
          range(
            0,
            groupedSlugs.reduce((acc, [_, slugs]) => acc + slugs.length, 0)
          )
      };
    }

    const tokensJsx = buildTokensJsxArray(
      mainnetTokensScamSlugsRecord,
      displayedSlugs,
      tezosChains,
      evmChains,
      accountTezAddress,
      accountEvmAddress,
      manageActive,
      firstListItemRef
    );

    if (manageActive) {
      return {
        tokensView: tokensJsx,
        getElementIndex: () => range(0, tokensJsx.length)
      };
    }

    return {
      tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
      getElementIndex: () => range(0, tokensJsx.length + 1)
    };
  }, [
    groupedSlugs,
    displayedSlugs,
    evmChains,
    tezosChains,
    manageActive,
    accountEvmAddress,
    accountTezAddress,
    PartnersPromotionModule,
    AdsConstantsModule
  ]);

  return (
    <TokensTabBase
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      manageActive={manageActive}
      {...restProps}
      {...tokensTabBaseProps}
    >
      {tokensView}
    </TokensTabBase>
  );
};

function buildTokensJsxArray(
  scamSlugs: Record<string, boolean>,
  chainSlugs: string[],
  tezosChains: StringRecord<TezosChain>,
  evmChains: StringRecord<EvmChain>,
  accountTezAddress: string,
  accountEvmAddress: HexString,
  manageActive: boolean,
  firstListItemRef: Ref<TokenListItemElement>,
  indexShift = 0
) {
  return chainSlugs.map((chainSlug, i) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    if (chainKind === TempleChainKind.Tezos) {
      return (
        <TezosTokenListItem
          network={tezosChains[chainId]!}
          index={i + indexShift}
          key={chainSlug}
          publicKeyHash={accountTezAddress}
          scam={scamSlugs[assetSlug]}
          assetSlug={assetSlug}
          manageActive={manageActive}
          ref={i === 0 ? firstListItemRef : null}
        />
      );
    }

    return (
      <EvmTokenListItem
        showTags
        key={chainSlug}
        network={evmChains[chainId]!}
        index={i + indexShift}
        assetSlug={assetSlug}
        publicKeyHash={accountEvmAddress}
        manageActive={manageActive}
        ref={i === 0 ? firstListItemRef : null}
      />
    );
  });
}
