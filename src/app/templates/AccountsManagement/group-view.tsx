import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { getPluralKey, t } from 'lib/i18n';
import { Link } from 'lib/woozie';

import { GroupActionsPopper, GroupActionsPopperProps } from './group-actions-popper';
import { AccountsManagementSelectors } from './selectors';

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
      <Link
        to={`/account/${acc.id}`}
        className="flex h-12 items-center justify-between border-t-0.5 border-lines px-3"
        key={acc.id}
        testID={AccountsManagementSelectors.accountItem}
      >
        <div className="flex items-center gap-2">
          <AccountAvatar seed={acc.id} size={24} />

          <div className="text-font-medium-bold leading-5">
            <SearchHighlightText searchValue={searchValue}>{acc.name}</SearchHighlightText>
          </div>
        </div>
        <IconBase Icon={ChevronRightIcon} size={16} className="text-primary" />
      </Link>
    ))}
  </div>
));
