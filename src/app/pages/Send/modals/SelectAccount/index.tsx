import React, { memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { HashShortView, IconBase, Identicon, Name } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { SpinnerSection } from 'app/pages/Send/form/SpinnerSection';
import { SearchBarField } from 'app/templates/SearchField';
import { toastSuccess } from 'app/toaster';
import { T } from 'lib/i18n';
import { StoredAccount, TempleContact } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { searchAndFilterAccounts, useAccountsGroups, useVisibleAccounts } from 'temple/front';
import { useCurrentAccountId, useSettings } from 'temple/front/ready';

interface Props {
  opened: boolean;
  selectedAccountAddress: string;
  onRequestClose: EmptyFn;
  onAccountSelect: (address: string) => void;
  evm?: boolean;
}

export const SelectAccountModal = memo<Props>(
  ({ opened, selectedAccountAddress, onRequestClose, onAccountSelect, evm = false }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const { contacts } = useSettings();

    const allStoredAccounts = useVisibleAccounts();
    const currentStoredAccountId = useCurrentAccountId();

    const suitableAccounts = useMemo(
      () =>
        allStoredAccounts.filter(acc => {
          if (acc.id === currentStoredAccountId) return false;

          if (evm) return Boolean(getAccountAddressForEvm(acc));
          else return Boolean(getAccountAddressForTezos(acc));
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

    const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

    useEffect(() => {
      if (searchValue) setAttractSelectedAccount(false);
      else if (!opened) setAttractSelectedAccount(true);
    }, [opened, searchValue]);

    return (
      <PageModal title="Select Account" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col px-4 pt-4 pb-3">
          <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} />
        </div>

        <div className="px-4 flex-1 flex flex-col overflow-y-auto">
          <Suspense fallback={<SpinnerSection />}>
            {filteredGroups.length || filteredContacts.length ? (
              <>
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
        </div>

        <div className="p-4 pb-6 flex flex-col bg-white">
          <StyledButton size="L" color="primary-low" onClick={onRequestClose}>
            <T id="cancel" />
          </StyledButton>
        </div>
      </PageModal>
    );
  }
);

interface AccountsGroupProps {
  title: string;
  accounts: StoredAccount[];
  selectedAccountAddress: string;
  attractSelectedAccount: boolean;
  onAccountSelect: (address: string) => void;
  evm?: boolean;
}

const AccountsGroup = memo<AccountsGroupProps>(
  ({ title, accounts, selectedAccountAddress, attractSelectedAccount, onAccountSelect, evm = false }) => (
    <div className="flex flex-col mb-4">
      <Name className="mb-1 p-1 text-font-description-bold">{title}</Name>

      <div className="flex flex-col gap-y-3">
        {accounts.map(account => {
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
        })}
      </div>
    </div>
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
      <div className="flex flex-col mb-4">
        <Name className="mb-1 p-1 text-font-description-bold">
          <T id="addressBook" />
        </Name>

        <div className="flex flex-col gap-y-3">
          {contacts.map(contact => (
            <AccountOfGroup
              key={contact.address}
              name={contact.name}
              address={contact.address}
              iconHash={contact.address}
              isCurrent={contact.address === selectedAccountAddress}
              attractSelf={attractSelectedAccount}
              onSelect={onAccountSelect}
            />
          ))}
        </div>
      </div>
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
    if (isCurrent) return;

    onSelect(address!);
  }, [address, isCurrent, onSelect]);

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(isCurrent && attractSelf);

  return (
    <div
      ref={elemRef}
      className={clsx(
        'flex flex-row justify-between items-center p-3',
        'rounded-lg shadow-bottom border group',
        isCurrent ? 'border-primary' : 'cursor-pointer border-transparent hover:border-lines'
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-x-1.5">
        <div className="flex p-px rounded-md border border-grey-3">
          <Identicon type="bottts" hash={iconHash} size={28} className="rounded-sm" />
        </div>

        <div className="flex flex-col">
          <span className="text-font-medium-bold">{name}</span>
          <Address address={address} />
        </div>
      </div>

      <RadioButton active={isCurrent} className={isCurrent ? undefined : 'opacity-0 group-hover:opacity-100'} />
    </div>
  );
});

interface AddressProps {
  address: string;
}

const Address = memo<AddressProps>(({ address }) => (
  <div
    className="flex flex-row items-center p-0.5 cursor-pointer"
    onClick={e => {
      e.stopPropagation();
      window.navigator.clipboard.writeText(address);
      toastSuccess('Address Copied');
    }}
  >
    <span className="text-font-description text-grey-1 group-hover:text-secondary">
      <HashShortView hash={address} />
    </span>
    <IconBase Icon={CopyIcon} size={12} className="ml-0.5 text-secondary hidden group-hover:block" />
  </div>
));

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
