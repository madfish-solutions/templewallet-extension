import React, { memo, useMemo } from 'react';

import { ActivityOperKindEnum, TezosOperation } from 'lib/activity';
import { fromAssetSlug } from 'lib/assets';
import { AssetMetadataBase, getAssetSymbol, useTezosAssetMetadata } from 'lib/metadata';

import { ActivityItemBaseAssetProp, ActivityOperationBaseComponent } from './ActivityOperationBase';

interface Props {
  hash: string;
  operation?: TezosOperation;
  chainId: string;
  networkName: string;
  blockExplorerUrl: string | nullish;
  withoutAssetIcon?: boolean;
}

export const TezosActivityOperationComponent = memo<Props>(
  ({ hash, operation, chainId, networkName, blockExplorerUrl, withoutAssetIcon }) => {
    const assetSlug = operation?.assetSlug;
    const assetMetadata = useTezosAssetMetadata(assetSlug ?? '', chainId);

    const asset = useMemo(
      () =>
        assetSlug && assetMetadata
          ? buildTezosOperationAsset(assetSlug, assetMetadata, operation.amountSigned)
          : undefined,
      [assetMetadata, operation, assetSlug]
    );

    return (
      <ActivityOperationBaseComponent
        kind={operation?.kind ?? ActivityOperKindEnum.interaction}
        hash={hash}
        chainId={chainId}
        networkName={networkName}
        asset={asset}
        blockExplorerUrl={blockExplorerUrl ?? undefined}
        withoutAssetIcon={withoutAssetIcon}
      />
    );
  }
);

export function buildTezosOperationAsset(
  assetSlug: string,
  assetMetadata: AssetMetadataBase,
  amount: string | nullish
): ActivityItemBaseAssetProp {
  const [contract, tokenId] = fromAssetSlug(assetSlug);

  return {
    contract,
    tokenId,
    amount,
    decimals: assetMetadata.decimals,
    // nft: isTezosCollectibleMetadata(assetMetadata),
    symbol: getAssetSymbol(assetMetadata)
  };
}
