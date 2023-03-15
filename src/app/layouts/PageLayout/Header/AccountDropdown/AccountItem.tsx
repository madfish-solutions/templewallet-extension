import React, { useMemo } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import { Button } from 'app/atoms/Button';
import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Balance from 'app/templates/Balance';
import { TempleAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';

import { AccountDropdownSelectors } from './selectors';

interface AccountItemProps {
  account: TempleAccount;
  selected: boolean;
  gasTokenName: string;
  attractSelf: boolean;
  onClick: () => void;
}

export const AccountItem: React.FC<AccountItemProps> = ({ account, selected, gasTokenName, attractSelf, onClick }) => {
  const { name, publicKeyHash, type } = account;

  const elemRef = useScrollIntoViewOnMount<HTMLButtonElement>(selected && attractSelf);

  const classNameMemo = useMemo(
    () =>
      classNames(
        'block w-full p-2 flex items-center',
        'text-white text-shadow-black overflow-hidden',
        'transition ease-in-out duration-200',
        selected && 'shadow',
        selected ? 'bg-gray-700 bg-opacity-40' : 'hover:bg-white hover:bg-opacity-5',
        !selected && 'opacity-65 hover:opacity-100'
      ),
    [selected]
  );

  return (
    <Button
      ref={elemRef}
      className={classNameMemo}
      onClick={onClick}
      testID={AccountDropdownSelectors.accountItemButton}
      testIDProperties={{ accountTypeEnum: type }}
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
