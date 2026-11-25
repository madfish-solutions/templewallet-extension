import { FC, useContext } from 'react';

import { useEvmAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, VirtualTokensView } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useRenderPromo, useTokenWillBeRendered } from 'lib/ui/tokens-list';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensPageBase } from '../tokens-page-base';

import { EvmTokensPageContext } from './context';

interface PageContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.EVM> | null;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

export const PageContentBase: FC<PageContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const { publicKeyHash, accountId, ...tokensPageBaseProps } = useContext(EvmTokensPageContext);
  const { applicableNetworks, displayedSlugs, displayedGroupedSlugs, isSyncing, isInSearchMode } =
    useEvmAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

  const mainnetChain = useEthereumMainnetChain();
  const evmChains = useAllEvmChains();

  const TokenListItem: TokenListItemFC = ({ slug: chainSlug }) => {
    const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

    return (
      <EvmTokenListItem
        showTags
        network={evmChains[chainId]!}
        assetSlug={assetSlug}
        publicKeyHash={publicKeyHash}
        manageActive={manageActive}
      />
    );
  };

  const tokenWillBeRendered = useTokenWillBeRendered();
  const Promo = useRenderPromo(manageActive, 'tokens');

  return (
    <TokensPageBase
      applicableNetworks={applicableNetworks}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensPageBaseProps}
    >
      <VirtualTokensView
        slugs={displayedSlugs}
        groupedSlugs={displayedGroupedSlugs}
        evmChains={evmChains}
        tokenWillBeRendered={tokenWillBeRendered}
        Promo={Promo}
        TokenListItem={TokenListItem}
      />
    </TokensPageBase>
  );
};
