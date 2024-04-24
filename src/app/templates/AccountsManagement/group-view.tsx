import React, { memo } from 'react';

import { Identicon } from 'app/atoms';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { TID, t } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';

import { GroupActionsPopper, GroupActionsPopperProps } from './group-actions-popper';

const typesLabelsI18nKeys: Record<TempleAccountType, TID> = {
  [TempleAccountType.HD]: 'hdAccount',
  [TempleAccountType.Imported]: 'importedPlural',
  [TempleAccountType.Ledger]: 'ledger',
  [TempleAccountType.ManagedKT]: 'managedKTAccount',
  [TempleAccountType.WatchOnly]: 'watchOnlyAccount'
};

export const GroupView = memo<GroupActionsPopperProps>(({ group, ...restProps }) => {
  return (
    <div className="rounded-lg w-full flex flex-col border border-gray-300">
      <div className="p-4 gap-0.5 w-full flex flex-col">
        <div className="w-full flex flex-row justify-between items-center">
          <span className="text-xs font-semibold leading-4">{group.name}</span>
          <GroupActionsPopper group={group} {...restProps} />
        </div>
        <div className="w-full flex flex-row justify-between items-center">
          <span className="text-gray-600 text-xxxs leading-3 font-medium">{t(typesLabelsI18nKeys[group.type])}</span>
          <span className="text-gray-600 text-xs leading-4">{group.accounts.length} Accounts</span>
        </div>
      </div>
      {group.accounts.map(acc => (
        <div
          className="w-full flex flex-row h-12 items-center justify-between border-t-0.5 border-gray-300 px-3"
          key={acc.id}
        >
          {/* TODO: make the element above a link */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex justify-center items-center rounded border border-blue-600">
              <Identicon type="bottts" hash={acc.id} size={20} className="rounded-sm" />
            </div>
            <span className="text-sm leading-5 font-semibold">{acc.name}</span>
          </div>
          <ChevronRightIcon className="h-4 w-auto stroke-2 stroke-current text-orange-20 m-1" />
        </div>
      ))}
    </div>
  );
});
