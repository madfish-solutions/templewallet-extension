import React, { ComponentType, FC, memo } from 'react';

import clsx from 'clsx';

import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName as DefaultAccountName } from 'app/atoms/AccountName';
import { RadioButton } from 'app/atoms/RadioButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';

export interface AccountCardProps {
  account: StoredAccount;
  AccountName?: ComponentType<{ account: StoredAccount; searchValue?: string }>;
  balanceLabel?: string;
  BalanceValue?: ComponentType<{ account: StoredAccount }>;
  customLabelTitle?: string;
  isCurrent: boolean;
  showRadioOnHover?: boolean;
  searchValue?: string;
  attractSelf: boolean;
  onClick?: EmptyFn;
}

export const AccountCard = memo<AccountCardProps>(
  ({
    account,
    customLabelTitle,
    AccountName = DefaultAccountName,
    BalanceValue = DefaultBalanceValue,
    balanceLabel = 'Total Balance:',
    isCurrent,
    attractSelf,
    showRadioOnHover = true,
    searchValue,
    onClick
  }) => {
    const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(isCurrent && attractSelf);

    return (
      <div
        ref={elemRef}
        className={clsx(
          'flex flex-col p-2 gap-y-1.5',
          'rounded-lg shadow-bottom border',
          isCurrent ? 'border-primary' : 'cursor-pointer group border-transparent hover:border-lines'
        )}
        onClick={onClick}
      >
        <div className="flex gap-x-1">
          <AccountAvatar seed={account.id} size={32} borderColor="gray" />

          <AccountName account={account} searchValue={searchValue} />

          <div className="flex-1" />

          <RadioButton
            active={isCurrent}
            className={clsx(!isCurrent && 'opacity-0', !isCurrent && showRadioOnHover && 'group-hover:opacity-100')}
          />
        </div>

        <div className="flex items-center">
          <div className="flex-1 flex flex-col">
            <div className="text-font-small text-grey-1">{balanceLabel}</div>

            <div className="text-font-num-14">
              <BalanceValue account={account} />
            </div>
          </div>

          <AccLabel type={account.type} customTitle={customLabelTitle} />
        </div>
      </div>
    );
  }
);

const DefaultBalanceValue: FC<{ account: StoredAccount }> = ({ account }) => (
  <TotalEquity account={account} currency="fiat" />
);
