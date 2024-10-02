import { TezosPreActivity, TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { AssetMetadataBase, isTezosCollectibleMetadata } from 'lib/metadata';
import { isTezosContractAddress } from 'lib/tezos';
import { TempleChainKind } from 'temple/types';

import { TezosActivity, ActivityOperKindEnum, TezosOperation, TezosActivityAsset } from '../types';
import { getAssetSymbol, isTransferActivityOperKind } from '../utils';

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
    operations: _activity.operations.map<TezosOperation>(oper => parseTezosPreActivityOperation(oper, address)),
    operationsCount: _activity.operations.length,
    addedAt: _activity.addedAt
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

      if (preOperation.subtype === 'approve') return { kind: ActivityOperKindEnum.approve };

      if (preOperation.subtype !== 'transfer' || isZero(preOperation.amountSigned))
        return {
          kind: ActivityOperKindEnum.interaction
          // with: oper.destination.address,
          // entrypoint: oper.entrypoint
        };

      if (preOperation.from.address === address)
        return {
          kind:
            preOperation.to.length === 1 && !isTezosContractAddress(preOperation.to[0].address)
              ? ActivityOperKindEnum.transferFrom_ToAccount
              : ActivityOperKindEnum.transferFrom
        };

      if (preOperation.to.some(member => member.address === address))
        return {
          kind: isTezosContractAddress(preOperation.from.address)
            ? ActivityOperKindEnum.transferTo
            : ActivityOperKindEnum.transferTo_FromAccount
        };

      return {
        kind: ActivityOperKindEnum.interaction
      };
    }

    if (preOperation.type === 'delegation' && preOperation.sender.address === address && preOperation.destination) {
      return {
        kind: ActivityOperKindEnum.interaction
        // subkind: ActivitySubKindEnum.Delegation
        // to: oper.destination.address
      };
    }

    return {
      kind: ActivityOperKindEnum.interaction
      // subkind: OperStackItemTypeEnum.Other
    };
  })();

  if (!assetMetadata || !preOperation.contract) return operationBase;

  if (isTransferActivityOperKind(operationBase.kind) || operationBase.kind === ActivityOperKindEnum.approve) {
    const asset: TezosActivityAsset = {
      contract: preOperation.contract,
      tokenId,
      amount: preOperation.amountSigned,
      decimals: assetMetadata.decimals,
      nft: isTezosCollectibleMetadata(assetMetadata),
      symbol: getAssetSymbol(assetMetadata)
    };

    operationBase.asset = asset;
  }

  return operationBase;
}

const isZero = (val: string) => Number(val) === 0;
