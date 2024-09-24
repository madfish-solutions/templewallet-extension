import React, { memo, useMemo } from 'react';

import { TezosOperation, parseTezosPreActivityOperation } from 'lib/activity';
import { TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { useTezosAssetMetadata } from 'lib/metadata';

import { ActivityOperationBaseComponent } from './ActivityOperationBase';

interface Props {
  hash: string;
  operation: TezosPreActivityOperation;
  chainId: string;
  networkName: string;
  blockExplorerUrl: string | nullish;
  accountAddress: string;
}

export const TezosActivityOperationComponent = memo<Props>(
  ({ hash, operation: preOperation, chainId, networkName, blockExplorerUrl, accountAddress }) => {
    const assetSlug = preOperation.contract ? toTezosAssetSlug(preOperation.contract, preOperation.tokenId) : '';

    const assetMetadata = useTezosAssetMetadata(assetSlug, chainId);

    const operation = useMemo<TezosOperation>(
      () => parseTezosPreActivityOperation(preOperation, accountAddress, assetMetadata),
      [assetMetadata, preOperation, accountAddress]
    );

    return (
      <ActivityOperationBaseComponent
        kind={operation.kind}
        hash={hash}
        chainId={chainId}
        networkName={networkName}
        asset={operation.asset}
        blockExplorerUrl={blockExplorerUrl ?? undefined}
      />
    );
  }
);
