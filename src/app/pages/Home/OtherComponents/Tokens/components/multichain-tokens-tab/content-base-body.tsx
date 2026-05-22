import { FC, useContext, useRef } from 'react';

import { range } from 'lodash';

import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useRenderPromo } from '../../utils';
import { TokensTabBase, TokensTabBaseProps } from '../tokens-tab-base';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from '../tokens-views';

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

  const getElementIndex = () =>
    range(
      0,
      groupedSlugs ? groupedSlugs.reduce((acc, [_, slugs]) => acc + slugs.length, 0) : displayedSlugs.length + 1
    );

  const Promo = useRenderPromo(manageActive, promoRef);

  return (
    <TokensTabBase
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      manageActive={manageActive}
      {...restProps}
      {...tokensTabBaseProps}
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
    </TokensTabBase>
  );
};
