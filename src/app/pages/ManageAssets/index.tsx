import React, { memo } from 'react';

import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import PageLayout from 'app/layouts/PageLayout';
import { AssetTypesEnum } from 'lib/assets/types';
import { T } from 'lib/i18n';

import { ManageCollectibles } from './ManageCollectibles';
import { ManageTokens } from './ManageTokens';

interface Props {
  assetType: string;
}

const ManageAssets = memo<Props>(({ assetType }) => {
  const ofCollectibles = assetType === AssetTypesEnum.Collectibles;

  return (
    <PageLayout
      pageTitle={
        <>
          <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id={ofCollectibles ? 'manageCollectibles' : 'manageTokens'} />
        </>
      }
    >
      {ofCollectibles ? <ManageCollectibles /> : <ManageTokens />}
    </PageLayout>
  );
});

export default ManageAssets;
