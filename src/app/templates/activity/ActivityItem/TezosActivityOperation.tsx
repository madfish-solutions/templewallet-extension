import React, { memo, useMemo } from 'react';

import { TezosOperation, parseTezosPreActivityOperation } from 'lib/activity';
import { TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { useTezosAssetMetadata } from 'lib/metadata';
import { TezosChain } from 'temple/front';

import { ActivityOperationBaseComponent } from './ActivityOperationBase';

interface Props {
  hash: string;
  operation: TezosPreActivityOperation;
  chain: TezosChain;
  networkName: string;
  blockExplorerUrl: string | nullish;
  accountAddress: string;
}

export const TezosActivityOperationComponent = memo<Props>(
  ({ hash, operation: preOperation, chain, networkName, blockExplorerUrl, accountAddress }) => {
    const assetSlug =
      preOperation.type === 'transaction'
        ? toTezosAssetSlug(preOperation.contractAddress ?? TEZ_TOKEN_SLUG, preOperation.tokenId)
        : '';

    const assetMetadata = useTezosAssetMetadata(assetSlug, chain.chainId);

    const operation = useMemo<TezosOperation>(
      () => parseTezosPreActivityOperation(preOperation, accountAddress, assetMetadata),
      [assetMetadata, preOperation, accountAddress]
    );

    return (
      <ActivityOperationBaseComponent
        kind={operation.kind}
        hash={hash}
        chainId={chain.chainId}
        networkName={networkName}
        asset={operation.asset}
        blockExplorerUrl={blockExplorerUrl ?? undefined}
      />
    );
  }
);
