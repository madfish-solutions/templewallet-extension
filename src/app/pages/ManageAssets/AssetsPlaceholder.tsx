import React, { memo } from 'react';

import { SyncSpinner } from 'app/atoms';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

import { ManageAssetsSelectors } from './selectors';

interface Props {
  isInSearchMode: boolean;
  ofCollectibles?: boolean;
  isLoading?: boolean;
}

export const AssetsPlaceholder = memo<Props>(({ isInSearchMode, ofCollectibles, isLoading }) => {
  if (isLoading) return <SyncSpinner className="mt-6" />;

  return (
    <div className="my-8 flex flex-col items-center justify-center text-gray-500">
      <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
        {isInSearchMode && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

        <span {...setTestID(ManageAssetsSelectors.emptyStateText)}>
          <T id="noAssetsFound" />
        </span>
      </p>

      <p className="text-center text-xs font-light">
        <T
          id="ifYouDontSeeYourAsset"
          substitutions={[
            <b>
              <T id={ofCollectibles ? 'addCollectible' : 'addToken'} />
            </b>
          ]}
        />
      </p>
    </div>
  );
});
