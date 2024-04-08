import React, { FC, memo } from 'react';

import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import { ContentContainer } from 'app/layouts/ContentContainer';
import PageLayout from 'app/layouts/PageLayout';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import { AssetTypesEnum } from 'lib/assets/types';
import { T } from 'lib/i18n';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
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
        <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
      ) : (
        <ManageAssetsForChain ofCollectibles={ofCollectibles} accountTezAddress={accountTezAddress} />
      )}
    </PageLayout>
  );
});

interface ManageAssetsForChainProps {
  ofCollectibles: boolean;
  accountTezAddress: string;
}

const ManageAssetsForChain: FC<ManageAssetsForChainProps> = ({ ofCollectibles, accountTezAddress }) => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <ContentContainer className="mb-6">
      <ChainSelectSection controller={chainSelectController} />

      {network.chain !== 'tezos' ? (
        <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
      ) : ofCollectibles ? (
        <ManageTezosCollectibles network={network} publicKeyHash={accountTezAddress} />
      ) : (
        <ManageTezosTokens tezosChainId={network.chainId} publicKeyHash={accountTezAddress} />
      )}
    </ContentContainer>
  );
};

export default ManageAssets;
