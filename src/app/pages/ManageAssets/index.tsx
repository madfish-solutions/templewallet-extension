import React, { memo, useCallback } from 'react';

import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { setAssetStatusAction } from 'app/store/assets/actions';
import { AssetTypesEnum } from 'lib/assets/types';
import { t, T } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';

import { ManageCollectibles } from './ManageCollectibles';
import { ManageTokens } from './ManageTokens';

interface Props {
  assetType: string;
}

const ManageAssets = memo<Props>(({ assetType }) => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const confirm = useConfirm();

  const ofCollectibles = assetType === AssetTypesEnum.Collectibles;

  const removeItem = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          title: t(ofCollectibles ? 'deleteCollectibleConfirm' : 'deleteTokenConfirm')
        });

        if (confirmed)
          dispatch(
            setAssetStatusAction({
              isCollectible: ofCollectibles,
              account: publicKeyHash,
              chainId,
              slug,
              status: 'removed'
            })
          );
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [ofCollectibles, chainId, publicKeyHash, confirm]
  );

  const toggleTokenStatus = useCallback(
    (slug: string, toDisable: boolean) =>
      void dispatch(
        setAssetStatusAction({
          isCollectible: ofCollectibles,
          account: publicKeyHash,
          chainId,
          slug,
          status: toDisable ? 'disabled' : 'enabled'
        })
      ),
    [ofCollectibles, chainId, publicKeyHash]
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id={assetType === AssetTypesEnum.Collectibles ? 'manageCollectibles' : 'manageTokens'} />
        </>
      }
    >
      {assetType === AssetTypesEnum.Collectibles ? (
        <ManageCollectibles
          chainId={chainId}
          publicKeyHash={publicKeyHash}
          removeItem={removeItem}
          toggleTokenStatus={toggleTokenStatus}
        />
      ) : (
        <ManageTokens
          chainId={chainId}
          publicKeyHash={publicKeyHash}
          removeItem={removeItem}
          toggleTokenStatus={toggleTokenStatus}
        />
      )}
    </PageLayout>
  );
});

export default ManageAssets;
