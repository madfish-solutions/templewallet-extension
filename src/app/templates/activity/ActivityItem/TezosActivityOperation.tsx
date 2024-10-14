import React, { memo, useMemo } from 'react';

import { ActivityOperKindEnum, TezosOperation } from 'lib/activity';
import { ActivityStatus } from 'lib/activity/types';
import { fromAssetSlug } from 'lib/assets';
import { AssetMetadataBase, isTezosCollectibleMetadata, useTezosAssetMetadata } from 'lib/metadata';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';
import { OperAddressChip } from './AddressChip';

interface Props {
  hash: string;
  operation?: TezosOperation;
  chainId: string;
  status?: ActivityStatus;
  blockExplorerUrl: string | nullish;
  withoutAssetIcon?: boolean;
  withoutOperHashChip?: boolean;
}

export const TezosActivityOperationComponent = memo<Props>(
  ({ hash, operation, chainId, blockExplorerUrl, status, withoutAssetIcon, withoutOperHashChip }) => {
    const assetSlug = operation?.assetSlug;
    const assetMetadata = useTezosAssetMetadata(assetSlug ?? '', chainId);

    const asset = useMemo(
      () => (assetSlug ? buildTezosOperationAsset(assetSlug, assetMetadata, operation.amountSigned) : undefined),
      [assetMetadata, operation, assetSlug]
    );

    const addressChip = useMemo(
      () => (withoutOperHashChip && operation ? <OperAddressChip operation={operation} /> : null),
      [operation, withoutOperHashChip]
    );

    return (
      <ActivityOperationBaseComponent
        kind={operation?.kind ?? ActivityOperKindEnum.interaction}
        hash={hash}
        chainId={chainId}
        asset={asset}
        status={status}
        blockExplorerUrl={blockExplorerUrl ?? undefined}
        withoutAssetIcon={withoutAssetIcon}
        addressChip={addressChip}
      />
    );
  }
);

export function buildTezosOperationAsset(
  assetSlug: string,
  assetMetadata: AssetMetadataBase | undefined,
  amountSigned: string | nullish
): ActivityItemBaseAssetProp | undefined {
  const [contract, tokenId] = fromAssetSlug(assetSlug);

  const decimals = amountSigned === null ? NaN : assetMetadata?.decimals;
  if (decimals == null) return;

  return {
    contract,
    tokenId,
    amountSigned,
    decimals,
    // nft: isTezosCollectibleMetadata(assetMetadata),
    symbol: assetMetadata?.symbol,
    nft: assetMetadata ? isTezosCollectibleMetadata(assetMetadata) : undefined
  };
}
