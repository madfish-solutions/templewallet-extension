import { FC, Ref, useContext, useMemo, useRef } from 'react';

import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { parseChainAssetSlug } from 'lib/assets/utils';
import {
  getGroupedTokensViewWithPromo,
  getTokensViewWithPromo,
  makeGetTokenElementIndexFunction,
  makeGroupedTokenElementIndexFunction,
  TokenListItemElement
} from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { Promo } from '../promo';
import { TokensPageBase, TokensPageBaseProps } from '../tokens-page-base';

import { MultiChainTokensPageContext } from './context';

interface PageContentBaseBodyProps extends Pick<
  TokensPageBaseProps,
  'loadNextPage' | 'isSyncing' | 'isInSearchMode' | 'shouldShowHiddenTokensHint' | 'applicableNetworks'
> {
  manageActive: boolean;
  groupedSlugs: ChainGroupedSlugs | null;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  displayedSlugs: string[];
}

// React Compiler cannot handle this file because of some refs used during rendering
export const PageContentBaseBody: FC<PageContentBaseBodyProps> = ({
  manageActive,
  groupedSlugs,
  tezosChains,
  evmChains,
  displayedSlugs,
  ...restProps
}) => {
  const { accountTezAddress, accountEvmAddress, ...tokensPageBaseProps } = useContext(MultiChainTokensPageContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { tokensView, getElementIndex } = useMemo(() => {
    const promoJsx = manageActive ? null : <Promo key="promo" ref={promoRef} />;

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
        getElementIndex: makeGroupedTokenElementIndexFunction(promoRef, firstListItemRef, firstHeaderRef, groupedSlugs)
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
        getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
      };
    }

    return {
      tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
      getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
    };
  }, [groupedSlugs, displayedSlugs, evmChains, tezosChains, manageActive, accountEvmAddress, accountTezAddress]);

  return (
    <TokensPageBase
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      manageActive={manageActive}
      {...restProps}
      {...tokensPageBaseProps}
    >
      {tokensView}
    </TokensPageBase>
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
