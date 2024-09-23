import React, { memo } from 'react';

import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { useAccount } from 'temple/front/ready';

export const CurrentAccount = memo(() => {
  const account = useAccount();

  return (
    <div className="flex flex-col p-2 gap-y-1.5 rounded-lg shadow-bottom border border-transparent">
      <div className="flex gap-x-1">
        <AccountAvatar seed={account.id} size={32} borderColor="gray" />

        <AccountName account={account} smaller />
      </div>

      <div className="flex items-center">
        <div className="flex-1 flex flex-col">
          <div className="text-font-small text-grey-1">Total Balance:</div>

          <div className="text-font-num-14">
            <TotalEquity account={account} currency="fiat" />
          </div>
        </div>

        <AccLabel type={account.type} />
      </div>
    </div>
  );
});
