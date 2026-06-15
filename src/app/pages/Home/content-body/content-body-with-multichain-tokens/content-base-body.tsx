import { FC } from 'react';

import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useRenderPromo } from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ContentBodyBase, ContentBodyBaseProps } from '../content-body-base';

import { ContentBodyWithMultiChainTokensProps } from './types';

interface ContentBaseBodyProps
  extends
    ContentBodyWithMultiChainTokensProps,
    Omit<ContentBodyBaseProps, 'tokensCount' | 'getElementIndex' | 'accountId' | 'network'> {
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  displayedSlugs: string[];
}

export const ContentBaseBody: FC<ContentBaseBodyProps> = ({
  tezosChains,
  evmChains,
  displayedSlugs,
  accountTezAddress,
  accountEvmAddress,
  ...restProps
}) => {
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const TokenListItem: TokenListItemFC = ({ slug: chainSlug, ref, index }) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    const commonProps = { index, ref, assetSlug, showTags: false };

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

    return <EvmTokenListItem network={evmChains[chainId]!} publicKeyHash={accountEvmAddress} {...commonProps} />;
  };

  const Promo = useRenderPromo(false, 'home');

  return (
    <ContentBodyBase tokensCount={displayedSlugs.length} {...restProps}>
      <TokensViewWithPromo displayedSlugs={displayedSlugs} Promo={Promo} TokenListItem={TokenListItem} />
    </ContentBodyBase>
  );
};
