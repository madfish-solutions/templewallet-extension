import React, { RefObject, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';

import { Name, Button, HashShortView, Money, Identicon } from 'app/atoms';
import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import Balance from 'app/templates/Balance';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { TempleAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';

import { AccountDropdownSelectors } from './selectors';

interface AccountItemProps {
  account: TempleAccount;
  selected: boolean;
  gasTokenName: string;
  attractSelf: boolean;
  onClick: () => void;
  arrayIndex?: number;
  itemsArrayRef?: RefObject<Array<HTMLButtonElement | null>>;
  className?: string;
}

export const AccountItem: React.FC<AccountItemProps> = ({
  account,
  selected,
  gasTokenName,
  attractSelf,
  onClick,
  arrayIndex,
  itemsArrayRef,
  className
}) => {
  const { name, publicKeyHash, type } = account;

  const elemRef = useScrollIntoViewOnMount<HTMLButtonElement>(selected && attractSelf);

  const classNameMemo = useMemo(
    () =>
      classNames(
        'block w-full p-2 flex items-center',
        'text-white text-shadow-black overflow-hidden',
        'transition ease-in-out duration-200',
        selected && 'shadow',
        selected ? 'bg-gray-700 bg-opacity-40' : 'hover:bg-gray-700 hover:bg-opacity-20',
        !selected && 'opacity-65 hover:opacity-100',
        className
      ),
    [selected, className]
  );

  return (
    <Button
      ref={el => {
        elemRef.current = el;

        if (isDefined(arrayIndex) && itemsArrayRef?.current) {
          itemsArrayRef.current[arrayIndex] = el;
        }
      }}
      className={classNameMemo}
      onClick={onClick}
      testID={AccountDropdownSelectors.accountItemButton}
      testIDProperties={{ accountTypeEnum: type }}
    >
      <Identicon type="bottts" hash={publicKeyHash} size={46} className="flex-shrink-0 shadow-xs-white" />

      <div style={{ marginLeft: '10px' }} className="flex flex-col items-start">
        <Name className="text-sm font-medium">{name}</Name>

        <div
          className="text-xs text-gray-500"
          {...setTestID(AccountDropdownSelectors.accountAddressValue)}
          {...setAnotherSelector('hash', publicKeyHash)}
        >
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
