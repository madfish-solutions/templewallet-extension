import React, { memo } from 'react';

import type { EvmOperation } from 'lib/activity';
import { EvmChain } from 'temple/front';

import { ActivityOperationBaseComponent } from './ActivityOperationBase';

interface Props {
  hash: string;
  operation: EvmOperation;
  chain: EvmChain;
  networkName: string;
  blockExplorerUrl?: string;
}

export const EvmActivityOperationComponent = memo<Props>(
  ({ hash, operation, chain, networkName, blockExplorerUrl }) => {
    return (
      <ActivityOperationBaseComponent
        kind={operation.kind}
        hash={hash}
        chainId={chain.chainId}
        networkName={networkName}
        asset={operation.asset}
        blockExplorerUrl={blockExplorerUrl}
      />
    );
  }
);
