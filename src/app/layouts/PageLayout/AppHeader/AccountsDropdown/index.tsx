import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as LinkIcon } from 'app/icons/link.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as SadSearchIcon } from 'app/icons/sad-search.svg';
import SearchField from 'app/templates/SearchField';
import { searchHotkey } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';
import { HistoryAction, navigate } from 'lib/woozie';
import { searchAndFilterAccounts, useCurrentAccountId, useChangeAccount, useAllAccounts } from 'temple/front';

import { AccountItem } from './AccountItem';
import { ActionButtonProps, ActionButton } from './ActionButton';
import { AccountDropdownSelectors } from './selectors';

interface TDropdownAction extends ActionButtonProps {
  key: string;
}

const AccountsDropdown = memo<PopperRenderProps>(({ opened, setOpened }) => {
  const { lock } = useTempleClient();
  const allAccounts = useAllAccounts();
  const currentAccountId = useCurrentAccountId();
  const setAccountId = useChangeAccount();

  useShortcutAccountSelectModalIsOpened(() => setOpened(false));

  const [searchValue, setSearchValue] = useState('');
  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );

  const closeDropdown = useCallback(() => {
    setOpened(false);
  }, [setOpened]);

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

  const actions = useMemo(
    (): TDropdownAction[] => [
      {
        key: 'create-account',
        Icon: AddIcon,
        i18nKey: 'createAccount',
        linkTo: '/create-account',
        testID: AccountDropdownSelectors.createOrRestoreAccountButton,
        onClick: closeDropdown
      },
      {
        key: 'import-account',
        Icon: DownloadIcon,
        i18nKey: 'importAccount',
        linkTo: '/import-account',
        testID: AccountDropdownSelectors.importAccountButton,
        onClick: closeDropdown
      },
      {
        key: 'connect-ledger',
        Icon: LinkIcon,
        i18nKey: 'connectLedger',
        linkTo: '/connect-ledger',
        testID: AccountDropdownSelectors.connectLedgerButton,
        onClick: closeDropdown
      }
    ],
    [closeDropdown]
  );

  useEffect(() => {
    if (searchValue) setAttractSelectedAccount(false);
    else if (!opened) setAttractSelectedAccount(true);
  }, [opened, searchValue]);

  return (
    <DropdownWrapper opened={opened} design="dark" className="p-2 w-64">
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
          testID={AccountDropdownSelectors.logoutButton}
        >
          <IconBase Icon={LockIcon} size={16} className="mr-1" />
          <T id="lock" />
        </Button>
      </div>

      <div className="my-2">
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

        <div className="overflow-y-auto rounded border border-gray-200 border-opacity-20 shadow-inner border-t-0 rounded-t-none h-48">
          <div className="flex flex-col">
            {filteredAccounts.length === 0 ? (
              <div className="h-48 flex justify-center items-center">
                <SadSearchIcon />
              </div>
            ) : (
              filteredAccounts.map(acc => (
                <AccountItem
                  key={acc.id}
                  account={acc}
                  selected={acc.id === currentAccountId}
                  attractSelf={attractSelectedAccount}
                  onClick={handleAccountClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        {actions.map(action => (
          <ActionButton {...action} />
        ))}
      </div>
    </DropdownWrapper>
  );
});

export default AccountsDropdown;
