import React, { memo, useMemo } from 'react';

import { ActivityKindEnum, TezosActivityAsset, TezosOperation, formatLegacyTezosOperation } from 'lib/activity';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { getAssetSymbol, isTezosCollectibleMetadata, useTezosAssetMetadata } from 'lib/metadata';
import { ActivityOperation as LegacyActivityOperation } from 'lib/temple/activity-new/types';
import { TezosChain } from 'temple/front';

import { ActivityOperationBaseComponent } from './ActivityOperationBase';

interface Props {
  hash: string;
  operation: LegacyActivityOperation;
  chain: TezosChain;
  networkName: string;
  blockExplorerUrl: string | nullish;
  accountAddress: string;
}

export const TezosActivityOperationComponent = memo<Props>(
  ({ hash, operation: legacyOperation, chain, networkName, blockExplorerUrl, accountAddress }) => {
    const assetSlug =
      legacyOperation.type === 'transaction'
        ? toTezosAssetSlug(legacyOperation.contractAddress ?? TEZ_TOKEN_SLUG, legacyOperation.tokenId)
        : '';

    const assetMetadata = useTezosAssetMetadata(assetSlug, chain.chainId);

    const operation = useMemo<TezosOperation>(() => {
      const operation = formatLegacyTezosOperation(legacyOperation, accountAddress);

      if (!assetMetadata) return operation;

      if (operation.kind === ActivityKindEnum.send || operation.kind === ActivityKindEnum.receive) {
        const asset: TezosActivityAsset = {
          contract: legacyOperation.contractAddress ?? TEZ_TOKEN_SLUG,
          // @ts-expect-error
          tokenId: legacyOperation.tokenId,
          amount: legacyOperation.amountSigned,
          decimals: assetMetadata.decimals,
          nft: isTezosCollectibleMetadata(assetMetadata),
          symbol: getAssetSymbol(assetMetadata, true)
        };

        operation.asset = asset;
      }

      return operation;
    }, [assetMetadata, legacyOperation, accountAddress]);

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
