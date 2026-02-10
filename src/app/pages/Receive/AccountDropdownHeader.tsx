import React, { memo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { StoredAccount } from 'lib/temple/types';

interface AccountDropdownHeaderProps {
  account: StoredAccount;
  onClick: EmptyFn;
  className?: string;
}

export const AccountDropdownHeader = memo<AccountDropdownHeaderProps>(({ account, className, onClick }) => (
  <div
    className={clsx(
      className,
      'flex items-center gap-x-2 p-3 rounded-lg bg-white hover:bg-grey-4 border-0.5 border-lines cursor-pointer'
    )}
    onClick={onClick}
  >
    <AccountAvatar seed={account.id} size={24} borderColor="secondary" />
    <span className="flex-1 text-font-medium-bold">{account.name}</span>
    <IconBase Icon={CompactDownIcon} size={16} className="text-primary" />
  </div>
));
