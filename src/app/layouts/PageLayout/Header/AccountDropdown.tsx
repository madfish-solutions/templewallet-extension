import React, { FC, useCallback, useMemo, useState, useRef, useEffect } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import { openInFullPage, useAppEnv } from 'app/env';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import { ReactComponent as DAppsIcon } from 'app/icons/apps-alt.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as LinkIcon } from 'app/icons/link.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import Balance from 'app/templates/Balance';
import SearchField from 'app/templates/SearchField';
import { AnalyticsEventCategory, TestIDProps, useAnalytics } from 'lib/analytics';
import { TID, T, t } from 'lib/i18n';
import { useAccount, useRelevantAccounts, useSetAccountPkh, useTempleClient, useGasToken } from 'lib/temple/front';
import { TempleAccount } from 'lib/temple/types';
import { PopperRenderProps } from 'lib/ui/Popper';
import { Link } from 'lib/woozie';

import { AccountDropdownSelectors } from './AccountDropdown.selectors';

type AccountDropdownProps = PopperRenderProps;

interface TDropdownAction extends TestIDProps {
  key: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  i18nKey: TID;
  linkTo: string | null;
  onClick: () => void;
}

const AccountDropdown: FC<AccountDropdownProps> = ({ opened, setOpened }) => {
  const appEnv = useAppEnv();
  const { lock } = useTempleClient();
  const { trackEvent } = useAnalytics();
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
        testID: AccountDropdownSelectors.CreateOrRestoreAccountButton,
        onClick: closeDropdown
      },
      {
        key: 'import-account',
        Icon: DownloadIcon,
        i18nKey: 'importAccount',
        linkTo: '/import-account',
        testID: AccountDropdownSelectors.ImportAccountButton,
        onClick: closeDropdown
      },
      {
        key: 'connect-ledger',
        Icon: LinkIcon,
        i18nKey: 'connectLedger',
        linkTo: '/connect-ledger',
        testID: AccountDropdownSelectors.ConnectLedgerButton,
        onClick: closeDropdown
      },
      {
        key: 'dapps',
        Icon: DAppsIcon,
        i18nKey: 'dApps',
        linkTo: '/dApps',
        testID: AccountDropdownSelectors.DAppsButton,
        onClick: closeDropdown
      },
      {
        key: 'settings',
        Icon: SettingsIcon,
        i18nKey: 'settings',
        linkTo: '/settings',
        testID: AccountDropdownSelectors.SettingsButton,
        onClick: closeDropdown
      },
      {
        key: 'maximise',
        Icon: MaximiseIcon,
        i18nKey: appEnv.fullPage ? 'openNewTab' : 'maximiseView',
        linkTo: null,
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
      className="origin-top-right"
      style={{
        minWidth: '16rem',
        transform: 'translate(3.25rem, 3.25rem)',
        pointerEvents: 'all'
      }}
    >
      <div className="flex items-center mb-2">
        <h3 className={classNames('flex items-center', 'text-sm text-white opacity-20')}>
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
          testID={AccountDropdownSelectors.LogoutButton}
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
            'overflow-y-auto',
            'border border-gray-700 shadow-inner',
            'rounded',
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
        {actions.map(({ key, Icon, i18nKey, linkTo, testID, onClick }) => {
          const handleClick = () => {
            trackEvent(AccountDropdownSelectors.ActionButton, AnalyticsEventCategory.ButtonPress, { type: key });
            return onClick();
          };

          const baseProps = {
            key,
            testID,
            className: classNames(
              'block w-full',
              'rounded overflow-hidden',
              'flex items-center',
              'px-2',
              'transition ease-in-out duration-200',
              'hover:bg-white hover:bg-opacity-10',
              'text-white text-shadow-black text-sm',
              'whitespace-nowrap'
            ),
            style: {
              paddingTop: '0.375rem',
              paddingBottom: '0.375rem'
            },
            onClick: handleClick,
            children: (
              <>
                <div className="flex items-center w-8">
                  <Icon className="w-auto h-6 stroke-current" />
                </div>

                <T id={i18nKey} />
              </>
            )
          };

          return linkTo ? <Link {...baseProps} to={linkTo} /> : <button {...baseProps} />;
        })}
      </div>
    </DropdownWrapper>
  );
};

export default AccountDropdown;

interface AccountItemProps {
  account: TempleAccount;
  selected: boolean;
  gasTokenName: string;
  attractSelf: boolean;
  onClick: () => void;
}

const AccountItem: React.FC<AccountItemProps> = ({ account, selected, gasTokenName, attractSelf, onClick }) => {
  const { name, publicKeyHash } = account;

  const elemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected && attractSelf) {
      setTimeout(() => {
        elemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 0);
    }
  }, []);

  return (
    <Button
      ref={elemRef}
      className={classNames(
        'block w-full p-2',
        'overflow-hidden',
        'flex items-center',
        'text-white text-shadow-black',
        'transition ease-in-out duration-200',
        selected && 'shadow',
        selected ? 'bg-gray-700 bg-opacity-40' : 'hover:bg-white hover:bg-opacity-5',
        !selected && 'opacity-65 hover:opacity-100'
      )}
      onClick={onClick}
      testID={AccountDropdownSelectors.AccountItemButton}
    >
      <Identicon type="bottts" hash={publicKeyHash} size={46} className="flex-shrink-0 shadow-xs-white" />

      <div style={{ marginLeft: '10px' }} className="flex flex-col items-start">
        <Name className="text-sm font-medium">{name}</Name>
        <div className="text-xs text-gray-500">
          <HashShortView hash={publicKeyHash} />
        </div>

        <div className="flex flex-wrap items-end">
          <Balance address={publicKeyHash}>
            {bal => (
              <span className="text-xs leading-tight flex items-baseline text-gray-500">
                <Money smallFractionFont={false} tooltip={false}>
                  {bal}
                </Money>
                <span className="ml-1">{gasTokenName.toUpperCase()}</span>
              </span>
            )}
          </Balance>

          <AccountTypeBadge account={account} darkTheme />
        </div>
      </div>
    </Button>
  );
};
