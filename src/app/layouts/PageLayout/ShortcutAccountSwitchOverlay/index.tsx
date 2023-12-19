import React, { FC, useCallback, useMemo, useState, useEffect, useRef, KeyboardEventHandler } from 'react';

import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';
import useOnClickOutside from 'use-onclickoutside';

import Divider from 'app/atoms/Divider';
import { useAccountSelectShortcut } from 'app/hooks/use-account-select-shortcut';
import { useModalScrollLock } from 'app/hooks/use-modal-scroll-lock';
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
  const accountSwitchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const accountItemsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const { opened, setOpened } = useAccountSelectShortcut();
  useModalScrollLock(opened, accountSwitchRef);
  useOnClickOutside(accountSwitchRef, () => setOpened(false));

  const allAccounts = useRelevantAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  const { assetName: gasTokenName } = useGasToken();

  const [searchValue, setSearchValue] = useState('');
  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);
  const [focusedAccountItemIndex, setFocusedAccountItemIndex] = useState(-1);

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

  const handleKeyPress = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    e => {
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

        if (focusedAccountItemIndex === 0) {
          searchInputRef.current?.focus();
          setFocusedAccountItemIndex(-1);
        }

        if (focusedAccountItemIndex > 0) {
          accountItemsRef.current[focusedAccountItemIndex - 1]?.focus();
          setFocusedAccountItemIndex(prev => prev - 1);
        }

        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();

        if (focusedAccountItemIndex === -1) {
          accountItemsRef.current[0]?.focus();
          setFocusedAccountItemIndex(0);
        }

        if (focusedAccountItemIndex >= 0 && focusedAccountItemIndex < filteredAccounts.length - 1) {
          accountItemsRef.current[focusedAccountItemIndex + 1]?.focus();
          setFocusedAccountItemIndex(prev => prev + 1);
        }
      }
    },
    [filteredAccounts.length, focusedAccountItemIndex, opened, searchValue, setOpened]
  );

  useEffect(() => {
    if (opened) {
      setSearchValue('');
      setFocusedAccountItemIndex(-1);
    }
  }, [opened]);

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
            onKeyDown={handleKeyPress}
            className="absolute top-1/2 left-1/2 border rounded-md bg-gray-910 border-gray-850 p-2 w-64"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <SearchField
              autoFocus
              externalRef={searchInputRef}
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
              onFocus={() => setFocusedAccountItemIndex(-1)}
            />

            <Divider className="bg-gray-700 -mx-2" />

            <div className="overflow-y-auto overscroll-contain h-63 p-2 -mx-2">
              <div className="flex flex-col">
                {filteredAccounts.length === 0 ? (
                  <div className="h-63 flex justify-center items-center">
                    <SadSearchIcon />
                  </div>
                ) : (
                  filteredAccounts.map((acc, index) => (
                    <AccountItem
                      arrayIndex={index}
                      itemsArrayRef={accountItemsRef}
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
