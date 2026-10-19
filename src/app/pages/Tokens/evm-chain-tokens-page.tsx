import { Activity, createContext, FC, useContext } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, VirtualTokensView } from 'app/templates/tokens/tokens-views';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { makeFallbackChain, useRenderPromo, useEvmChainTokenWillBeRendered } from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { TokensPageBase } from './tokens-page-base';
import { TokensPageWrapper } from './tokens-page-wrapper';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

const EvmChainTokensPageContext = createContext<Omit<Props, 'chainId'> & { network: EvmChain }>({
  network: makeFallbackChain(EVM_DEFAULT_NETWORKS[0]),
  publicKeyHash: '0x',
  accountId: ''
});

export const EvmChainTokensPage: FC<Props> = ({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive, toggleManageActive } = useTokensManageState();

  return (
    <TokensPageWrapper manageActive={manageActive} toggleManageActive={toggleManageActive}>
      <EvmChainTokensPageContext value={{ accountId, network, publicKeyHash }}>
        <Activity mode={manageActive ? 'hidden' : 'visible'} name="evm-chain-tokens-page-default">
          <PageContent />
        </Activity>

        <Activity mode={manageActive ? 'visible' : 'hidden'} name="evm-chain-tokens-page-manage">
          <PageContentWithManageActive />
        </Activity>
      </EvmChainTokensPageContext>
    </TokensPageWrapper>
  );
};

const PageContent: FC = () => {
  const { publicKeyHash, network } = useContext(EvmChainTokensPageContext);
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, shouldShowHiddenTokensHint } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideSmallBalance
  );

  return (
    <PageContentBase
      manageActive={false}
      allSlugsSorted={enabledSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const PageContentWithManageActive: FC = () => {
  const { publicKeyHash, network } = useContext(EvmChainTokensPageContext);
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, tokens, tokensSortPredicate } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideSmallBalance
  );

  const storedSlugs = tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug);

  const allStoredSlugsSorted = useMemoWithCompare(
    () => storedSlugs.sort(tokensSortPredicate),
    [storedSlugs, tokensSortPredicate]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledSlugsSorted, allStoredSlugsSorted);

  return <PageContentBase allSlugsSorted={allSlugsSorted} manageActive={true} />;
};

interface PageContentBaseProps {
  manageActive: boolean;
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

const PageContentBase: FC<PageContentBaseProps> = ({ allSlugsSorted, manageActive, shouldShowHiddenTokensHint }) => {
  const { publicKeyHash, network, accountId, ...tokensPageBaseProps } = useContext(EvmChainTokensPageContext);
  const { displayedSlugs, isSyncing, isInSearchMode } = useEvmChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );

  const TokenListItem: TokenListItemFC = ({ slug }) => (
    <EvmTokenListItem
      showTags
      network={network}
      assetSlug={slug}
      publicKeyHash={publicKeyHash}
      manageActive={manageActive}
    />
  );

  const tokenWillBeRendered = useEvmChainTokenWillBeRendered(network.chainId);
  const Promo = useRenderPromo(manageActive, 'tokens');

  return (
    <TokensPageBase
      applicableNetworks={[network]}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensPageBaseProps}
    >
      <VirtualTokensView
        slugs={displayedSlugs}
        tokenWillBeRendered={tokenWillBeRendered}
        Promo={Promo}
        TokenListItem={TokenListItem}
      />
    </TokensPageBase>
  );
};
