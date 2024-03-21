import React, { useMemo } from 'react';

import classNames from 'clsx';

import { Name, Button, HashShortView, Money, Identicon } from 'app/atoms';
import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import Balance from 'app/templates/Balance';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { getAccountAddressForTezos } from 'temple/accounts';

import { AccountDropdownSelectors } from './selectors';

interface Props {
  account: StoredAccount;
  selected: boolean;
  gasTokenName: string;
  attractSelf: boolean;
  onClick: () => void;
}

export const AccountItem: React.FC<Props> = ({ account, selected, gasTokenName, attractSelf, onClick }) => {
  const accountAddress = account.publicKeyHash;
  const accountTezAddress = useMemo(() => getAccountAddressForTezos(account), [account]);

  const elemRef = useScrollIntoViewOnMount<HTMLButtonElement>(selected && attractSelf);

  const classNameMemo = useMemo(
    () =>
      classNames(
        'block w-full p-2 flex items-center',
        'text-white text-shadow-black overflow-hidden',
        'transition ease-in-out duration-200',
        selected && 'shadow',
        selected ? 'bg-gray-700 bg-opacity-40' : 'hover:bg-gray-700 hover:bg-opacity-20',
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
      testIDProperties={{ accountTypeEnum: account.type }}
    >
      <Identicon type="bottts" hash={accountAddress} size={46} className="flex-shrink-0 shadow-xs-white" />

      <div style={{ marginLeft: '10px' }} className="flex flex-col items-start">
        <Name className="text-sm font-medium">{account.name}</Name>

        <div
          className="text-xs text-gray-500"
          {...setTestID(AccountDropdownSelectors.accountAddressValue)}
          {...setAnotherSelector('hash', accountAddress)}
        >
          <HashShortView hash={accountAddress} />
        </div>

        <div className="flex flex-wrap items-center">
          {accountTezAddress ? (
            <Balance address={accountAddress}>
              {bal => (
                <span className="text-xs leading-tight flex items-baseline text-gray-500">
                  <Money smallFractionFont={false} tooltip={false}>
                    {bal}
                  </Money>

                  <span className="ml-1">{gasTokenName.toUpperCase()}</span>
                </span>
              )}
            </Balance>
          ) : (
            '🚧 🛠️ 🔜 🏗️ ETH'
          )}

          <AccountTypeBadge accountType={account.type} darkTheme />
        </div>
      </div>
    </Button>
  );
};
