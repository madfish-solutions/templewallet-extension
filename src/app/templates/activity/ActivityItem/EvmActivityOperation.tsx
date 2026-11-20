import React, { memo, useMemo } from 'react';

import { ActivityOperKindEnum, EvmOperation, ActivityStatus, EvmActivityAsset } from 'lib/activity';
import { isBridgeOperation } from 'lib/activity/utils';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { useEvmGenericAssetMetadata } from 'lib/metadata';
import { EvmAssetMetadata } from 'lib/metadata/types';
import { BasicEvmChain } from 'temple/front/chains';

import { getActivityOperTransferType } from '../utils';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';
import { OperAddressChip } from './AddressChip';

interface Props {
  hash: string;
  operation?: EvmOperation;
  chain: BasicEvmChain;
  blockExplorerUrl?: string;
  status?: ActivityStatus;
  withoutAssetIcon?: boolean;
  withoutOperHashChip?: boolean;
}

export const EvmActivityOperationComponent = memo<Props>(
  ({ hash, operation, chain, blockExplorerUrl, status, withoutAssetIcon, withoutOperHashChip }) => {
    const assetBase = operation?.asset;
    const assetSlug = assetBase?.contract ? toEvmAssetSlug(assetBase.contract, assetBase.tokenId) : undefined;

    const assetMetadata = useEvmGenericAssetMetadata(assetSlug ?? '', chain.chainId);

    const asset = useMemo(
      () => (assetBase ? buildEvmOperationAsset(assetBase, assetMetadata) : undefined),
      [assetMetadata, assetBase]
    );

    const addressChip = useMemo(
      () => (withoutOperHashChip && operation ? <OperAddressChip operation={operation} /> : null),
      [operation, withoutOperHashChip]
    );

    return (
      <ActivityOperationBaseComponent
        kind={operation?.kind ?? ActivityOperKindEnum.interaction}
        transferType={getActivityOperTransferType(operation)}
        hash={hash}
        chain={chain}
        asset={asset}
        blockExplorerUrl={blockExplorerUrl}
        status={status}
        withoutAssetIcon={withoutAssetIcon}
        isBridge={isBridgeOperation(operation)}
        addressChip={addressChip}
      />
    );
  }
);

export function buildEvmOperationAsset(
  assetBase: EvmActivityAsset,
  assetMetadata: EvmAssetMetadata | undefined
): ActivityItemBaseAssetProp | undefined {
  const decimals = assetBase.amountSigned === null ? NaN : (assetMetadata?.decimals ?? assetBase.decimals);

  if (decimals == null) return;

  return { ...assetBase, decimals, symbol: assetMetadata?.symbol || assetBase.symbol };
}
