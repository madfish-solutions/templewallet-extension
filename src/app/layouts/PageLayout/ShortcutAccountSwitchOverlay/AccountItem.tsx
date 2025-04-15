import React from 'react';

import clsx from 'clsx';

import { Name, Button } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { T } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';

import { ShortcutAccountSwitchSelectors } from './selectors';

const scrollIntoViewOptions: ScrollIntoViewOptions = { block: 'end', behavior: 'smooth' };

interface AccountItemProps {
  account: StoredAccount;
  focused: boolean;
  selected: boolean;
  onAccountSelect: (accountId: string) => void;
}

const baseRowClasses = clsx(
  'block w-full p-2 flex items-center rounded-lg',
  'shadow-bottom overflow-hidden transition ease-in-out duration-200',
  'border hover:border-lines'
);

const getRowClassName = (selected: boolean, focused: boolean) =>
  clsx(
    baseRowClasses,
    selected && 'shadow-none bg-secondary-low hover:border-transparent',
    focused ? 'border-lines' : 'border-transparent',
    selected && focused && 'border-transparent'
  );

export const AccountItem: React.FC<AccountItemProps> = ({ account, focused, selected, onAccountSelect }) => {
  const elemRef = useScrollIntoView<HTMLButtonElement>(selected, scrollIntoViewOptions);

  return (
    <Button
      ref={elemRef}
      className={getRowClassName(selected, focused)}
      onClick={() => onAccountSelect(account.id)}
      testID={ShortcutAccountSwitchSelectors.accountItemButton}
      testIDProperties={{ accountTypeEnum: account.type }}
    >
      <div className="flex flex-1 flex-row justify-between items-center">
        <div className="flex items-center flex-row gap-x-2">
          <AccountAvatar seed={account.id} size={32} borderColor="gray" />
          <Name className="text-font-medium-bold">{account.name}</Name>
        </div>

        <div className="flex flex-col justify-end">
          <div className="text-font-small text-grey-1">
            <T id={'totalBalance'} />
          </div>

          <div className="text-font-num-12 text-right">
            <TotalEquity account={account} currency="fiat" />
          </div>
        </div>
      </div>
    </Button>
  );
};
