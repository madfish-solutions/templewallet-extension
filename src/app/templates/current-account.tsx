import React, { memo } from 'react';

import { useAccount } from 'temple/front/ready';

import { AccountCard } from './account-card';

export const CurrentAccount = memo(() => {
  const account = useAccount();

  return (
    <AccountCard account={account} attractSelf={false} isCurrent={false} showRadioOnHover={false} alwaysShowAddresses />
  );
});
