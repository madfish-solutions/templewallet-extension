import React, { memo } from 'react';

import { Identicon } from 'app/atoms';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { TID, t } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { Link } from 'lib/woozie';

import { GroupActionsPopper, GroupActionsPopperProps } from './group-actions-popper';

const typesLabelsI18nKeys: Record<TempleAccountType, TID> = {
  [TempleAccountType.HD]: 'hdAccount',
  [TempleAccountType.Imported]: 'importedPlural',
  [TempleAccountType.Ledger]: 'ledger',
  [TempleAccountType.ManagedKT]: 'managedKTAccount',
  [TempleAccountType.WatchOnly]: 'watchOnlyAccount'
};

interface GroupViewProps extends GroupActionsPopperProps {
  searchValue: string;
}

export const GroupView = memo<GroupViewProps>(({ group, searchValue, ...restProps }) => (
  <div className="rounded-lg w-full flex flex-col border border-gray-300">
    <div className="p-4 gap-0.5 w-full flex flex-col">
      <div className="w-full flex flex-row justify-between items-center">
        <span className="text-font-description-bold">{group.name}</span>
        <GroupActionsPopper group={group} {...restProps} />
      </div>

      <div className="w-full flex flex-row justify-between items-center">
        <span className="text-gray-600 text-font-small font-medium">{t(typesLabelsI18nKeys[group.type])}</span>
        <span className="text-gray-600 text-font-description">{group.accounts.length} Accounts</span>
      </div>
    </div>

    {group.accounts.map(acc => (
      <Link
        to={`/account/${acc.id}`}
        className="w-full flex flex-row h-12 items-center justify-between border-t-0.5 border-gray-300 px-3"
        key={acc.id}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex justify-center items-center rounded border border-blue-600">
            <Identicon type="bottts" hash={acc.id} size={20} className="rounded-sm" />
          </div>

          <div className="text-font-medium-bold leading-5">
            <SearchHighlightText searchValue={searchValue}>{acc.name}</SearchHighlightText>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-auto stroke-2 stroke-current text-orange-20 m-1" />
      </Link>
    ))}
  </div>
));
