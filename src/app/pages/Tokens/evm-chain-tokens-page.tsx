import { Activity, createContext, FC, useContext, useMemo, useRef } from 'react';

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
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  getTokensViewWithPromo,
  makeFallbackChain,
  makeGetTokenElementIndexFunction,
  TokenListItemElement
} from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { Promo } from './promo';
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
  const contextValue = useMemo(
    () => ({ accountId, network, publicKeyHash, toggleManageActive }),
    [accountId, network, publicKeyHash, toggleManageActive]
  );

  return (
    <EvmChainTokensPageContext value={contextValue}>
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

  const tokensJsx = useMemo(
    () =>
      displayedSlugs.map((slug, i) => (
        <EvmTokenListItem
          showTags
          key={slug}
          assetSlug={slug}
          publicKeyHash={publicKeyHash}
          network={network}
          index={i}
          manageActive={manageActive}
          ref={i === 0 ? firstListItemRef : null}
        />
      )),
    [displayedSlugs, publicKeyHash, network, manageActive]
  );

  const tokensView = useMemo(
    () => (manageActive ? tokensJsx : getTokensViewWithPromo(tokensJsx, <Promo ref={promoRef} />)),
    [manageActive, tokensJsx, promoRef]
  );
  const getElementIndex = useMemo(
    () => makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length),
    [tokensJsx, promoRef, firstListItemRef]
  );

  const applicableNetworks = useMemo(() => [network], [network]);

  return (
    <TokensPageBase
      applicableNetworks={applicableNetworks}
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
      {tokensView}
    </TokensPageBase>
  );
};
