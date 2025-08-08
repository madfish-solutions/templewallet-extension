import React, { memo } from 'react';

import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { getPluralKey, t } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { Link } from 'lib/woozie';

import { CopyAccountAddresses } from '../copy-account-addresses';

import { GroupActionsPopper, GroupActionsPopperProps } from './group-actions-popper';
import { AccountManagementSelectors } from './selectors';

interface GroupViewProps extends GroupActionsPopperProps {
  searchValue: string;
}

export const GroupView = memo<GroupViewProps>(({ group, searchValue, ...restProps }) => (
  <div className="shadow-bottom rounded-lg flex flex-col bg-white">
    <div className="p-3 gap-0.5 flex flex-col">
      <div className="flex flex-row justify-between items-center">
        <span className="text-font-description-bold">{group.name}</span>
        <GroupActionsPopper group={group} {...restProps} />
      </div>

      <div className="flex flex-row justify-between items-center">
        <AccLabel type={group.type} />
        <span className="text-grey-1 text-font-description capitalize">
          {t(getPluralKey('accounts', group.accounts.length), String(group.accounts.length))}
        </span>
      </div>
    </div>

    {group.accounts.map(acc => (
      <AccountView key={acc.id} account={acc} searchValue={searchValue} />
    ))}
  </div>
));

interface AccountViewProps {
  account: StoredAccount;
  searchValue: string;
}

const AccountView = memo<AccountViewProps>(({ account, searchValue }) => {
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  return (
    <Link
      to={`/account/${account.id}`}
      className="flex p-3 items-center justify-between border-t-0.5 border-lines"
      key={account.id}
      testID={AccountManagementSelectors.accountItem}
      onMouseEnter={handleHover}
      onMouseLeave={handleUnhover}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <AccountAvatar borderColor="gray" seed={account.id} size={24} />

          <div className="text-font-medium-bold">
            <SearchHighlightText searchValue={searchValue}>{account.name}</SearchHighlightText>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CopyAccountAddresses account={account} />
        </div>
      </div>

      <AnimatedMenuChevron ref={animatedChevronRef} />
    </Link>
  );
});
