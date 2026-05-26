import { Activity, createContext, FC, useContext, useRef } from 'react';

import { noop } from 'lodash';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  makeFallbackChain,
  getTokenElementIndex,
  TokenListItemElement,
  useRenderPromo,
  useEvmChainTokenWillBeRendered
} from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { TokensPageBase, TokensPageBaseProps } from './tokens-page-base';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

const EvmChainTokensPageContext = createContext<
  Omit<Props, 'chainId'> & { network: EvmChain } & Pick<TokensPageBaseProps, 'toggleManageActive'>
>({
  network: makeFallbackChain(EVM_DEFAULT_NETWORKS[0]),
  publicKeyHash: '0x',
  accountId: '',
  toggleManageActive: noop
});

export const EvmChainTokensPage: FC<Props> = ({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { manageActive, toggleManageActive } = useTokensManageState();

  return (
    <EvmChainTokensPageContext value={{ accountId, network, publicKeyHash, toggleManageActive }}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="evm-chain-tokens-page-default">
        <PageContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="evm-chain-tokens-page-manage">
        <PageContentWithManageActive />
      </Activity>
    </EvmChainTokensPageContext>
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
  const { displayedSlugs, isSyncing, loadNext, isInSearchMode } = useEvmChainAccountTokensListingLogic(
    allSlugsSorted,
    network.chainId
  );
  const promoRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);

  const TokenListItem: TokenListItemFC = ({ slug, ref, index }) => {
    return (
      <EvmTokenListItem
        showTags
        network={network}
        index={index}
        assetSlug={slug}
        publicKeyHash={publicKeyHash}
        manageActive={manageActive}
        ref={ref}
      />
    );
  };

  const tokenWillBeRendered = useEvmChainTokenWillBeRendered(network);
  const getElementIndex = (y: number) =>
    getTokenElementIndex(promoRef.current, firstListItemRef.current, displayedSlugs, tokenWillBeRendered, y);

  const Promo = useRenderPromo(manageActive, 'tokens', promoRef);

  return (
    <TokensPageBase
      applicableNetworks={[network]}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={loadNext}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensPageBaseProps}
    >
      <TokensViewWithPromo
        displayedSlugs={displayedSlugs}
        Promo={Promo}
        firstListItemRef={firstListItemRef}
        TokenListItem={TokenListItem}
      />
    </TokensPageBase>
  );
};
