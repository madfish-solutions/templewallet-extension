import React, { memo } from 'react';

import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import PageLayout from 'app/layouts/PageLayout';
import { AssetTypesEnum } from 'lib/assets/types';
import { UNDER_DEVELOPMENT_MSG } from 'lib/constants';
import { T } from 'lib/i18n';
import { useAccountAddressForTezos } from 'temple/front';

import { ManageTezosCollectibles } from './ManageCollectibles';
import { ManageTezosTokens } from './ManageTokens';

interface Props {
  assetType: string;
}

const ManageAssets = memo<Props>(({ assetType }) => {
  const ofCollectibles = assetType === AssetTypesEnum.Collectibles;
  const accountTezAddress = useAccountAddressForTezos();

  return (
    <PageLayout
      pageTitle={
        <>
          <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id={ofCollectibles ? 'manageCollectibles' : 'manageTokens'} />
        </>
      }
    >
      {!accountTezAddress ? (
        <div>{UNDER_DEVELOPMENT_MSG}</div>
      ) : ofCollectibles ? (
        <ManageTezosCollectibles publicKeyHash={accountTezAddress} />
      ) : (
        <ManageTezosTokens publicKeyHash={accountTezAddress} />
      )}
    </PageLayout>
  );
});

export default ManageAssets;
