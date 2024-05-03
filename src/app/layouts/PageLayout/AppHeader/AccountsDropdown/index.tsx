import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as SadSearchIcon } from 'app/icons/sad-search.svg';
import SearchField from 'app/templates/SearchField';
import { searchHotkey } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';
import { HistoryAction, navigate } from 'lib/woozie';
import {
  searchAndFilterAccounts,
  useAccountsGroups,
  useCurrentAccountId,
  useChangeAccount,
  useVisibleAccounts
} from 'temple/front';

import { AccountItem } from './AccountItem';
import { AccountsDropdownSelectors } from './selectors';

const AccountsDropdown = memo<PopperRenderProps>(({ opened, setOpened }) => {
  const { lock } = useTempleClient();
  const allAccounts = useVisibleAccounts();
  const currentAccountId = useCurrentAccountId();
  const setAccountId = useChangeAccount();

  useShortcutAccountSelectModalIsOpened(() => setOpened(false));

  const [searchValue, setSearchValue] = useState('');
  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );
  const filteredGroups = useAccountsGroups(filteredAccounts);

  const handleLogoutClick = useCallback(() => {
    lock();
  }, [lock]);

  const handleAccountClick = useCallback(
    (id: string) => {
      const selected = id === currentAccountId;
      if (!selected) {
        setAccountId(id);
      }
      setOpened(false);
      navigate('/', HistoryAction.Replace);
    },
    [currentAccountId, setAccountId, setOpened]
  );

  useEffect(() => {
    if (searchValue) setAttractSelectedAccount(false);
    else if (!opened) setAttractSelectedAccount(true);
  }, [opened, searchValue]);

  return (
    <DropdownWrapper
      opened={opened}
      design="dark"
      // className="origin-top-right p-2 w-64"
      // style={{
      //   transform: 'translate(3.25rem, 3.25rem)',
      //   pointerEvents: 'all'
      // }}
      className="mt-3 p-2 w-64 min-h-96 flex flex-col"
    >
      <div className="flex items-center mb-2">
        <h3 className="flex items-center text-sm text-white opacity-20">
          <T id="accounts" />
        </h3>

        <div className="flex-1" />

        <Button
          className={clsx(
            'px-2 py-0.5',
            'rounded-md',
            'border border-gray-200',
            'flex items-center',
            'text-gray-200',
            'text-sm',
            'transition duration-300 ease-in-out',
            'opacity-20',
            'hover:opacity-100'
          )}
          onClick={handleLogoutClick}
          testID={AccountsDropdownSelectors.logoutButton}
        >
          <IconBase Icon={LockIcon} size={16} className="mr-1" />
          <T id="lock" />
        </Button>
      </div>

      <SearchField
        value={searchValue}
        className={clsx(
          'py-2 pl-8 pr-8',
          'bg-transparent',
          'border border-gray-200 border-opacity-20',
          'focus:outline-none',
          'transition ease-in-out duration-200',
          'rounded-md rounded-b-none',
          'text-gray-500 placeholder-gray-600 text-sm leading-tight'
        )}
        placeholder={t('searchAccount', [searchHotkey])}
        onValueChange={setSearchValue}
      />

      <div className="flex-1 overflow-y-auto rounded border border-gray-200 border-opacity-20 shadow-inner border-t-0 rounded-t-none h-48">
        <div className="flex flex-col">
          {filteredAccounts.length === 0 ? (
            <div className="h-48 flex justify-center items-center">
              <SadSearchIcon />
            </div>
          ) : (
            filteredGroups.map(({ id, name, accounts }) => (
              <React.Fragment key={id}>
                <h6 className="p-2 text-sm text-gray-500">{name}</h6>

                {accounts.map(acc => (
                  <AccountItem
                    key={acc.id}
                    account={acc}
                    selected={acc.id === currentAccountId}
                    attractSelf={attractSelectedAccount}
                    searchValue={searchValue}
                    onClick={handleAccountClick}
                  />
                ))}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </DropdownWrapper>
  );
});

export default AccountsDropdown;
