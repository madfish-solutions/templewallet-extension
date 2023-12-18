import React, { FC, useCallback, useMemo, useState, useEffect, useRef } from 'react';

import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';
import useOnClickOutside from 'use-onclickoutside';

import Divider from 'app/atoms/Divider';
import { useAccountSelectShortcut } from 'app/hooks/use-account-select-shortcut';
import { useDisableBodyScroll } from 'app/hooks/use-disable-body-scroll';
import { ReactComponent as SadSearchIcon } from 'app/icons/sad-search.svg';
import { AccountItem } from 'app/layouts/PageLayout/Header/AccountDropdown/AccountItem';
import SearchField from 'app/templates/SearchField';
import { searchHotkey } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useAccount, useRelevantAccounts, useSetAccountPkh, useGasToken } from 'lib/temple/front';
import Portal from 'lib/ui/Portal';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { HistoryAction, navigate } from 'lib/woozie';

export const ShortcutAccountSwitchOverlay: FC = () => {
  const { opened, setOpened } = useAccountSelectShortcut();
  useDisableBodyScroll(opened);

  const accountSwitchRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(accountSwitchRef, () => setOpened(false));

  const allAccounts = useRelevantAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  const { assetName: gasTokenName } = useGasToken();

  const [searchValue, setSearchValue] = useState('');
  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

  const filteredAccounts = useMemo(() => {
    if (searchValue.length === 0) {
      return allAccounts;
    }

    return searchAndFilterItems(allAccounts, searchValue.toLowerCase(), [
      { name: 'name', weight: 0.5 },
      { name: 'publicKeyHash', weight: 0.5 }
    ]);
  }, [searchValue, allAccounts]);

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

  useEffect(() => {
    if (searchValue) setAttractSelectedAccount(false);
    else if (!opened) setAttractSelectedAccount(true);
  }, [opened, searchValue]);

  return (
    <Portal>
      <CSSTransition
        in={opened}
        timeout={100}
        classNames={{
          enter: 'opacity-0',
          enterActive: 'opacity-100 transition ease-out duration-100',
          exit: 'opacity-0 transition ease-in duration-100'
        }}
        unmountOnExit
      >
        <div className="fixed inset-0 z-50 w-full h-full bg-black bg-opacity-20">
          <div
            ref={accountSwitchRef}
            className="absolute top-1/2 left-1/2 border rounded-md bg-gray-910 border-gray-850 p-2 w-64"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <SearchField
              autoFocus
              value={searchValue}
              className={classNames(
                'py-2 pl-8 pr-8',
                'bg-transparent',
                'focus:outline-none',
                'transition ease-in-out duration-200',
                'rounded-md rounded-b-none',
                'text-gray-500 placeholder-gray-600 text-sm leading-tight'
              )}
              placeholder={t('searchAccount', [searchHotkey])}
              searchIconClassName="h-5 w-auto text-gray-600 stroke-current"
              searchIconWrapperClassName="px-2"
              cleanButtonClassName="border-gray-600"
              cleanButtonIconClassName="text-gray-600 stroke-current"
              cleanButtonStyle={{ backgroundColor: 'transparent' }}
              onValueChange={setSearchValue}
            />

            <Divider className="bg-gray-700 -mx-2" />

            <div className="overflow-y-auto h-63 p-2 -mx-2">
              <div className="flex flex-col">
                {filteredAccounts.length === 0 ? (
                  <div className="h-63 flex justify-center items-center">
                    <SadSearchIcon />
                  </div>
                ) : (
                  filteredAccounts.map(acc => (
                    <AccountItem
                      key={acc.publicKeyHash}
                      account={acc}
                      selected={acc.publicKeyHash === account.publicKeyHash}
                      gasTokenName={gasTokenName}
                      attractSelf={attractSelectedAccount}
                      className="rounded-lg"
                      onClick={() => handleAccountClick(acc.publicKeyHash)}
                    />
                  ))
                )}
              </div>
            </div>

            <Divider className="bg-gray-700 mb-2 -mx-2" />

            <p className="text-center text-gray-500 text-xs font-normal font-inter">
              <T id="shortcutSwitchAccountOverlayNavigation" />
            </p>
          </div>
        </div>
      </CSSTransition>
    </Portal>
  );
};
