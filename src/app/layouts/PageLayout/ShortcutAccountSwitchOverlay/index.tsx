import React, { useCallback, useMemo, useState, useEffect, useRef, KeyboardEventHandler, memo } from 'react';

import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';
import useOnClickOutside from 'use-onclickoutside';

import Divider from 'app/atoms/Divider';
import { useAccountSelectShortcut } from 'app/hooks/use-account-select-shortcut';
import { useModalScrollLock } from 'app/hooks/use-modal-scroll-lock';
import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import SearchField from 'app/templates/SearchField';
import { searchHotkey } from 'lib/constants';
import { T, t } from 'lib/i18n';
import Portal from 'lib/ui/Portal';
import { HistoryAction, navigate } from 'lib/woozie';
import { useCurrentAccountId, useChangeAccount, useVisibleAccounts } from 'temple/front';
import { searchAndFilterAccounts } from 'temple/front/accounts';
import { useAccountsGroups } from 'temple/front/groups';

import { AccountItem } from './AccountItem';

export const ShortcutAccountSwitchOverlay = memo(() => {
  const accountSwitchRef = useRef<HTMLDivElement>(null);
  const accountItemsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const { opened, setOpened } = useAccountSelectShortcut();
  useModalScrollLock(opened, accountSwitchRef);
  useOnClickOutside(accountSwitchRef, () => setOpened(false));

  const currentAccountId = useCurrentAccountId();
  const allAccounts = useVisibleAccounts();
  const setAccountId = useChangeAccount();

  const [searchValue, setSearchValue] = useState('');
  const [focusedAccountItemIndex, setFocusedAccountItemIndex] = useState(0);

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );
  const filteredGroups = useAccountsGroups(filteredAccounts);

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

  const handleCleanButtonClick = useCallback(() => {
    if (!searchValue) {
      accountSwitchRef.current?.focus();
    }
  }, [searchValue]);

  const handleSearchValueChange = useCallback((value: string) => {
    setSearchValue(value);
    setFocusedAccountItemIndex(0);
  }, []);

  const handleKeyPress = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    e => {
      if (e.key === 'Enter') {
        e.preventDefault();

        const focusedAccount = filteredAccounts[focusedAccountItemIndex];
        handleAccountClick(focusedAccount!.id);

        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();

        if (searchValue) {
          setSearchValue('');
          return;
        }

        if (opened) {
          setOpened(false);
        }

        return;
      }

      if (e.key === 'ArrowUp' || (e.key === 'Tab' && e['shiftKey'])) {
        e.preventDefault();

        if (focusedAccountItemIndex > 0) {
          setFocusedAccountItemIndex(prev => prev - 1);
        }

        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();

        if (focusedAccountItemIndex >= 0 && focusedAccountItemIndex < filteredAccounts.length - 1) {
          setFocusedAccountItemIndex(prev => prev + 1);
        }
      }
    },
    [filteredAccounts, focusedAccountItemIndex, handleAccountClick, opened, searchValue, setOpened]
  );

  useEffect(() => {
    if (!opened) {
      setSearchValue('');
      setFocusedAccountItemIndex(0);
    }
  }, [opened]);

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
        <div className="fixed inset-0 z-overlay w-full h-full bg-black bg-opacity-20">
          <div
            ref={accountSwitchRef}
            tabIndex={0}
            className="absolute top-1/2 left-1/2 border rounded-md bg-gray-910 border-gray-850 p-2 w-64 focus:outline-none"
            style={{ transform: 'translate(-50%, -50%)' }}
            onKeyDown={handleKeyPress}
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
              onValueChange={handleSearchValueChange}
              onCleanButtonClick={handleCleanButtonClick}
            />

            <Divider className="bg-gray-700 -mx-2" />

            <div className="py-2">
              <div className="overflow-y-auto overscroll-contain h-63 px-2 -mx-2">
                <div className="flex flex-col">
                  {filteredAccounts.length === 0 ? (
                    <div className="h-63 flex justify-center items-center">
                      <SadSearchIcon />
                    </div>
                  ) : (
                    filteredGroups.map(({ id, name, accounts }) => (
                      <React.Fragment key={id}>
                        <div className="text-sm font-medium text-gray-500">{name}</div>
                        {accounts.map(acc => (
                          <AccountItem
                            key={acc.id}
                            account={acc}
                            focused={filteredAccounts[focusedAccountItemIndex]?.id === acc.id}
                            arrayIndex={filteredAccounts.findIndex(a => a.id === acc.id)}
                            itemsArrayRef={accountItemsRef}
                            searchValue={searchValue}
                            onClick={() => handleAccountClick(acc.id)}
                          />
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </div>
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
});
