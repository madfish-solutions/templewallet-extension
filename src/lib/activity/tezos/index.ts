import { TezosPreActivity, TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { AssetMetadataBase, getAssetSymbol, isTezosCollectibleMetadata } from 'lib/metadata';
import { TempleChainKind } from 'temple/types';

import { TezosActivity, ActivityKindEnum, TezosOperation, TezosActivityAsset } from '../types';

export { preparseTezosOperationsGroup } from './pre-parse';

export function formatLegacyTezosActivity(
  _activity: TezosPreActivity,
  chainId: string,
  address: string
): TezosActivity {
  const hash = _activity.hash;

  return {
    hash,
    chain: TempleChainKind.Tezos,
    chainId,
    operations: _activity.operations.map<TezosOperation>(oper => parseTezosPreActivityOperation(oper, address))
  };
}

export function parseTezosPreActivityOperation(
  preOperation: TezosPreActivityOperation,
  address: string,
  assetMetadata?: AssetMetadataBase
): TezosOperation {
  let tokenId: string | undefined;

  const operationBase: TezosOperation = (() => {
    if (preOperation.type === 'transaction') {
      tokenId = preOperation.tokenId;

      if (preOperation.subtype === 'approve') return { kind: ActivityKindEnum.approve };

      if (isZero(preOperation.amountSigned))
        return {
          kind: ActivityKindEnum.interaction
          // subkind: OperStackItemTypeEnum.Interaction
          // with: oper.destination.address,
          // entrypoint: oper.entrypoint
        };

      if (preOperation.from.address === address) {
        return {
          kind: ActivityKindEnum.send
          // subkind: OperStackItemTypeEnum.TransferTo
          // to: oper.to.address
        };
      } else if (preOperation.to?.address === address) {
        return {
          kind: ActivityKindEnum.receive
          // subkind: OperStackItemTypeEnum.TransferFrom
          // from: oper.from.address
        };
      }

      return {
        kind: ActivityKindEnum.interaction
        // subkind: OperStackItemTypeEnum.Interaction
      };
    } else if (
      preOperation.type === 'delegation' &&
      preOperation.source.address === address &&
      preOperation.destination
    ) {
      return {
        kind: ActivityKindEnum.interaction
        // subkind: OperStackItemTypeEnum.Delegation
        // to: oper.destination.address
      };
    }

    return {
      kind: ActivityKindEnum.interaction
      // subkind: OperStackItemTypeEnum.Other
    };
  })();

  if (!assetMetadata) return operationBase;

  if (
    operationBase.kind === ActivityKindEnum.send ||
    operationBase.kind === ActivityKindEnum.receive ||
    operationBase.kind === ActivityKindEnum.approve
  ) {
    const asset: TezosActivityAsset = {
      contract: preOperation.contractAddress ?? TEZ_TOKEN_SLUG,
      tokenId,
      amount: preOperation.amountSigned,
      decimals: assetMetadata.decimals,
      nft: isTezosCollectibleMetadata(assetMetadata),
      symbol: getAssetSymbol(assetMetadata, true)
    };

    operationBase.asset = asset;
  }

  return operationBase;
}

const isZero = (val: string) => Number(val) === 0;
