import React, { RefObject, useMemo } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { Name, Button, HashShortView, Money, Identicon } from 'app/atoms';
import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { TezosBalance } from 'app/templates/Balance';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';
import { combineRefs } from 'lib/ui/utils';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useTezosMainnetChain } from 'temple/front';

import { ShortcutAccountSwitchSelectors } from './selectors';

const scrollIntoViewOptions: ScrollIntoViewOptions = { block: 'end', behavior: 'smooth' };

interface AccountItemProps {
  account: StoredAccount;
  focused: boolean;
  searchValue: string;
  arrayIndex?: number;
  itemsArrayRef?: RefObject<Array<HTMLButtonElement | null>>;
  onClick?: () => void;
}

export const AccountItem: React.FC<AccountItemProps> = ({
  account,
  focused,
  onClick = emptyFn,
  arrayIndex,
  itemsArrayRef,
  searchValue
}) => {
  const tezosMainnetChain = useTezosMainnetChain();

  const [accountTezAddress, displayAddress] = useMemo(() => {
    const tezAddress = getAccountAddressForTezos(account);
    const displayAddress = (tezAddress || getAccountAddressForEvm(account))!;

    return [tezAddress, displayAddress];
  }, [account]);

  const elemRef = useScrollIntoView<HTMLButtonElement>(focused, scrollIntoViewOptions);

  const classNameMemo = useMemo(
    () =>
      clsx(
        'block w-full p-2 flex items-center rounded-lg',
        'text-white text-shadow-black overflow-hidden',
        'transition ease-in-out duration-200',
        focused
          ? 'shadow bg-gray-700 bg-opacity-40'
          : 'opacity-65 hover:bg-gray-700 hover:bg-opacity-20 hover:opacity-100'
      ),
    [focused]
  );

  return (
    <Button
      ref={combineRefs(elemRef, el => {
        if (isDefined(arrayIndex) && itemsArrayRef?.current) {
          itemsArrayRef.current[arrayIndex] = el;
        }
      })}
      className={classNameMemo}
      onClick={onClick}
      testID={ShortcutAccountSwitchSelectors.accountItemButton}
      testIDProperties={{ accountTypeEnum: account.type }}
    >
      <Identicon type="bottts" hash={account.id} size={46} className="flex-shrink-0 shadow-xs-white" />

      <div style={{ marginLeft: '10px' }} className="flex flex-col items-start">
        <Name className="text-sm font-medium">
          <SearchHighlightText searchValue={searchValue}>{account.name}</SearchHighlightText>
        </Name>

        <div
          className={clsx(
            'text-xs',
            searchValue === displayAddress ? 'bg-marker-highlight text-gray-900' : 'text-gray-500'
          )}
          {...setTestID(ShortcutAccountSwitchSelectors.accountAddressValue)}
          {...setAnotherSelector('hash', displayAddress)}
        >
          <HashShortView hash={displayAddress} />
        </div>

        <div className="flex flex-wrap items-end">
          {accountTezAddress && (
            <TezosBalance network={tezosMainnetChain} address={accountTezAddress}>
              {bal => (
                <span className="text-xs leading-tight flex items-baseline text-gray-500">
                  <Money smallFractionFont={false} tooltip={false}>
                    {bal}
                  </Money>

                  <span className="ml-1">TEZ</span>
                </span>
              )}
            </TezosBalance>
          )}

          <AccountTypeBadge accountType={account.type} darkTheme />
        </div>
      </div>
    </Button>
  );
};
