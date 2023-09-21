import React, { memo } from 'react';

import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import PageLayout from 'app/layouts/PageLayout';
import { AssetTypesEnum } from 'lib/assets/types';
import { T } from 'lib/i18n';

import { ManageCollectiblesContent } from './ManageCollectibles';
import { ManageTokensContent } from './ManageTokens';

interface Props {
  assetType: string;
}

const ManageAssets = memo<Props>(({ assetType }) => (
  <PageLayout
    pageTitle={
      <>
        <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id={assetType === AssetTypesEnum.Collectibles ? 'manageCollectibles' : 'manageTokens'} />
      </>
    }
  >
    {assetType === AssetTypesEnum.Collectibles ? <ManageCollectiblesContent /> : <ManageTokensContent />}
  </PageLayout>
));

export default ManageAssets;
