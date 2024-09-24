import React, { memo } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import { ActivityListContainer, EvmActivityList, TezosActivityList } from 'app/templates/activity';
import { ChainSelectSection, useChainSelectController } from 'app/templates/ChainSelect';

interface Props {
  chainKind: string;
  chainId: string;
}

export const ActivityPage = memo<Props>(({ chainKind, chainId }) => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <PageLayout pageTitle="Activity" dimBg={true}>
      <ChainSelectSection controller={chainSelectController} />

      <ActivityListContainer chainId={network.chainId}>
        {network.kind === 'tezos' ? (
          <TezosActivityList tezosChainId={network.chainId} />
        ) : (
          <EvmActivityList chainId={network.chainId} />
        )}
      </ActivityListContainer>
    </PageLayout>
  );
});
