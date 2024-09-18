import React, { memo } from 'react';

import { Identicon } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { AccountName } from 'app/atoms/AccountName';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { useAccount } from 'temple/front/ready';

export const CurrentAccount = memo(() => {
  const account = useAccount();

  return (
    <div className="flex flex-col p-2 gap-y-1.5 rounded-lg shadow-bottom border border-transparent">
      <div className="flex gap-x-1">
        <div className="flex p-px rounded-md border border-grey-3">
          <Identicon type="bottts" hash={account.id} size={28} className="rounded-sm" />
        </div>

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
