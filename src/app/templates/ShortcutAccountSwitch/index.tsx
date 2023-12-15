import React, { FC, useCallback, useMemo, useState, useEffect } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useAccountSelectShortcut } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as SadSearchIcon } from 'app/icons/sad-search.svg';
import { AccountItem } from 'app/layouts/PageLayout/Header/AccountDropdown/AccountItem';
import SearchField from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { useAccount, useRelevantAccounts, useSetAccountPkh, useGasToken } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { HistoryAction, navigate } from 'lib/woozie';

const isMacOS = /Mac OS/.test(navigator.userAgent);
const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;

export const ShortcutAccountSwitch: FC<PopperRenderProps> = ({ opened, setOpened, toggleOpened }) => {
  useAccountSelectShortcut(opened, setOpened, toggleOpened);

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
    <DropdownWrapper
      opened={opened}
      design="dark"
      className="origin-top-right p-2 min-w-64"
      style={{
        transform: 'translate(3.25rem, 3.25rem)',
        pointerEvents: 'all'
      }}
    >
      <div className="my-2">
        <SearchField
          value={searchValue}
          className={classNames(
            'py-2 pl-8 pr-8',
            'bg-transparent',
            'border border-gray-200 border-opacity-20',
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

        <div className="overflow-y-auto rounded border border-gray-200 border-opacity-20 shadow-inner border-t-0 rounded-t-none h-48">
          <div className="flex flex-col">
            {filteredAccounts.length === 0 ? (
              <div className="h-48 flex justify-center items-center">
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
                  onClick={() => handleAccountClick(acc.publicKeyHash)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DropdownWrapper>
  );
};
