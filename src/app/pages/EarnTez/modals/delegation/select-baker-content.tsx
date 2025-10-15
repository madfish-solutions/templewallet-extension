import React, { ReactNode, memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Alert } from 'app/atoms';
import { ActionListItem } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { EmptyState } from 'app/atoms/EmptyState';
import { IconButton } from 'app/atoms/IconButton';
import { PageLoader } from 'app/atoms/Loader';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReactComponent as FilteroffIcon } from 'app/icons/base/filteroff.svg';
import { SearchBarField } from 'app/templates/SearchField';
import { T, t } from 'lib/i18n';
import { HELP_UKRAINE_BAKER_ADDRESS, EVERSTAKE_BAKER_ADDRESS, TEMPLE_BAKER_ADDRESS } from 'lib/known-bakers';
import { useTypedSWR } from 'lib/swr';
import { Baker, useKnownBakers } from 'lib/temple/front';
import { isValidTezosImplicitAddress } from 'lib/tezos';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { AccountForTezos } from 'temple/accounts';
import {
  getTezosDomainsClient,
  getTezosToolkitWithSigner,
  isTezosDomainsNameValid,
  useTezosAddressByDomainName
} from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';

import { BakerCard } from '../../components/baker-card';
import { getBakerAddress } from '../../utils';

import { getRawDelegationEstimate, isRpcUnregisteredDelegateError } from './estimate-delegation';
import { DelegationModalSelectors } from './selectors';

interface SelectBakerContentProps {
  account: AccountForTezos;
  bakerPkh?: string;
  network: TezosNetworkEssentials;
  onSelect: SyncFn<string | Baker>;
}

enum BakersSortField {
  Delegated = 'delegated',
  Space = 'space',
  Fee = 'fee',
  MinBalance = 'minBalance'
}

const sponsoredBakersAddresses = [TEMPLE_BAKER_ADDRESS, EVERSTAKE_BAKER_ADDRESS, HELP_UKRAINE_BAKER_ADDRESS];

export const SelectBakerContent = memo<SelectBakerContentProps>(({ account, bakerPkh, network, onSelect }) => {
  const accountPkh = account.address;
  const knownBakers = useKnownBakers(network.chainId, true);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue] = useDebounce(searchValue, 300);
  const [sortField, setSortField] = useState(BakersSortField.Delegated);
  const [topEdgeVisible, setTopEdgeVisible] = useState(true);
  const searchValueIsImplicitAddress = useMemo(() => isValidTezosImplicitAddress(searchValue), [searchValue]);

  const { data: tezAddressFromTzDomainName, isValidating: domainIsValidating } = useTezosAddressByDomainName(
    debouncedSearchValue,
    network
  );
  const searchValueIsDomainName = useMemo(
    () => isTezosDomainsNameValid(debouncedSearchValue, getTezosDomainsClient(network)),
    [debouncedSearchValue, network]
  );
  const isResolvingDomain = domainIsValidating && searchValueIsDomainName;

  const internalSearchValue = tezAddressFromTzDomainName || searchValue;
  const resolvedAddress = searchValueIsImplicitAddress ? searchValue : tezAddressFromTzDomainName;
  const internalSearchValueIsImplicitAddress = useMemo(
    () => isValidTezosImplicitAddress(internalSearchValue),
    [internalSearchValue]
  );

  const cleanSearchValue = useCallback(() => setSearchValue(''), []);

  const sortedKnownBakers = useMemo(
    () =>
      searchAndFilterItems(knownBakers || [], internalSearchValue, [
        { name: 'name', weight: 1 },
        { name: 'address', weight: 0.1 }
      ])
        .toSorted(({ delegation: a, address: aAddress }, { delegation: b, address: bAddress }) => {
          const aSponsoredIndex = sponsoredBakersAddresses.indexOf(aAddress);
          const bSponsoredIndex = sponsoredBakersAddresses.indexOf(bAddress);

          const aIsSponsored = aSponsoredIndex !== -1;
          const bIsSponsored = bSponsoredIndex !== -1;

          if (aIsSponsored && bIsSponsored) {
            return aSponsoredIndex - bSponsoredIndex;
          }

          if (aIsSponsored) return -1;
          if (bIsSponsored) return 1;

          switch (sortField) {
            case BakersSortField.Delegated:
              return b.capacity - b.freeSpace - (a.capacity - a.freeSpace);
            case BakersSortField.Space:
              return b.freeSpace - a.freeSpace;
            case BakersSortField.Fee:
              return a.fee - b.fee;
            default:
              return a.minBalance - b.minBalance;
          }
        })
        .filter(({ address }) => address !== bakerPkh),
    [knownBakers, sortField, internalSearchValue, bakerPkh]
  );

  const getIsBaker = useCallback(async () => {
    if (!resolvedAddress) {
      return false;
    }

    try {
      const tezos = getTezosToolkitWithSigner(network, account.address);
      await getRawDelegationEstimate(account, tezos, resolvedAddress);

      return true;
    } catch (e) {
      return !isRpcUnregisteredDelegateError(e);
    }
  }, [account, network.rpcBaseURL, resolvedAddress]);
  const shouldLoadUnknownBaker = resolvedAddress && resolvedAddress !== bakerPkh && sortedKnownBakers.length === 0;
  const { data: isUnknownBaker, error: getUnknownBakerError } = useTypedSWR(
    shouldLoadUnknownBaker ? ['unknown-baker', resolvedAddress, network.chainId] : null,
    getIsBaker
  );
  const unknownBakerIsLoading = isUnknownBaker === undefined && !getUnknownBakerError && shouldLoadUnknownBaker;
  const isLoading = unknownBakerIsLoading || isResolvingDomain;

  const sortedBakers = useMemo(
    () => (sortedKnownBakers.length > 0 ? sortedKnownBakers : isUnknownBaker ? [resolvedAddress!] : []),
    [isUnknownBaker, resolvedAddress, sortedKnownBakers]
  );

  return (
    <FadeTransition>
      <div className={clsx('flex px-4 pt-4 pb-3 gap-x-2', !topEdgeVisible && 'shadow-bottom')}>
        <SearchBarField
          placeholder={t('bakerSearchPlaceholder')}
          value={searchValue}
          onValueChange={setSearchValue}
          onCleanButtonClick={cleanSearchValue}
          testID={DelegationModalSelectors.searchInput}
        />

        <SortByPopper selectedOption={sortField} onSelect={setSortField} />
      </div>
      {sortedBakers.length > 0 && (
        <ScrollView className="pt-1 px-4 pb-15" topEdgeThreshold={4} onTopEdgeVisibilityChange={setTopEdgeVisible}>
          <div className="flex flex-col gap-3">
            {sortedKnownBakers.length === 0 && (
              <Alert type="warning" description={<T id="unknownBakerDescription" />} closable={false} />
            )}
            {sortedBakers.map(baker => (
              <KnownBakerCard
                key={getBakerAddress(baker)}
                network={network}
                accountPkh={accountPkh}
                baker={baker}
                onSelect={onSelect}
              />
            ))}
          </div>
        </ScrollView>
      )}
      {sortedBakers.length === 0 && isLoading && <PageLoader stretch text={t('bakerIsLoading')} />}
      {sortedBakers.length === 0 && !isLoading && (
        <div className="py-1 px-4 flex flex-col flex-grow">
          {internalSearchValueIsImplicitAddress ? null : (
            <Alert className="mb-10" type="info" description={<T id="customBakerNotFoundAlert" />} closable={false} />
          )}
          <div className="flex-1 flex justify-center items-center">
            <EmptyState forSearch />
          </div>
        </div>
      )}
    </FadeTransition>
  );
});

interface KnownBakerCardProps {
  baker: string | Baker;
  accountPkh: string;
  network: TezosNetworkEssentials;
  onSelect: SyncFn<string | Baker>;
}

const KnownBakerCard = memo<KnownBakerCardProps>(({ baker, accountPkh, network, onSelect }) => {
  const bakerAddress = getBakerAddress(baker);

  const HeaderRight = useCallback(
    () =>
      sponsoredBakersAddresses.includes(bakerAddress) ? (
        <div className="p-1 rounded text-font-small-bold align-middle text-white bg-success">
          <T id="recommended" />
        </div>
      ) : null,
    [bakerAddress]
  );

  return (
    <BakerCard network={network} accountPkh={accountPkh} baker={baker} HeaderRight={HeaderRight} onClick={onSelect} />
  );
});

interface SortByPopperProps {
  selectedOption: BakersSortField;
  onSelect: SyncFn<BakersSortField>;
}

const SortByPopper = memo<SortByPopperProps>(({ selectedOption, onSelect }) => {
  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={popperProps => <SortByContent selectedOption={selectedOption} onSelect={onSelect} {...popperProps} />}
    >
      {({ ref, opened, toggleOpened }) => (
        <IconButton Icon={FilteroffIcon} color="blue" active={opened} ref={ref} onClick={toggleOpened} />
      )}
    </Popper>
  );
});

interface SortByPopperContentProps extends Omit<SortByPopperProps, 'triggerRef'>, PopperRenderProps {}

const options = [
  { value: BakersSortField.Delegated, testID: DelegationModalSelectors.sortByDelegated, name: <T id="delegated" /> },
  { value: BakersSortField.Space, testID: DelegationModalSelectors.sortBySpace, name: <T id="space" /> },
  { value: BakersSortField.Fee, testID: DelegationModalSelectors.sortByFee, name: <T id="fee" /> },
  { value: BakersSortField.MinBalance, testID: DelegationModalSelectors.sortByMinAmount, name: <T id="minBalance" /> }
];

const SortByContent = memo<SortByPopperContentProps>(({ selectedOption, onSelect, opened, setOpened }) => {
  return (
    <ActionsDropdownPopup style={{ width: '9.625rem', height: '12.25rem' }} title={<T id="sortBy" />} opened={opened}>
      {options.map(({ value, name, testID }) => (
        <SortByOption
          key={value}
          value={value}
          name={name}
          selected={selectedOption === value}
          onSelect={onSelect}
          setOpened={setOpened}
          testID={testID}
        />
      ))}
    </ActionsDropdownPopup>
  );
});

interface SortByOptionProps {
  value: BakersSortField;
  name: ReactNode;
  selected: boolean;
  onSelect: SyncFn<BakersSortField>;
  setOpened: SyncFn<boolean>;
  testID: string;
}

const SortByOption = memo<SortByOptionProps>(({ value, name, selected, onSelect, setOpened, testID }) => {
  const handleClick = useCallback(() => onSelect(value), [onSelect, value]);

  return (
    <ActionListItem
      className="px-2 py-2.5"
      onClick={handleClick}
      setOpened={setOpened}
      testID={testID}
      active={selected}
    >
      {name}
    </ActionListItem>
  );
});
