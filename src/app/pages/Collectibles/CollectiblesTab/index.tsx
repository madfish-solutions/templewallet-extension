import React, { FC, memo, useCallback, useMemo } from 'react';

import { emptyFn } from '@rnw-community/shared';
import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import Checkbox from 'app/atoms/Checkbox';
import Divider from 'app/atoms/Divider';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { IconButton } from 'app/atoms/IconButton';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useCollectiblesListingLogic, useEvmCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { ReactComponent as FiltersIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as EditingIcon } from 'app/icons/editing.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import {
  LOCAL_STORAGE_ADULT_BLUR_TOGGLE_KEY,
  LOCAL_STORAGE_SHOW_INFO_TOGGLE_KEY
} from 'app/pages/Collectibles/constants';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { ChainsDropdown } from 'app/templates/ChainSelect';
import { ChainSelectController } from 'app/templates/ChainSelect/controller';
import { ButtonForManageDropdown } from 'app/templates/ManageDropdown';
import { SearchBarField } from 'app/templates/SearchField';
import { setTestID } from 'lib/analytics';
import { useEnabledAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { useEnabledEvmChainAccountCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { AssetTypesEnum } from 'lib/assets/types';
import { useEvmCollectiblesSortPredicate, useTezosCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { T, t } from 'lib/i18n';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useLocalStorage } from 'lib/ui/local-storage';
import Popper, { PopperChildren, PopperPopup, PopperRenderProps } from 'lib/ui/Popper';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';
import { Link } from 'lib/woozie';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { EvmNetworkEssentials, TezosNetworkEssentials } from 'temple/networks';

import { EvmCollectibleItem, TezosCollectibleItem } from './CollectibleItem';
import { CollectibleTabSelectors } from './selectors';

interface CollectiblesTabProps {
  chainSelectController: ChainSelectController;
}

export const CollectiblesTab = memo<CollectiblesTabProps>(({ chainSelectController }) => {
  const network = chainSelectController.value;

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  if (network.kind === 'tezos' && accountTezAddress)
    return (
      <TezosCollectiblesTab
        network={network}
        publicKeyHash={accountTezAddress}
        chainSelectController={chainSelectController}
      />
    );

  if (network.kind === 'evm' && accountEvmAddress)
    return (
      <EvmCollectiblesTab
        network={network}
        publicKeyHash={accountEvmAddress}
        chainSelectController={chainSelectController}
      />
    );

  return (
    <ContentContainer className="mt-3">
      <div className="text-center py-3">{UNDER_DEVELOPMENT_MSG}</div>
    </ContentContainer>
  );
});

interface EvmCollectiblesTabProps {
  network: EvmNetworkEssentials;
  publicKeyHash: HexString;
  chainSelectController: ChainSelectController;
}

const EvmCollectiblesTab = memo<EvmCollectiblesTabProps>(({ network, publicKeyHash, chainSelectController }) => {
  const { chainId: evmChainId } = network;

  const allSlugs = useEnabledEvmChainAccountCollectiblesSlugs(publicKeyHash, evmChainId);

  const assetsSortPredicate = useEvmCollectiblesSortPredicate(publicKeyHash, evmChainId);

  const allSlugsSorted = useMemoWithCompare(
    () => [...allSlugs].sort(assetsSortPredicate),
    [allSlugs, assetsSortPredicate],
    isEqual
  );

  const { paginatedSlugs, isSyncing, loadNext } = useEvmCollectiblesListingLogic(allSlugsSorted);

  const shouldScrollToTheBar = paginatedSlugs.length > 0;

  const stickyBarRef = useScrollIntoView<HTMLDivElement>(shouldScrollToTheBar, { behavior: 'smooth' });

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-2">
        {paginatedSlugs.map(slug => (
          <EvmCollectibleItem key={slug} assetSlug={slug} evmChainId={evmChainId} accountPkh={publicKeyHash} />
        ))}
      </div>
    ),
    [paginatedSlugs, evmChainId, publicKeyHash]
  );

  const renderManageDropdown = useCallback<PopperPopup>(
    props => (
      <ManageButtonDropdown
        {...props}
        areDetailsShown={false}
        adultBlur={false}
        toggleDetailsShown={emptyFn}
        toggleAdultBlur={emptyFn}
      />
    ),
    []
  );

  const renderManageButton = useCallback<PopperChildren>(
    ({ ref, opened, toggleOpened }) => (
      <ButtonForManageDropdown
        ref={ref}
        opened={opened}
        tooltip={t('manageAssetsList')}
        onClick={toggleOpened}
        testID={AssetsSelectors.manageButton}
        testIDProperties={{ listOf: 'Collectibles' }}
      />
    ),
    []
  );

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField value="" onValueChange={emptyFn} testID={AssetsSelectors.searchAssetsInputCollectibles} />

        <Popper
          placement="bottom-end"
          strategy="fixed"
          popup={props => <ChainsDropdown controller={chainSelectController} {...props} />}
        >
          {({ ref, opened, toggleOpened }) => (
            <IconButton Icon={FiltersIcon} ref={ref} active={opened} onClick={toggleOpened} />
          )}
        </Popper>

        <Popper placement="bottom-end" strategy="fixed" popup={renderManageDropdown}>
          {renderManageButton}
        </Popper>
      </StickyBar>

      <ContentContainer>
        {paginatedSlugs.length === 0 ? (
          buildEmptySection(isSyncing)
        ) : (
          <>
            <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>

            <ScrollBackUpButton />

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </ContentContainer>
    </>
  );
});

interface TezosCollectiblesTabProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  chainSelectController: ChainSelectController;
}

const TezosCollectiblesTab = memo<TezosCollectiblesTabProps>(({ network, publicKeyHash, chainSelectController }) => {
  const { chainId: tezosChainId } = network;

  const [areDetailsShown, setDetailsShown] = useLocalStorage(LOCAL_STORAGE_SHOW_INFO_TOGGLE_KEY, false);
  const toggleDetailsShown = useCallback(() => void setDetailsShown(val => !val), [setDetailsShown]);

  const [adultBlur, setAdultBlur] = useLocalStorage(LOCAL_STORAGE_ADULT_BLUR_TOGGLE_KEY, true);
  const toggleAdultBlur = useCallback(() => void setAdultBlur(val => !val), [setAdultBlur]);

  const allSlugs = useEnabledAccountCollectiblesSlugs(publicKeyHash, tezosChainId);

  const assetsSortPredicate = useTezosCollectiblesSortPredicate(publicKeyHash, tezosChainId);

  const allSlugsSorted = useMemoWithCompare(
    () => [...allSlugs].sort(assetsSortPredicate),
    [allSlugs, assetsSortPredicate],
    isEqual
  );

  const { isInSearchMode, displayedSlugs, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useCollectiblesListingLogic(network, allSlugsSorted);

  const shouldScrollToTheBar = paginatedSlugs.length > 0;

  const stickyBarRef = useScrollIntoView<HTMLDivElement>(shouldScrollToTheBar, { behavior: 'smooth' });

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-2">
        {displayedSlugs.map(slug => (
          <TezosCollectibleItem
            key={slug}
            assetSlug={slug}
            accountPkh={publicKeyHash}
            tezosChainId={tezosChainId}
            adultBlur={adultBlur}
            areDetailsShown={areDetailsShown}
            hideWithoutMeta={isInSearchMode}
          />
        ))}
      </div>
    ),
    [displayedSlugs, publicKeyHash, tezosChainId, adultBlur, areDetailsShown, isInSearchMode]
  );

  const renderManageDropdown = useCallback<PopperPopup>(
    props => (
      <ManageButtonDropdown
        {...props}
        areDetailsShown={areDetailsShown}
        adultBlur={adultBlur}
        toggleDetailsShown={toggleDetailsShown}
        toggleAdultBlur={toggleAdultBlur}
      />
    ),
    [areDetailsShown, adultBlur, toggleDetailsShown, toggleAdultBlur]
  );

  const renderManageButton = useCallback<PopperChildren>(
    ({ ref, opened, toggleOpened }) => (
      <ButtonForManageDropdown
        ref={ref}
        opened={opened}
        tooltip={t('manageAssetsList')}
        onClick={toggleOpened}
        testID={AssetsSelectors.manageButton}
        testIDProperties={{ listOf: 'Collectibles' }}
      />
    ),
    []
  );

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          value={searchValue}
          onValueChange={setSearchValue}
          testID={AssetsSelectors.searchAssetsInputCollectibles}
        />

        <Popper
          placement="bottom-end"
          strategy="fixed"
          popup={props => <ChainsDropdown controller={chainSelectController} {...props} />}
        >
          {({ ref, opened, toggleOpened }) => (
            <IconButton Icon={FiltersIcon} ref={ref} active={opened} onClick={toggleOpened} />
          )}
        </Popper>

        <Popper placement="bottom-end" strategy="fixed" popup={renderManageDropdown}>
          {renderManageButton}
        </Popper>
      </StickyBar>

      <ContentContainer>
        {displayedSlugs.length === 0 ? (
          buildEmptySection(isSyncing)
        ) : (
          <>
            {isInSearchMode ? (
              contentElement
            ) : (
              <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
            )}

            <ScrollBackUpButton />

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </ContentContainer>
    </>
  );
});

const buildEmptySection = (isSyncing: boolean) =>
  isSyncing ? (
    <SyncSpinner className="mt-6" />
  ) : (
    <div className="border rounded border-gray-200">
      <p className={'text-gray-600 text-center text-xs py-6'} {...setTestID(CollectibleTabSelectors.emptyStateText)}>
        <T id="zeroCollectibleText" />
      </p>
    </div>
  );

interface ManageButtonDropdownProps extends PopperRenderProps {
  areDetailsShown: boolean;
  adultBlur: boolean;
  toggleDetailsShown: EmptyFn;
  toggleAdultBlur: EmptyFn;
}

const ManageButtonDropdown: FC<ManageButtonDropdownProps> = ({
  opened,
  areDetailsShown,
  adultBlur,
  toggleDetailsShown,
  toggleAdultBlur
}) => {
  const buttonClassName = 'flex items-center px-3 py-2.5 rounded hover:bg-gray-200 cursor-pointer';

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right mt-1 p-2 flex flex-col min-w-40"
      style={{ border: 'unset', marginTop: '0.25rem' }}
    >
      <Link
        to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
        className={buttonClassName}
        testID={AssetsSelectors.dropdownManageButton}
        testIDProperties={{ listOf: 'Collectibles' }}
      >
        <EditingIcon className="w-4 h-4 stroke-current fill-current text-gray-600" />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="manage" />
        </span>
      </Link>

      <Divider className="my-2" />

      <label className={buttonClassName}>
        <Checkbox
          overrideClassNames="h-4 w-4 rounded"
          checked={areDetailsShown}
          onChange={toggleDetailsShown}
          testID={AssetsSelectors.dropdownShowInfoCheckbox}
        />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="showDetails" />
        </span>
      </label>

      <Divider className="my-2" />

      <label className={buttonClassName}>
        <Checkbox
          overrideClassNames="h-4 w-4 rounded"
          checked={adultBlur}
          onChange={toggleAdultBlur}
          testID={AssetsSelectors.dropdownBlurCheckbox}
        />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="blurSensitiveContent" />
        </span>
      </label>
    </DropdownWrapper>
  );
};
