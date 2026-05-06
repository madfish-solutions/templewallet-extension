import { memo, Ref, useCallback, useMemo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { IconBase, ToggleSwitch } from 'app/atoms';
import { IconButton } from 'app/atoms/IconButton';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import {
  NftsViewStateProvider,
  useManageState,
  useSearchState,
  useSelectedChainsState
} from 'app/hooks/use-collectibles-view-state';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { ContentContainer } from 'app/layouts/containers';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import {
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption,
  setCollectiblesViewAsCollectionsFilterOption
} from 'app/store/assets-filter-options/actions';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmCollectibleItem, TezosCollectibleItem } from 'app/templates/collectibles/collectible-item';
import { SearchBarField } from 'app/templates/SearchField';
import {
  AccountCollectible,
  useEvmAccountCollectibles,
  useTezosAccountCollectibles
} from 'lib/assets/hooks/collectibles';
import {
  useAccountCollectiblesSortPredicate,
  useEvmAccountCollectiblesSortPredicate,
  useTezosAccountCollectiblesSortPredicate
} from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { t, T } from 'lib/i18n';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useBooleanState } from 'lib/ui/hooks';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForEvm, useAccountAddressForTezos, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { CollectionsListView } from './components/collections-list-view';
import { NftsListView } from './components/nfts-list-view';
import { useCollectiblesListingLogic } from './hooks/use-collectibles-listing-logic';
import { useEvmCollectiblesMetadataLoading } from './hooks/use-evm-collectibles-meta-loading';
import { NetworkChips } from './network-chips';
import { NftsPageSelectors } from './selectors';

export const NftsPage = memo(() => {
  const accountAddressForTezos = useAccountAddressForTezos();
  const accountAddressForEvm = useAccountAddressForEvm();

  return (
    <NftsViewStateProvider>
      {accountAddressForTezos && accountAddressForEvm && (
        <MultiChainNftsPage accountTezAddress={accountAddressForTezos} accountEvmAddress={accountAddressForEvm} />
      )}
      {accountAddressForTezos && !accountAddressForEvm && <TezosNftsPage accountTezAddress={accountAddressForTezos} />}
      {!accountAddressForTezos && accountAddressForEvm && <EvmNftsPage accountEvmAddress={accountAddressForEvm} />}
      {!accountAddressForTezos && !accountAddressForEvm && (
        <ContentContainer className="mt-3">{UNDER_DEVELOPMENT_MSG}</ContentContainer>
      )}
    </NftsViewStateProvider>
  );
});

const MultiChainNftsPage = memo<{ accountTezAddress: string; accountEvmAddress: HexString }>(
  ({ accountTezAddress, accountEvmAddress }) => {
    const tezCollectibles = useTezosAccountCollectibles(accountTezAddress);
    const evmCollectibles = useEvmAccountCollectibles(accountEvmAddress);
    const allCollectibles = useMemo(() => tezCollectibles.concat(evmCollectibles), [tezCollectibles, evmCollectibles]);
    const sortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);

    useEvmCollectiblesMetadataLoading(accountEvmAddress);

    return <NftsPageContent allCollectibles={allCollectibles} sortPredicate={sortPredicate} />;
  }
);

const TezosNftsPage = memo<{ accountTezAddress: string }>(({ accountTezAddress }) => (
  <NftsPageContent
    allCollectibles={useTezosAccountCollectibles(accountTezAddress)}
    sortPredicate={useTezosAccountCollectiblesSortPredicate(accountTezAddress)}
  />
));

const EvmNftsPage = memo<{ accountEvmAddress: HexString }>(({ accountEvmAddress }) => {
  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return (
    <NftsPageContent
      allCollectibles={useEvmAccountCollectibles(accountEvmAddress)}
      sortPredicate={useEvmAccountCollectiblesSortPredicate(accountEvmAddress)}
    />
  );
});

interface NftsPageContentProps {
  allCollectibles: AccountCollectible[];
  sortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number;
}

const NftsPageContent = memo(({ allCollectibles, sortPredicate }: NftsPageContentProps) => {
  const { searchValue, setSearchValue } = useSearchState();
  const { selectedChains, chainIsGloballySelected } = useSelectedChainsState();
  const allTezosChains = useAllTezosChains();
  const allEvmChains = useAllEvmChains();
  const { manageActive, toggleManageActive } = useManageState();
  const { blur, showInfo, viewAsCollections } = useCollectiblesListOptionsSelector();
  const {
    isInSearchMode,
    noCollectiblesAtAll,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchedSlugsByCollections,
    enabledCollectibles,
    tezDetailsReady
  } = useCollectiblesListingLogic(allCollectibles, sortPredicate);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const [filtersModalOpen, openFiltersModal, closeFiltersModal] = useBooleanState(false);

  const setBlurEnabled = useCallback((value: boolean) => dispatch(setCollectiblesBlurFilterOption(value)), []);
  const setShowInfoEnabled = useCallback((value: boolean) => dispatch(setCollectiblesShowInfoFilterOption(value)), []);
  const setViewAsCollectionsEnabled = useCallback(
    (value: boolean) => dispatch(setCollectiblesViewAsCollectionsFilterOption(value)),
    []
  );

  const renderItem = useCallback(
    (chainSlug: string, index: number, ref?: Ref<CollectiblesListItemElement>) => {
      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

      if (chainKind === TempleChainKind.Tezos) {
        return (
          <TezosCollectibleItem
            key={chainSlug}
            assetSlug={slug}
            accountPkh={accountTezAddress!}
            tezosChainId={chainId as string}
            adultBlur={blur}
            showDetails={showInfo}
            manageActive={manageActive}
            scam={mainnetTokensScamSlugsRecord[slug]}
            index={index}
            ref={ref}
            testID={NftsPageSelectors.collectibleItem}
            nameTestID={NftsPageSelectors.collectibleName}
          />
        );
      }

      return (
        <EvmCollectibleItem
          key={chainSlug}
          assetSlug={slug}
          evmChainId={chainId as number}
          accountPkh={accountEvmAddress!}
          showDetails={showInfo}
          manageActive={manageActive}
          index={index}
          ref={ref}
          testID={NftsPageSelectors.collectibleItem}
          nameTestID={NftsPageSelectors.collectibleName}
        />
      );
    },
    [accountEvmAddress, accountTezAddress, blur, mainnetTokensScamSlugsRecord, manageActive, showInfo]
  );

  const network = useMemo(() => {
    if (selectedChains.length !== 1) return undefined;

    const chainId = selectedChains[0];

    return (typeof chainId === 'number' ? allEvmChains : allTezosChains)[chainId];
  }, [selectedChains, allEvmChains, allTezosChains]);

  return (
    <PageLayout
      pageTitle={<T id="nfts" />}
      contentPadding={false}
      headerRightElem={
        <IconBase
          Icon={blur || showInfo || viewAsCollections ? FilterOnIcon : FilterOffIcon}
          className="text-primary cursor-pointer"
          onClick={openFiltersModal}
        />
      }
      headerChildren={
        <div className="flex flex-col p-4 gap-4 bg-background">
          <div className="flex gap-2 items-center">
            <SearchBarField
              value={searchValue}
              placeholder={t('search')}
              onValueChange={setSearchValue}
              testID={NftsPageSelectors.searchField}
            />

            <IconButton Icon={manageActive ? CloseIcon : ManageIcon} color="blue" onClick={toggleManageActive} />
          </div>

          {!manageActive && !chainIsGloballySelected && <NetworkChips enabledCollectibles={enabledCollectibles} />}
        </div>
      }
    >
      <FadeTransition trigger={manageActive}>
        {viewAsCollections && !manageActive ? (
          <CollectionsListView
            noCollectiblesAtAll={noCollectiblesAtAll}
            collections={searchedSlugsByCollections}
            isSyncing={isSyncing}
            isInSearchMode={isInSearchMode}
            network={network}
            tezDetailsReady={tezDetailsReady}
          />
        ) : (
          <NftsListView
            noCollectiblesAtAll={noCollectiblesAtAll}
            isSyncing={isSyncing}
            isInSearchMode={isInSearchMode}
            network={network}
            chainSlugs={paginatedSlugs}
            loadNextPage={loadNext}
            renderItem={renderItem}
          />
        )}
      </FadeTransition>

      <MiniPageModal opened={filtersModalOpen} onRequestClose={closeFiltersModal} title={t('filters')}>
        <SettingsCellGroup className="m-4 mb-8">
          <SettingsCellSingle Component="div" cellName={t('blurSensitiveContent')} isLast={false}>
            <ToggleSwitch
              checked={blur}
              onChange={setBlurEnabled}
              testID={NftsPageSelectors.blurSensitiveContentToggle}
            />
          </SettingsCellSingle>

          <SettingsCellSingle Component="div" cellName={t('showDetails')} isLast={false}>
            <ToggleSwitch
              checked={showInfo}
              disabled={viewAsCollections}
              onChange={setShowInfoEnabled}
              testID={NftsPageSelectors.showDetailsToggle}
            />
          </SettingsCellSingle>

          <SettingsCellSingle Component="div" cellName={t('viewAsCollections')}>
            <ToggleSwitch
              checked={viewAsCollections}
              onChange={setViewAsCollectionsEnabled}
              testID={NftsPageSelectors.viewAsCollectionsToggle}
            />
          </SettingsCellSingle>
        </SettingsCellGroup>
      </MiniPageModal>
    </PageLayout>
  );
});
