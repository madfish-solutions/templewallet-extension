import React, { ReactNode } from 'react';

import clsx from 'clsx';

import { Name } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';

export interface AccountsGroupProps<T = StoredAccount> {
  title: ReactNode;
  accounts: T[];
  showGroupType?: boolean;
  children: (account: T) => ReactChildren;
}

export const AccountsGroup = <T extends { type: TempleAccountType } | object = StoredAccount>({
  title,
  accounts,
  showGroupType,
  children
}: AccountsGroupProps<T>) => {
  const firstAccountType = accounts[0] && 'type' in accounts[0] ? accounts[0].type : undefined;

  return (
    <div className={clsx('flex flex-col', showGroupType ? 'mb-6' : 'mb-4')}>
      {showGroupType ? (
        <div className="flex items-center mb-2 justify-between px-0.5">
          <Name className="text-font-description-bold mx-1">{title}</Name>
          {firstAccountType !== undefined && <AccLabel type={firstAccountType} />}
        </div>
      ) : (
        <Name className="mb-1 p-1 text-font-description-bold">{title}</Name>
      )}

      <div className="flex flex-col gap-y-3">{accounts.map(account => children(account))}</div>
    </div>
  );
};
