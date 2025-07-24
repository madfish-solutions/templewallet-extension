import React, { memo, useCallback } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as CleanIcon } from 'app/icons/base/x_circle_fill.svg';
import { DappEnum } from 'lib/apis/temple/endpoints/get-dapps-list';
import { t, TID } from 'lib/i18n';

interface TagProps {
  name: DappEnum;
  onClick: SyncFn<DappEnum>;
  selected: boolean;
}

export const Tag = memo<TagProps>(({ name, onClick, selected }) => {
  const handleClick = useCallback(() => onClick(name), [onClick, name]);

  return (
    <Button
      className={clsx(
        'inline-flex items-center rounded-6 px-2 py-1 bg-grey-4',
        'border-0.5 border-lines text-font-description hover:text-secondary',
        'transition-all duration-300 ease-in-out',
        selected && 'bg-secondary text-white hover:text-white'
      )}
      onClick={handleClick}
    >
      <span className="whitespace-nowrap">{t(name.toLowerCase() as TID) || name}</span>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          selected ? 'w-4 ml-1 opacity-100' : 'w-0 opacity-0'
        )}
      >
        {selected && <IconBase Icon={CleanIcon} size={12} className="text-white" />}
      </div>
    </Button>
  );
});
