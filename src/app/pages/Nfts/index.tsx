import { FC } from 'react';

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
import { useEvmCollectiblesMetadataLoading } from 'app/hooks/use-evm-collectibles-meta-loading';
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
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import {
  OneOfChains,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllEvmChains,
  useAllTezosChains
} from 'temple/front';

import { CollectionsListView } from './components/collections-list-view';
import { useCollectiblesListingLogic } from './hooks/use-collectibles-listing-logic';
import { NetworkChips } from './network-chips';
import { NftsList } from './nfts-list';
import { NftsPageSelectors } from './selectors';

export const NftsPage = () => {
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
};

const MultiChainNftsPage: FC<{ accountTezAddress: string; accountEvmAddress: HexString }> = ({
  accountTezAddress,
  accountEvmAddress
}) => {
  const tezCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectibles = useEvmAccountCollectibles(accountEvmAddress);
  const sortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);

  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return <NftsPageContent allCollectibles={tezCollectibles.concat(evmCollectibles)} sortPredicate={sortPredicate} />;
};

const TezosNftsPage: FC<{ accountTezAddress: string }> = ({ accountTezAddress }) => (
  <NftsPageContent
    allCollectibles={useTezosAccountCollectibles(accountTezAddress)}
    sortPredicate={useTezosAccountCollectiblesSortPredicate(accountTezAddress)}
  />
);

const EvmNftsPage: FC<{ accountEvmAddress: HexString }> = ({ accountEvmAddress }) => {
  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return (
    <NftsPageContent
      allCollectibles={useEvmAccountCollectibles(accountEvmAddress)}
      sortPredicate={useEvmAccountCollectiblesSortPredicate(accountEvmAddress)}
    />
  );
};

interface NftsPageContentProps {
  allCollectibles: AccountCollectible[];
  sortPredicate: (aChainAssetSlug: string, bChainAssetSlug: string) => number;
}

const NftsPageContent: FC<NftsPageContentProps> = ({ allCollectibles, sortPredicate }) => {
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

  const [filtersModalOpen, openFiltersModal, closeFiltersModal] = useBooleanState(false);

  const setBlurEnabled = (value: boolean) => dispatch(setCollectiblesBlurFilterOption(value));
  const setShowInfoEnabled = (value: boolean) => dispatch(setCollectiblesShowInfoFilterOption(value));
  const setViewAsCollectionsEnabled = (value: boolean) => dispatch(setCollectiblesViewAsCollectionsFilterOption(value));

  let network: OneOfChains | undefined;
  if (selectedChains.length === 1) {
    const [chainId] = selectedChains;
    network = (typeof chainId === 'number' ? allEvmChains : allTezosChains)[chainId];
  }

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
          <NftsList
            noCollectiblesAtAll={noCollectiblesAtAll}
            isSyncing={isSyncing}
            isInSearchMode={isInSearchMode}
            network={network}
            paginatedSlugs={paginatedSlugs}
            loadNext={loadNext}
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
};
