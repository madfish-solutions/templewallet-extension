import React, { memo } from 'react';

import { ContentContainer } from 'app/layouts/containers';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';

import { ActivityTabContainer } from './ActivityTabContainer';
import { EvmActivityTab } from './EvmActivityTab';
import { TezosActivityTab } from './TezosActivityTab';

export { TezosActivityTab, EvmActivityTab };

export const MultichainActivityTab = memo(() => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <>
      <div className="h-3" />

      <ContentContainer>
        <ChainSelectSection controller={chainSelectController} />

        <ActivityTabContainer chainId={network.chainId}>
          {network.kind === 'tezos' ? (
            <TezosActivityTab tezosChainId={network.chainId} />
          ) : (
            <EvmActivityTab chainId={network.chainId} />
          )}
        </ActivityTabContainer>
      </ContentContainer>
    </>
  );
});
