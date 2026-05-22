import { Activity, createContext, FC, useContext, useRef } from 'react';

import { range } from 'lodash';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { usePreservedOrderSlugsToManage } from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useEvmCollectiblesMetadataLoading } from 'app/hooks/use-evm-collectibles-meta-loading';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { useEvmChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useEvmChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { EvmChain, useEvmChainByChainId } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import { makeFallbackChain, useRenderPromo } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';
import { TokenListItemFC, TokensViewWithPromo } from './tokens-views';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

const EvmChainTokensTabContext = createContext<
  Omit<Props, 'chainId'> & { network: EvmChain } & Pick<
      TokensTabBaseProps,
      'evmCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'
    >
>({
  network: makeFallbackChain(EVM_DEFAULT_NETWORKS[0]),
  publicKeyHash: '0x',
  accountId: '',
  evmCollectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});

export const EvmChainTokensTab: FC<Props> = ({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const evmCollectibles = useEvmChainAccountCollectibles(publicKeyHash, chainId);
  const collectiblesLoading = useEvmBalancesAreLoading();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesReady = evmCollectibles.length > 0 || (!collectiblesLoading && !collectiblesMetadataLoading);
  const collectiblesSortPredicate = useEvmChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const { manageActive } = useTokensManageState();
  const contextValue = {
    accountId,
    network,
    publicKeyHash,
    evmCollectibles,
    collectiblesReady,
    collectiblesSortPredicate
  };

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  return (
    <EvmChainTokensTabContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="evm-chain-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="evm-chain-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </EvmChainTokensTabContext>
  );
};

const TabContent: FC = () => {
  const { publicKeyHash, network } = useContext(EvmChainTokensTabContext);
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, shouldShowHiddenTokensHint } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideSmallBalance
  );

  return (
    <TabContentBase
      manageActive={false}
      allSlugsSorted={enabledSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { publicKeyHash, network } = useContext(EvmChainTokensTabContext);
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

  return <TabContentBase allSlugsSorted={allSlugsSorted} manageActive={true} />;
};

interface TabContentBaseProps {
  manageActive: boolean;
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

const TabContentBase: FC<TabContentBaseProps> = ({ allSlugsSorted, manageActive, shouldShowHiddenTokensHint }) => {
  const { publicKeyHash, network, accountId, ...tokensTabBaseProps } = useContext(EvmChainTokensTabContext);
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

  const getElementIndex = () => range(0, displayedSlugs.length + 1);

  const Promo = useRenderPromo(manageActive, promoRef);

  return (
    <TokensTabBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={loadNext}
      isSyncingTokens={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensTabBaseProps}
    >
      <TokensViewWithPromo
        displayedSlugs={displayedSlugs}
        Promo={Promo}
        firstListItemRef={firstListItemRef}
        TokenListItem={TokenListItem}
      />
    </TokensTabBase>
  );
};
