import { FC, useContext } from 'react';

import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, VirtualTokensView } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useRenderPromo, useTokenWillBeRendered } from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensPageBase, TokensPageBaseProps } from '../tokens-page-base';

import { MultiChainTokensPageContext } from './context';

interface PageContentBaseBodyProps extends Pick<
  TokensPageBaseProps,
  'isSyncing' | 'isInSearchMode' | 'shouldShowHiddenTokensHint' | 'applicableNetworks'
> {
  manageActive: boolean;
  groupedSlugs: ChainGroupedSlugs | null;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  displayedSlugs: string[];
}

export const PageContentBaseBody: FC<PageContentBaseBodyProps> = ({
  manageActive,
  groupedSlugs,
  tezosChains,
  evmChains,
  displayedSlugs,
  ...restProps
}) => {
  const { accountTezAddress, accountEvmAddress, ...tokensPageBaseProps } = useContext(MultiChainTokensPageContext);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const TokenListItem: TokenListItemFC = ({ slug: chainSlug }) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    const commonProps = { assetSlug, manageActive };

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

  const tokenWillBeRendered = useTokenWillBeRendered();
  const Promo = useRenderPromo(manageActive, 'tokens');

  return (
    <TokensPageBase
      tokensCount={displayedSlugs.length}
      manageActive={manageActive}
      {...restProps}
      {...tokensPageBaseProps}
    >
      <VirtualTokensView
        slugs={displayedSlugs}
        groupedSlugs={groupedSlugs}
        evmChains={evmChains}
        tezosChains={tezosChains}
        tokenWillBeRendered={tokenWillBeRendered}
        Promo={Promo}
        TokenListItem={TokenListItem}
      />
    </TokensPageBase>
  );
};
