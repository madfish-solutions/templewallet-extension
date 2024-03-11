import React, { memo } from 'react';

import clsx from 'clsx';

import { getAccountBadgeTitle } from 'app/defaults';
import { TempleAccountType } from 'lib/temple/types';

type AccountTypeBadgeProps = {
  accountType: TempleAccountType;
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(({ accountType, darkTheme = false }) => {
  const title = getAccountBadgeTitle(accountType);

  return title ? (
    <span
      className={clsx(
        'rounded border px-1 py-px ml-2 leading-none text-xxxxs font-medium',
        darkTheme ? 'border-gray-500 text-gray-500' : 'border-black text-black'
      )}
      style={{ fontSize: '0.6rem' }}
    >
      {title.toUpperCase()}
    </span>
  ) : null;
});

export default AccountTypeBadge;
