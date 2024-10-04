import { TempleTzktOperationsGroup, TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { isTezosContractAddress } from 'lib/tezos';
import { TempleChainKind } from 'temple/types';

import { TezosActivity, ActivityOperKindEnum, TezosOperation } from '../types';
import { isTransferActivityOperKind } from '../utils';

import { preparseTezosOperationsGroup } from './pre-parse';

export function parseTezosOperationsGroup(
  operationsGroup: TempleTzktOperationsGroup,
  chainId: string,
  address: string
): TezosActivity {
  const preActivity = preparseTezosOperationsGroup(operationsGroup, address, chainId);

  const { hash, addedAt, operations: preOperations, oldestTzktOperation } = preActivity;

  const operations = preOperations.map<TezosOperation>(oper => parseTezosPreActivityOperation(oper, address));

  return {
    hash,
    chain: TempleChainKind.Tezos,
    chainId,
    operations,
    operationsCount: preOperations.length,
    addedAt,
    oldestTzktOperation
  };
}

function parseTezosPreActivityOperation(preOperation: TezosPreActivityOperation, address: string): TezosOperation {
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

  if (!preOperation.contract) return operationBase;

  if (isTransferActivityOperKind(operationBase.kind) || operationBase.kind === ActivityOperKindEnum.approve) {
    operationBase.assetSlug = toTezosAssetSlug(preOperation.contract, tokenId);
    operationBase.amountSigned = preOperation.amountSigned;
  }

  return operationBase;
}

const isZero = (val: string) => Number(val) === 0;
