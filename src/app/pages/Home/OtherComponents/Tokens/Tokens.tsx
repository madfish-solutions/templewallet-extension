import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { Checkbox, Divider, SyncSpinner } from 'app/atoms';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useEvmTokensListingLogic, useTezosTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as FiltersIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { ReactComponent as EditingIcon } from 'app/icons/editing.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { ChainsDropdown } from 'app/templates/ChainSelect';
import { ChainSelectController } from 'app/templates/ChainSelect/controller';
import { ButtonForManageDropdown } from 'app/templates/ManageDropdown';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { setTestID } from 'lib/analytics';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { TEMPLE_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokensSlugs } from 'lib/assets/hooks';
import { T, t } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { Link, navigate } from 'lib/woozie';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { EvmChain, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { HomeSelectors } from '../../selectors';
import { AssetsSelectors } from '../Assets.selectors';

import { EvmListItem, TezosListItem } from './components/ListItem';
import { UpdateAppBanner } from './components/UpdateAppBanner';
import { toExploreAssetLink } from './utils';

const LOCAL_STORAGE_TOGGLE_KEY = 'tokens-list:hide-zero-balances';
const svgIconClassName = 'w-4 h-4 stroke-current fill-current text-gray-600';

interface TokensTabProps {
  chainSelectController: ChainSelectController;
}

export const TokensTab = memo<TokensTabProps>(({ chainSelectController }) => {
  const network = chainSelectController.value;

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  if (network.kind === 'tezos' && accountTezAddress)
    return (
      <TezosTokensTab
        network={network}
        publicKeyHash={accountTezAddress}
        chainSelectController={chainSelectController}
      />
    );

  if (network.kind === 'evm' && accountEvmAddress)
    return (
      <EvmTokensTab network={network} publicKeyHash={accountEvmAddress} chainSelectController={chainSelectController} />
    );

  return (
    <ContentContainer className="mt-3">
      <div className="text-center py-3">{UNDER_DEVELOPMENT_MSG}</div>
    </ContentContainer>
  );
});

interface EvmTokensTabProps {
  network: EvmChain;
  publicKeyHash: HexString;
  chainSelectController: ChainSelectController;
}

const EvmTokensTab: FC<EvmTokensTabProps> = ({ network, publicKeyHash, chainSelectController }) => {
  const [isZeroBalancesHidden, setIsZeroBalancesHidden] = useLocalStorage(LOCAL_STORAGE_TOGGLE_KEY, false);

  const toggleHideZeroBalances = useCallback(
    () => void setIsZeroBalancesHidden(val => !val),
    [setIsZeroBalancesHidden]
  );

  const { paginatedSlugs, isSyncing, loadNext } = useEvmTokensListingLogic(publicKeyHash, network.chainId);

  const contentElement = useMemo(
    () =>
      paginatedSlugs.map(slug => (
        <EvmListItem key={slug} assetSlug={slug} publicKeyHash={publicKeyHash} network={network} />
      )),
    [paginatedSlugs]
  );

  const stickyBarRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          value="Not working yet"
          onValueChange={emptyFn}
          testID={AssetsSelectors.searchAssetsInputTokens}
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

        <Popper
          placement="bottom-end"
          strategy="fixed"
          popup={props => (
            <ManageButtonDropdown
              {...props}
              isZeroBalancesHidden={isZeroBalancesHidden}
              toggleHideZeroBalances={toggleHideZeroBalances}
            />
          )}
        >
          {({ ref, opened, toggleOpened }) => (
            <ButtonForManageDropdown
              ref={ref}
              opened={opened}
              tooltip={t('manageAssetsList')}
              onClick={toggleOpened}
              testID={AssetsSelectors.manageButton}
              testIDProperties={{ listOf: 'Tokens' }}
            />
          )}
        </Popper>
      </StickyBar>

      <ContentContainer>
        {paginatedSlugs.length === 0 ? (
          buildEmptySection(isSyncing)
        ) : (
          <>
            <AssetsFilterOptions />
            {/*<SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>*/}
            {isSyncing && <SyncSpinner className="mt-4" />}
          </>
        )}
      </ContentContainer>
    </>
  );
};

interface TezosTokensTabProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  chainSelectController: ChainSelectController;
}

const TezosTokensTab: FC<TezosTokensTabProps> = ({ network, publicKeyHash, chainSelectController }) => {
  const chainId = network.chainId;

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

  const slugs = useEnabledAccountTokensSlugs(publicKeyHash, chainId);

  const [isZeroBalancesHidden, setIsZeroBalancesHidden] = useLocalStorage(LOCAL_STORAGE_TOGGLE_KEY, false);

  const toggleHideZeroBalances = useCallback(
    () => void setIsZeroBalancesHidden(val => !val),
    [setIsZeroBalancesHidden]
  );

  const leadingAssets = useMemo(
    () => (chainId === TEZOS_MAINNET_CHAIN_ID ? [TEZ_TOKEN_SLUG, TEMPLE_TOKEN_SLUG] : [TEZ_TOKEN_SLUG]),
    [chainId]
  );

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { filteredAssets, searchValue, setSearchValue } = useTezosTokensListingLogic(
    chainId,
    publicKeyHash,
    slugs,
    isZeroBalancesHidden,
    leadingAssets
  );

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

  const activeAssetSlug = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  const tokensView = useMemo<JSX.Element[]>(() => {
    const tokensJsx = filteredAssets.map(assetSlug => (
      <TezosListItem
        network={network}
        key={assetSlug}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        active={activeAssetSlug ? assetSlug === activeAssetSlug : false}
      />
    ));

    const promoJsx = (
      <PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionVariant.Text}
        pageName="Token page"
      />
    );

    if (filteredAssets.length < 5) {
      tokensJsx.push(promoJsx);
    } else {
      tokensJsx.splice(1, 0, promoJsx);
    }

    return tokensJsx;
  }, [network, filteredAssets, activeAssetSlug, publicKeyHash, mainnetTokensScamSlugsRecord]);

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  const handleSearchFieldFocus = useCallback(() => void setSearchFocused(true), [setSearchFocused]);
  const handleSearchFieldBlur = useCallback(() => void setSearchFocused(false), [setSearchFocused]);

  useEffect(() => {
    if (!activeAssetSlug) return;

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Enter':
          navigate(toExploreAssetLink(TempleChainKind.Tezos, chainId, activeAssetSlug));
          break;

        case 'ArrowDown':
          setActiveIndex(i => i + 1);
          break;

        case 'ArrowUp':
          setActiveIndex(i => (i > 0 ? i - 1 : 0));
          break;
      }
    };

    window.addEventListener('keyup', handleKeyup);
    return () => window.removeEventListener('keyup', handleKeyup);
  }, [activeAssetSlug, chainId, setActiveIndex]);

  const stickyBarRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
          testID={AssetsSelectors.searchAssetsInputTokens}
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

        <Popper
          placement="bottom-end"
          strategy="fixed"
          popup={props => (
            <ManageButtonDropdown
              {...props}
              isZeroBalancesHidden={isZeroBalancesHidden}
              toggleHideZeroBalances={toggleHideZeroBalances}
            />
          )}
        >
          {({ ref, opened, toggleOpened }) => (
            <ButtonForManageDropdown
              ref={ref}
              opened={opened}
              tooltip={t('manageAssetsList')}
              onClick={toggleOpened}
              testID={AssetsSelectors.manageButton}
              testIDProperties={{ listOf: 'Tokens' }}
            />
          )}
        </Popper>
      </StickyBar>

      <ContentContainer>
        <UpdateAppBanner stickyBarRef={stickyBarRef} />

        {filteredAssets.length === 0 ? (
          buildEmptySection(isSyncing, searchValueExist)
        ) : (
          <>
            <>{tokensView}</>
            {isSyncing && <SyncSpinner className="mt-4" />}
          </>
        )}
      </ContentContainer>
    </>
  );
};

interface ManageButtonDropdownProps extends PopperRenderProps {
  isZeroBalancesHidden: boolean;
  toggleHideZeroBalances: EmptyFn;
}

const ManageButtonDropdown: FC<ManageButtonDropdownProps> = ({
  opened,
  isZeroBalancesHidden,
  toggleHideZeroBalances
}) => {
  const buttonClassName = 'flex items-center px-3 py-2.5 rounded hover:bg-gray-200 cursor-pointer';

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right mt-1 p-2 flex flex-col min-w-40"
      style={{ border: 'unset', marginTop: '0.25rem' }}
    >
      <Link
        to={`/manage-assets`}
        className={buttonClassName}
        testID={AssetsSelectors.dropdownManageButton}
        testIDProperties={{ listOf: 'Tokens' }}
      >
        <EditingIcon className={svgIconClassName} />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="manage" />
        </span>
      </Link>

      <Divider className="my-2" />

      <label className={buttonClassName}>
        <Checkbox
          overrideClassNames="h-4 w-4 rounded"
          checked={isZeroBalancesHidden}
          onChange={toggleHideZeroBalances}
          testID={AssetsSelectors.dropdownHideZeroBalancesCheckbox}
        />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="hideZeroBalance" />
        </span>
      </label>
    </DropdownWrapper>
  );
};

const buildEmptySection = (isSyncing: boolean, searchValueExist?: boolean) =>
  isSyncing ? (
    <SyncSpinner className="mt-6" />
  ) : (
    <div className="my-8 flex flex-col items-center justify-center text-gray-500">
      <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
        {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current fill-current" />}

        <span {...setTestID(HomeSelectors.emptyStateText)}>
          <T id="noAssetsFound" />
        </span>
      </p>

      <p className="text-center text-xs font-light">
        <T
          id="ifYouDontSeeYourAsset"
          substitutions={[
            <b>
              <T id="manage" />
            </b>
          ]}
        />
      </p>
    </div>
  );
