import React, { memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { CopyAddress } from 'app/atoms/copy-address';
import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { RadioButton } from 'app/atoms/RadioButton';
import { SpinnerSection } from 'app/pages/Send/form/SpinnerSection';
import {
  AccountsGroup as GenericAccountsGroup,
  AccountsGroupProps as GenericAccountsGroupProps
} from 'app/templates/AccountsGroup';
import { SearchBarField } from 'app/templates/SearchField';
import { getKoloCryptoAddress } from 'lib/apis/temple';
import { T } from 'lib/i18n';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID, TempleContact } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { OneOfChains, searchAndFilterAccounts, useAccountsGroups, useVisibleAccounts } from 'temple/front';
import { useCurrentAccountId, useSettings } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

// TEMP
const KOLO_TEST_EMAIL = 'example@gmail.com';

interface Props {
  opened: boolean;
  network: OneOfChains;
  selectedAccountAddress: string;
  onRequestClose: EmptyFn;
  onAccountSelect: SyncFn<string>;
  evm?: boolean;
}

export const SelectAccountModal = memo<Props>(
  ({ opened, network, selectedAccountAddress, onRequestClose, onAccountSelect, evm = false }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const { contacts } = useSettings();

    const allStoredAccounts = useVisibleAccounts();
    const currentStoredAccountId = useCurrentAccountId();

    const [koloCardAddress, setKoloCardAddress] = useState<string>();
    const koloPayway = useMemo(() => getKoloPayway(network), [network]);

    const suitableAccounts = useMemo(
      () =>
        allStoredAccounts.filter(acc => {
          if (acc.id === currentStoredAccountId) return false;

          if (evm) return Boolean(getAccountAddressForEvm(acc));
          return Boolean(getAccountAddressForTezos(acc));
        }),
      [allStoredAccounts, currentStoredAccountId, evm]
    );

    const filteredAccounts = useMemo(
      () =>
        searchValueDebounced.length
          ? searchAndFilterAccounts(suitableAccounts, searchValueDebounced)
          : suitableAccounts,
      [suitableAccounts, searchValueDebounced]
    );
    const filteredGroups = useAccountsGroups(filteredAccounts);

    const suitableContacts = useMemo(
      () =>
        contacts
          ? contacts.filter(contact => (evm ? isEvmContact(contact.address) : !isEvmContact(contact.address)))
          : [],
      [contacts, evm]
    );

    const filteredContacts = useMemo(
      () =>
        searchValueDebounced.length && suitableContacts
          ? searchAndFilterContacts(suitableContacts, searchValueDebounced)
          : suitableContacts,
      [searchValueDebounced, suitableContacts]
    );

    const shouldShowKoloCard = useMemo(() => {
      if (!koloCardAddress) return false;
      if (!searchValueDebounced.length) return true;

      const preparedSearchValue = searchValueDebounced.trim().toLowerCase();

      return 'temple card'.includes(preparedSearchValue) || koloCardAddress.toLowerCase().includes(preparedSearchValue);
    }, [koloCardAddress, searchValueDebounced]);

    const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

    useEffect(() => {
      if (searchValue) setAttractSelectedAccount(false);
      else if (!opened) setAttractSelectedAccount(true);
    }, [opened, searchValue]);

    useEffect(() => {
      if (!opened) setSearchValue('');
    }, [opened]);

    useEffect(() => {
      console.log(opened, koloPayway);
      if (!opened || !koloPayway) {
        setKoloCardAddress(undefined);
        return;
      }

      let active = true;

      void (async () => {
        try {
          const response = await getKoloCryptoAddress({ payway: koloPayway, email: KOLO_TEST_EMAIL });
          console.log('getKoloCryptoAddress', response);

          if (active) setKoloCardAddress(response.address);
        } catch {
          if (active) setKoloCardAddress(undefined);
        }
      })();

      return () => {
        active = false;
      };
    }, [opened, koloPayway]);

    return (
      <PageModal title="Select Account" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col p-4">
          <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} />
        </div>

        <ScrollView>
          <Suspense fallback={<SpinnerSection />}>
            {filteredGroups.length || filteredContacts.length || shouldShowKoloCard ? (
              <>
                <TempleCardGroup
                  address={shouldShowKoloCard ? koloCardAddress : undefined}
                  selectedAccountAddress={selectedAccountAddress}
                  attractSelectedAccount={attractSelectedAccount}
                  onAccountSelect={onAccountSelect}
                />
                <>
                  {filteredGroups.map(group => (
                    <AccountsGroup
                      key={group.id}
                      title={group.name}
                      accounts={group.accounts}
                      selectedAccountAddress={selectedAccountAddress}
                      attractSelectedAccount={attractSelectedAccount}
                      onAccountSelect={onAccountSelect}
                      evm={evm}
                    />
                  ))}
                </>
                <AddressBookGroup
                  contacts={filteredContacts}
                  selectedAccountAddress={selectedAccountAddress}
                  attractSelectedAccount={attractSelectedAccount}
                  onAccountSelect={onAccountSelect}
                />
              </>
            ) : (
              <EmptyState />
            )}
          </Suspense>
        </ScrollView>
      </PageModal>
    );
  }
);

interface AccountsGroupProps extends Omit<GenericAccountsGroupProps, 'children'> {
  selectedAccountAddress: string;
  attractSelectedAccount: boolean;
  onAccountSelect: (address: string) => void;
  evm?: boolean;
}

const AccountsGroup = memo<AccountsGroupProps>(
  ({ title, accounts, selectedAccountAddress, attractSelectedAccount, onAccountSelect, evm = false }) => (
    <GenericAccountsGroup title={title} accounts={accounts}>
      {account => {
        const address = evm ? getAccountAddressForEvm(account) : getAccountAddressForTezos(account);

        return (
          <AccountOfGroup
            key={account.id}
            name={account.name}
            address={address!}
            iconHash={account.id}
            isCurrent={address === selectedAccountAddress}
            attractSelf={attractSelectedAccount}
            onSelect={onAccountSelect}
          />
        );
      }}
    </GenericAccountsGroup>
  )
);

interface AddressBookGroupProps {
  contacts: TempleContact[];
  selectedAccountAddress: string;
  attractSelectedAccount: boolean;
  onAccountSelect: (address: string) => void;
}

const AddressBookGroup = memo<AddressBookGroupProps>(
  ({ contacts, selectedAccountAddress, attractSelectedAccount, onAccountSelect }) => {
    if (!contacts.length) return null;

    return (
      <GenericAccountsGroup<TempleContact> title={<T id="addressBook" />} accounts={contacts}>
        {contact => (
          <AccountOfGroup
            key={contact.address}
            name={contact.name}
            address={contact.address}
            iconHash={contact.address}
            isCurrent={contact.address === selectedAccountAddress}
            attractSelf={attractSelectedAccount}
            onSelect={onAccountSelect}
          />
        )}
      </GenericAccountsGroup>
    );
  }
);

interface TempleCardGroupProps {
  address?: string;
  selectedAccountAddress: string;
  attractSelectedAccount: boolean;
  onAccountSelect: (address: string) => void;
}

const TempleCardGroup = memo<TempleCardGroupProps>(
  ({ address, selectedAccountAddress, attractSelectedAccount, onAccountSelect }) => {
    if (!address) return null;

    return (
      <GenericAccountsGroup title="Crypto card" accounts={[{ address }]}>
        {({ address: cardAddress }) => (
          <AccountOfGroup
            key={cardAddress}
            name="Temple Card"
            address={cardAddress}
            iconHash="temple-card"
            isCurrent={cardAddress === selectedAccountAddress}
            attractSelf={attractSelectedAccount}
            onSelect={onAccountSelect}
          />
        )}
      </GenericAccountsGroup>
    );
  }
);

interface AccountOfGroupProps {
  name: string;
  address: string;
  iconHash: string;
  isCurrent: boolean;
  attractSelf: boolean;
  onSelect: (address: string) => void;
}

const AccountOfGroup = memo<AccountOfGroupProps>(({ name, address, iconHash, isCurrent, attractSelf, onSelect }) => {
  const onClick = useCallback(() => {
    if (!isCurrent) onSelect(address!);
  }, [address, isCurrent, onSelect]);

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(isCurrent && attractSelf);

  return (
    <div
      ref={elemRef}
      className={clsx(
        'bg-white flex flex-row justify-between items-center p-3 rounded-lg group',
        isCurrent ? 'border-primary border' : 'cursor-pointer variable-lines-border'
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-x-1.5">
        <AccountAvatar seed={iconHash} size={32} borderColor="gray" />

        <div className="flex flex-col">
          <span className="text-font-medium-bold">{name}</span>
          <CopyAddress address={address} className="p-0.5" />
        </div>
      </div>

      <RadioButton active={isCurrent} className={isCurrent ? undefined : 'opacity-0 group-hover:opacity-100'} />
    </div>
  );
});

const searchAndFilterContacts = (accounts: TempleContact[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return searchAndFilterItems(
    accounts,
    preparedSearchValue,
    [
      { name: 'name', weight: 1 },
      { name: 'address', weight: 0.75 }
    ],
    null,
    0.35
  );
};

const isEvmContact = (address: string) => address.startsWith('0x');

const getKoloPayway = (network: OneOfChains) => {
  console.log(network);
  if (network.kind === TempleChainKind.Tezos) {
    return 'tezos';
  }

  if (network.kind === TempleChainKind.EVM) {
    const chainId = Number(network.chainId);

    switch (chainId) {
      case ETHEREUM_MAINNET_CHAIN_ID:
        return 'eth';
      case COMMON_MAINNET_CHAIN_IDS.bsc:
        return 'bsc';
      case COMMON_MAINNET_CHAIN_IDS.arbitrum:
        return 'arbitrum';
      case COMMON_MAINNET_CHAIN_IDS.base:
        return 'base';
      default:
        return null;
    }
  }

  return null;
};
