import React, { memo } from 'react';

import classNames from 'clsx';

import { getAccountBadgeTitle } from 'app/defaults';
import { TempleAccount } from 'lib/temple/types';

type AccountTypeBadgeProps = {
  account: Pick<TempleAccount, 'type'>;
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(({ account, darkTheme = false }) => {
  const title = getAccountBadgeTitle(account);

  const textAndBorderStyle = darkTheme ? 'border-white text-white' : 'border-black text-black';

  return title ? (
    <span
      className={classNames(
        'ml-2',
        'rounded',
        'border border-opacity-25',
        'px-1 py-px',
        'leading-tight',
        'text-opacity-50',
        textAndBorderStyle
      )}
      style={{ fontSize: '0.6rem' }}
    >
      {title.toUpperCase()}
    </span>
  ) : null;
});

export default AccountTypeBadge;
