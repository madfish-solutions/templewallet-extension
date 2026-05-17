import { FC, Ref } from 'react';

import { useCollectiblesManageState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmCollectibleItem, TezosCollectibleItem } from 'app/templates/collectibles/collectible-item';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { NftsListView } from './components/nfts-list-view';
import { NftsPageSelectors } from './selectors';

interface NftsListProps {
  noCollectiblesAtAll: boolean;
  isSyncing: boolean;
  isInSearchMode: boolean;
  paginatedSlugs: string[];
  loadNext: EmptyFn;
  openCustomTokenModal: EmptyFn;
}

export const NftsList: FC<NftsListProps> = ({
  noCollectiblesAtAll,
  isSyncing,
  isInSearchMode,
  paginatedSlugs,
  loadNext,
  openCustomTokenModal
}) => {
  const { blur, showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useCollectiblesManageState();
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const renderItem = (chainSlug: string, index: number, ref?: Ref<CollectiblesListItemElement>) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    const commonProps = {
      assetSlug,
      showDetails: showInfo,
      manageActive: manageActive,
      index,
      ref,
      testID: NftsPageSelectors.collectibleItem,
      nameTestID: NftsPageSelectors.collectibleName
    };

    if (chainKind === TempleChainKind.Tezos) {
      return (
        <TezosCollectibleItem
          {...commonProps}
          key={chainSlug}
          accountPkh={accountTezAddress!}
          tezosChainId={chainId as string}
          adultBlur={blur}
          scam={mainnetTokensScamSlugsRecord[assetSlug]}
        />
      );
    }

    return (
      <EvmCollectibleItem
        {...commonProps}
        key={chainSlug}
        evmChainId={chainId as number}
        accountPkh={accountEvmAddress!}
      />
    );
  };

  return (
    <NftsListView
      noCollectiblesAtAll={noCollectiblesAtAll}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      chainSlugs={paginatedSlugs}
      loadNextPage={loadNext}
      renderItem={renderItem}
      openCustomTokenModal={openCustomTokenModal}
    />
  );
};
