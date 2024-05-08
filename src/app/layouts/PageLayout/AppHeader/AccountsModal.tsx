import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Identicon, Name } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { AccountName } from 'app/atoms/AccountName';
import { IconButton } from 'app/atoms/IconButton';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import { ReactComponent as PlusIcon } from 'app/icons/plus.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import { SearchBarField } from 'app/templates/SearchField';
import { StoredAccount } from 'lib/temple/types';
import { searchAndFilterAccounts, useAccountsGroups, useCurrentAccountId, useVisibleAccounts } from 'temple/front';
import { useSetAccountId } from 'temple/front/ready';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const AccountsModal = memo<Props>(({ opened, onRequestClose }) => {
  const allAccounts = useVisibleAccounts();
  const currentAccountId = useCurrentAccountId();

  const [searchValue, setSearchValue] = useState('');

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );
  const filteredGroups = useAccountsGroups(filteredAccounts);

  return (
    <PageModal title="My Accounts" opened={opened} onRequestClose={onRequestClose}>
      <div className="flex gap-x-2 mb-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={SettingsIcon} design="blue" />

        <IconButton Icon={PlusIcon} design="blue" />
      </div>

      <div className="flex flex-col">
        {filteredGroups.map(group => (
          <AccountsGroup
            key={group.id}
            title={group.name}
            accounts={group.accounts}
            currentAccountId={currentAccountId}
            onAccountSelect={onRequestClose}
          />
        ))}
      </div>
    </PageModal>
  );
});

interface AccountsGroupProps {
  title: string;
  accounts: StoredAccount[];
  currentAccountId: string;
  onAccountSelect: EmptyFn;
}

const AccountsGroup = memo<AccountsGroupProps>(({ title, accounts, currentAccountId, onAccountSelect }) => {
  //
  return (
    <div className="flex flex-col mb-4">
      <Name className="mb-1 p-1 text-xs font-semibold">{title}</Name>

      <div className="flex flex-col gap-y-3">
        {accounts.map(account => (
          <AccountOfGroup
            key={account.id}
            account={account}
            isCurrent={account.id === currentAccountId}
            onSelect={onAccountSelect}
          />
        ))}
      </div>
    </div>
  );
});

interface AccountOfGroupProps {
  account: StoredAccount;
  isCurrent: boolean;
  onSelect: EmptyFn;
}

const AccountOfGroup = memo<AccountOfGroupProps>(({ account, isCurrent, onSelect }) => {
  const setAccountId = useSetAccountId();

  const onClick = useCallback(() => {
    if (isCurrent) return;

    setAccountId(account.id);
    onSelect();
  }, [isCurrent, account.id, onSelect, setAccountId]);

  return (
    <div
      className={clsx(
        'flex flex-col p-2 gap-y-1.5',
        'rounded-lg shadow-bottom border',
        isCurrent ? 'border-primary' : 'cursor-pointer group border-transparent hover:border-lines'
      )}
      onClick={onClick}
    >
      <div className="flex gap-x-1">
        <div className="flex p-px rounded-md border border-grey-3">
          <Identicon type="bottts" hash={account.id} size={28} className="rounded-sm" />
        </div>

        <AccountName account={account} smaller />

        <div className="flex-1" />

        <RadioButton active={isCurrent} className={isCurrent ? undefined : 'opacity-0 group-hover:opacity-100'} />
      </div>

      <div className="flex items-center">
        <div className="flex-1 flex flex-col">
          <div className="text-xxxs leading-3 text-grey-1">Total Balance:</div>

          <div className="text-xs font-rubik">12 345 678.00 $</div>
        </div>

        <AccLabel type={account.type} />
      </div>
    </div>
  );
});
