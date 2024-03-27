import React, { memo } from 'react';

import clsx from 'clsx';

import { getAccountBadgeTitle } from 'app/defaults';
import { TempleAccount } from 'lib/temple/types';

type AccountTypeBadgeProps = {
  account: Pick<TempleAccount, 'type'>;
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(({ account, darkTheme = false }) => {
  const title = getAccountBadgeTitle(account);

  return title ? (
    <span
      className={clsx(
        'rounded border px-1 py-px ml-2 leading-none font-medium',
        darkTheme ? 'border-gray-500 text-gray-500' : 'border-black text-black'
      )}
      style={{ fontSize: '0.44rem' }}
    >
      {title.toUpperCase()}
    </span>
  ) : null;
});

export default AccountTypeBadge;
