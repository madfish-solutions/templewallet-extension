import { FC, useContext, useRef } from 'react';

import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement, useGroupableGetTokenElementIndex, useRenderPromo } from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

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

  const TokenListItem: TokenListItemFC = ({ slug: chainSlug, ref, index }) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    const commonProps = { index, ref, assetSlug, manageActive };

    if (chainKind === TempleChainKind.Tezos) {
      return (
        <TezosTokenListItem
          network={tezosChains[chainId]!}
          publicKeyHash={accountTezAddress}
          scam={mainnetTokensScamSlugsRecord[assetSlug]}
          {...commonProps}
        />
      );
    }

    return (
      <EvmTokenListItem showTags network={evmChains[chainId]!} publicKeyHash={accountEvmAddress} {...commonProps} />
    );
  };

  const getElementIndex = useGroupableGetTokenElementIndex(
    groupedSlugs,
    displayedSlugs,
    promoRef,
    firstListItemRef,
    firstHeaderRef
  );
  const Promo = useRenderPromo(manageActive, 'TOKENS_PAGE_NAME', promoRef);

  return (
    <TokensPageBase
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      manageActive={manageActive}
      {...restProps}
      {...tokensPageBaseProps}
    >
      {groupedSlugs ? (
        <GroupedTokensViewWithPromo
          groupedSlugs={groupedSlugs}
          evmChains={evmChains}
          tezosChains={tezosChains}
          Promo={Promo}
          firstListItemRef={firstListItemRef}
          firstHeaderRef={firstHeaderRef}
          TokenListItem={TokenListItem}
        />
      ) : (
        <TokensViewWithPromo
          displayedSlugs={displayedSlugs}
          Promo={Promo}
          firstListItemRef={firstListItemRef}
          TokenListItem={TokenListItem}
        />
      )}
    </TokensPageBase>
  );
};
