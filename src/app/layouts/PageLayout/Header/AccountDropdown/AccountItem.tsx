import React, { memo, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { Name, Button, HashShortView, Money, Identicon } from 'app/atoms';
import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import Balance from 'app/templates/Balance';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useEvmNetwork, useTezosMainnetChain } from 'temple/front';

import { AccountDropdownSelectors } from './selectors';

interface Props {
  account: StoredAccount;
  selected: boolean;
  attractSelf: boolean;
  onClick: (accountId: string) => void;
}

export const AccountItem = memo<Props>(({ account, selected, attractSelf, onClick }) => {
  const evmNetwork = useEvmNetwork();
  const tezosMainnetChain = useTezosMainnetChain();

  const [accountTezAddress, displayAddress] = useMemo(() => {
    const tezAddress = getAccountAddressForTezos(account);
    const displayAddress = (tezAddress || getAccountAddressForEvm(account))!;

    return [tezAddress, displayAddress];
  }, [account]);

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

  const handleClick = useCallback(() => onClick(account.id), [onClick, account.id]);

  return (
    <Button
      ref={elemRef}
      className={classNameMemo}
      onClick={handleClick}
      testID={AccountDropdownSelectors.accountItemButton}
      testIDProperties={{ accountTypeEnum: account.type }}
    >
      <Identicon type="bottts" hash={account.id} size={46} className="flex-shrink-0 shadow-xs-white" />

      <div style={{ marginLeft: '10px' }} className="flex flex-col items-start">
        <Name className="text-sm font-medium">{account.name}</Name>

        <div
          className="text-xs text-gray-500"
          {...setTestID(AccountDropdownSelectors.accountAddressValue)}
          {...setAnotherSelector('hash', displayAddress)}
        >
          <HashShortView hash={displayAddress} />
        </div>

        <div className="flex flex-wrap items-center">
          {accountTezAddress ? (
            <Balance network={tezosMainnetChain} address={accountTezAddress}>
              {bal => (
                <span className="text-xs leading-tight flex items-baseline text-gray-500">
                  <Money smallFractionFont={false} tooltip={false}>
                    {bal}
                  </Money>

                  <span className="ml-1">TEZ</span>
                </span>
              )}
            </Balance>
          ) : (
            `🚧 🛠️ 🔜 🏗️ ${evmNetwork.currency.symbol}`
          )}

          <AccountTypeBadge accountType={account.type} darkTheme />
        </div>
      </div>
    </Button>
  );
});
