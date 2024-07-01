import React, { memo } from 'react';

import { Button, IconBase, SyncSpinner } from 'app/atoms';
import { ReactComponent as AddIcon } from 'app/icons/base/plus_circle.svg';
import { ReactComponent as EmptySearchIcon } from 'app/icons/search_empty.svg';
import { T } from 'lib/i18n';

interface EmptySectionProps {
  isSyncing?: boolean;
}

export const EmptySection = memo<EmptySectionProps>(({ isSyncing = false }) => {
  return isSyncing ? (
    <SyncSpinner className="mt-5" />
  ) : (
    <div className="flex flex-col items-center">
      <div className="mt-5 mb-9 py-7 flex flex-col items-center justify-center text-grey-2">
        <EmptySearchIcon />

        <p className="mt-2 text-center text-font-medium-bold">
          <T id="tokensNotFound" />
        </p>
      </div>
      <Button className="w-fit flex flex-row px-2 py-1 bg-secondary-low rounded-md text-font-description-bold text-secondary">
        <IconBase Icon={AddIcon} size={12} className="stroke-current" />
        <T id="addCustomToken" />
      </Button>
    </div>
  );
});
