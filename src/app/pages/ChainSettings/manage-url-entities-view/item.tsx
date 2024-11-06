import React, { useCallback } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { ShortenedTextWithTooltip } from 'app/templates/shortened-text-with-tooltip';
import { setAnotherSelector } from 'lib/analytics';
import { T, t } from 'lib/i18n';

import { UrlEntityBase } from './types';

interface ManageUrlEntitiesItemProps<T> {
  item: T;
  getEntityUrl: SyncFn<T, string>;
  isActive: boolean;
  onClick: SyncFn<T, void>;
  testID: string;
}

export const ManageUrlEntitiesItem = <T extends UrlEntityBase>({
  item,
  isActive,
  getEntityUrl,
  onClick,
  testID
}: ManageUrlEntitiesItemProps<T>) => {
  const { name, nameI18nKey } = item;
  const handleClick = useCallback(() => onClick(item), [item, onClick]);

  const url = getEntityUrl(item);

  return (
    <SettingsCellSingle
      Component={Button}
      cellName={
        <div className="flex flex-1 flex-col gap-0.5 text-left font-normal truncate">
          <ShortenedTextWithTooltip className="text-font-description">
            {nameI18nKey ? t(nameI18nKey) : name}
          </ShortenedTextWithTooltip>
          <ShortenedTextWithTooltip className="text-font-small text-grey-1">{url}</ShortenedTextWithTooltip>
        </div>
      }
      wrapCellName={false}
      className="hover:bg-secondary-low"
      onClick={handleClick}
      testID={testID}
      {...setAnotherSelector('url', url)}
    >
      <div className="flex items-center gap-3">
        {isActive && (
          <span
            className={clsx(
              'bg-success-low border-0.5 border-success rounded px-1 py-0.5',
              'text-success text-font-small-bold uppercase'
            )}
          >
            <T id="active" />
          </span>
        )}
        <IconBase Icon={ChevronRightIcon} className="text-primary" size={16} />
      </div>
    </SettingsCellSingle>
  );
};
