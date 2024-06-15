import React, { memo } from 'react';

import { SyncSpinner } from 'app/atoms';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

interface EmptySectionProps {
  isSyncing?: boolean;
  searchValueExist?: boolean;
}

export const EmptySection = memo<EmptySectionProps>(({ isSyncing = false, searchValueExist }) =>
  isSyncing ? (
    <SyncSpinner className="mt-6" />
  ) : (
    <div className="my-8 flex flex-col items-center justify-center text-gray-500">
      <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
        {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current fill-current" />}

        <span {...setTestID(HomeSelectors.emptyStateText)}>
          <T id="noAssetsFound" />
        </span>
      </p>

      <p className="text-center text-xs font-light">
        <T
          id="ifYouDontSeeYourAsset"
          substitutions={[
            <b>
              <T id="manage" />
            </b>
          ]}
        />
      </p>
    </div>
  )
);
