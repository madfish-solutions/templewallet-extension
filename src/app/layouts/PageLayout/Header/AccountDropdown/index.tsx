import React, { FC, useCallback, useMemo, useState, useEffect } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { openInFullPage, useAppEnv } from 'app/env';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import { ReactComponent as DAppsIcon } from 'app/icons/apps-alt.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as LinkIcon } from 'app/icons/link.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import SearchField from 'app/templates/SearchField';
import { T, t } from 'lib/i18n';
import { useAccount, useRelevantAccounts, useSetAccountPkh, useTempleClient, useGasToken } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';
import { HistoryAction, navigate } from 'lib/woozie';

import { AccountItem } from './AccountItem';
import { ActionButtonProps, ActionButton } from './ActionButton';
import { AccountDropdownSelectors } from './selectors';

type AccountDropdownProps = PopperRenderProps;

interface TDropdownAction extends ActionButtonProps {
  key: string;
}

const AccountDropdown: FC<AccountDropdownProps> = ({ opened, setOpened }) => {
  const appEnv = useAppEnv();
  const { lock } = useTempleClient();
  const allAccounts = useRelevantAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  const { assetName: gasTokenName } = useGasToken();

  const [searchValue, setSearchValue] = useState('');
  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

  const isShowSearch = useMemo(() => allAccounts.length > 5, [allAccounts.length]);

  const filteredAccounts = useMemo(() => {
    if (searchValue.length === 0) {
      return allAccounts;
    } else {
      const lowerCaseSearchValue = searchValue.toLowerCase();

      return allAccounts.filter(currentAccount => currentAccount.name.toLowerCase().includes(lowerCaseSearchValue));
    }
  }, [searchValue, allAccounts]);

  const closeDropdown = useCallback(() => {
    setOpened(false);
  }, [setOpened]);

  const handleLogoutClick = useCallback(() => {
    lock();
  }, [lock]);

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    } else {
      closeDropdown();
    }
  }, [appEnv.popup, closeDropdown]);

  const handleAccountClick = useCallback(
    (publicKeyHash: string) => {
      const selected = publicKeyHash === account.publicKeyHash;
      if (!selected) {
        setAccountPkh(publicKeyHash);
      }
      setOpened(false);
      navigate('/', HistoryAction.Replace);
    },
    [account, setAccountPkh, setOpened]
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
      },
      {
        key: 'dapps',
        Icon: DAppsIcon,
        i18nKey: 'dApps',
        linkTo: '/dApps',
        testID: AccountDropdownSelectors.dAppsButton,
        onClick: closeDropdown
      },
      {
        key: 'settings',
        Icon: SettingsIcon,
        i18nKey: 'settings',
        linkTo: '/settings',
        testID: AccountDropdownSelectors.settingsButton,
        onClick: closeDropdown
      },
      {
        key: 'maximize',
        Icon: MaximiseIcon,
        i18nKey: appEnv.fullPage ? 'openNewTab' : 'maximiseView',
        linkTo: null,
        testID: appEnv.fullPage ? AccountDropdownSelectors.newTabButton : AccountDropdownSelectors.maximizeButton,
        onClick: handleMaximiseViewClick
      }
    ],
    [appEnv.fullPage, closeDropdown, handleMaximiseViewClick]
  );

  useEffect(() => {
    if (searchValue) setAttractSelectedAccount(false);
    else if (opened === false) setAttractSelectedAccount(true);
  }, [opened, searchValue]);

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right p-2"
      style={{
        minWidth: '16rem',
        transform: 'translate(3.25rem, 3.25rem)',
        pointerEvents: 'all'
      }}
    >
      <div className="flex items-center mb-2">
        <h3 className="flex items-center text-sm text-white opacity-20">
          <T id="accounts" />
        </h3>

        <div className="flex-1" />

        <Button
          className={classNames(
            'px-2 py-1',
            'rounded-md',
            'border border-gray-700',
            'flex items-center',
            'text-white text-shadow-black',
            'text-sm',
            'transition duration-300 ease-in-out',
            'opacity-20',
            'hover:opacity-100'
          )}
          onClick={handleLogoutClick}
          testID={AccountDropdownSelectors.logoutButton}
        >
          <LockIcon className="mr-1 h-4 w-auto" />
          <T id="lock" />
        </Button>
      </div>

      <div className="my-2">
        {isShowSearch && (
          <SearchField
            value={searchValue}
            className={classNames(
              'py-2 pl-8 pr-4',
              'bg-transparent',
              'border border-white border-opacity-10',
              'focus:outline-none',
              'transition ease-in-out duration-200',
              'rounded-md rounded-b-none',
              'text-white text-sm leading-tight'
            )}
            placeholder={t('searchByName')}
            searchIconClassName="h-5 w-auto"
            searchIconWrapperClassName="px-2 text-white opacity-75"
            cleanButtonStyle={{ backgroundColor: 'transparent' }}
            cleanButtonIconStyle={{ stroke: 'white' }}
            onValueChange={setSearchValue}
          />
        )}

        <div
          className={classNames(
            'overflow-y-auto rounded border border-gray-700 shadow-inner',
            isShowSearch && 'border-t-0 rounded-t-none'
          )}
          style={{ maxHeight: isShowSearch ? '12rem' : '14.25rem' }}
        >
          <div className="flex flex-col">
            {filteredAccounts.length === 0 ? (
              <p className="text-center text-white text-sm p-10">
                <T id="noResults" />
              </p>
            ) : (
              filteredAccounts.map(acc => (
                <AccountItem
                  key={acc.publicKeyHash}
                  account={acc}
                  selected={acc.publicKeyHash === account.publicKeyHash}
                  gasTokenName={gasTokenName}
                  attractSelf={attractSelectedAccount}
                  onClick={() => handleAccountClick(acc.publicKeyHash)}
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
};

export default AccountDropdown;
