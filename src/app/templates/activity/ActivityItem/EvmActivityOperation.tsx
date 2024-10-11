import React, { memo, useMemo } from 'react';

import { ActivityOperKindEnum, type EvmOperation } from 'lib/activity';
import { ActivityStatus } from 'lib/activity/types';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { useEvmAssetMetadata } from 'lib/metadata';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';

interface Props {
  hash: string;
  operation?: EvmOperation;
  chainId: number;
  blockExplorerUrl?: string;
  status?: ActivityStatus;
  withoutAssetIcon?: boolean;
}

export const EvmActivityOperationComponent = memo<Props>(
  ({ hash, operation, chainId, blockExplorerUrl, status, withoutAssetIcon }) => {
    const assetBase = operation?.asset;
    const assetSlug = assetBase?.contract ? toEvmAssetSlug(assetBase.contract) : undefined;

    const assetMetadata = useEvmAssetMetadata(assetSlug ?? '', chainId);

    const asset = useMemo(() => {
      if (!assetBase) return;

      const decimals = assetBase.amountSigned === null ? NaN : assetMetadata?.decimals ?? assetBase.decimals;

      if (decimals == null) return;

      const symbol = assetMetadata?.symbol || assetBase.symbol;

      const asset: ActivityItemBaseAssetProp = {
        ...assetBase,
        decimals,
        symbol
      };

      return asset;
    }, [assetMetadata, assetBase]);

    return (
      <ActivityOperationBaseComponent
        kind={operation?.kind ?? ActivityOperKindEnum.interaction}
        hash={hash}
        chainId={chainId}
        asset={asset}
        blockExplorerUrl={blockExplorerUrl}
        status={status}
        withoutAssetIcon={withoutAssetIcon}
      />
    );
  }
);
