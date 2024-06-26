import React, { memo } from 'react';

import { SyncSpinner } from 'app/atoms';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

import { CollectibleTabSelectors } from '../selectors';

interface EmptySectionProps {
  isSyncing?: boolean;
}

export const EmptySection = memo<EmptySectionProps>(({ isSyncing = false }) =>
  isSyncing ? (
    <SyncSpinner className="mt-6" />
  ) : (
    <div className="border rounded border-gray-200">
      <p className={'text-gray-600 text-center text-xs py-6'} {...setTestID(CollectibleTabSelectors.emptyStateText)}>
        <T id="zeroCollectibleText" />
      </p>
    </div>
  )
);
