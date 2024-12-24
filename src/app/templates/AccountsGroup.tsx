import React, { ReactNode } from 'react';

import { Name } from 'app/atoms';
import { StoredAccount } from 'lib/temple/types';

export interface AccountsGroupProps<T = StoredAccount> {
  title: ReactNode;
  accounts: T[];
  children: (account: T) => ReactNode | ReactNode[];
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const AccountsGroup = <T extends unknown = StoredAccount>({
  title,
  accounts,
  children
}: AccountsGroupProps<T>) => (
  <div className="flex flex-col mb-4">
    <Name className="mb-1 p-1 text-font-description-bold">{title}</Name>

    <div className="flex flex-col gap-y-3">{accounts.map(account => children(account))}</div>
  </div>
);
