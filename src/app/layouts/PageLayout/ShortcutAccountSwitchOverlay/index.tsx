import React, { useCallback, useMemo, useState, useEffect, useRef, KeyboardEventHandler, memo } from 'react';

import clsx from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';
import useOnClickOutside from 'use-onclickoutside';

import { Name } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { EmptyState } from 'app/atoms/EmptyState';
import { useAccountSelectShortcut } from 'app/hooks/use-account-select-shortcut';
import { useModalScrollLock } from 'app/hooks/use-modal-scroll-lock';
import { AccountsManagementSelectors } from 'app/templates/AccountsManagement/selectors';
import { SearchBarField } from 'app/templates/SearchField';
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
        <div className="fixed inset-0 z-overlay flex flex-col items-center justify-center bg-black bg-opacity-15 backdrop-blur-xs">
          <div
            ref={accountSwitchRef}
            tabIndex={0}
            className="mx-auto rounded-8 bg-white w-88"
            onKeyDown={handleKeyPress}
          >
            <div className="p-3 border-b-0.5 border-lines">
              <SearchBarField
                autoFocus
                defaultRightMargin={false}
                value={searchValue}
                className={'focus:outline-none focus:ring-0 focus:border-transparent'}
                placeholder={t('searchAccount', [searchHotkey])}
                onValueChange={handleSearchValueChange}
                testID={AccountsManagementSelectors.searchField}
                onCleanButtonClick={handleCleanButtonClick}
              />
            </div>

            <div className="overflow-y-auto overscroll-contain h-[22.5rem]">
              {filteredGroups.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <EmptyState />
                </div>
              ) : (
                filteredGroups.map((group, index) => (
                  <div key={group.id} className={clsx(index === 0 && 'mt-3', 'flex flex-col mb-4 px-3')}>
                    <div className="flex items-center justify-between">
                      <Name className="p-1 text-font-description-bold">{group.name}</Name>
                      <AccLabel type={group.type} />
                    </div>
                    <div className="flex flex-col gap-y-3 mt-2">
                      {group.accounts.map(account => (
                        <AccountItem
                          key={account.id}
                          account={account}
                          focused={filteredAccounts[focusedAccountItemIndex]?.id === account.id}
                          onAccountSelect={handleAccountClick}
                          searchValue={searchValue}
                          arrayIndex={filteredAccounts.findIndex(a => a.id === account.id)}
                          itemsArrayRef={accountItemsRef}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-center text-grey-1 text-xs border-t-0.5 border-lines p-3 ">
              <T id="shortcutSwitchAccountOverlayNavigation" />
            </p>
          </div>
        </div>
      </CSSTransition>
    </Portal>
  );
});
