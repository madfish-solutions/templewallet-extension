import { pick } from 'lodash';

import { TempleTzktOperationsGroup, TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { isTezosContractAddress } from 'lib/tezos';
import { TempleChainKind } from 'temple/types';

import {
  TezosActivity,
  ActivityOperKindEnum,
  TezosOperation,
  ActivityStatus,
  ActivityOperTransferType
} from '../types';
import { isTransferActivityOperKind } from '../utils';

import { preparseTezosOperationsGroup } from './pre-parse';

export function parseTezosOperationsGroup(
  operationsGroup: TempleTzktOperationsGroup,
  chainId: string,
  address: string
): TezosActivity {
  const preActivity = preparseTezosOperationsGroup(operationsGroup, address, chainId);

  const { hash, addedAt, operations: preOperations, oldestTzktOperation, status } = preActivity;

  console.log(preOperations);

  const operations = preOperations.map<TezosOperation>(oper => parseTezosPreActivityOperation(oper, address));

  return {
    hash,
    chain: TempleChainKind.Tezos,
    chainId,
    operations,
    operationsCount: preOperations.length,
    addedAt,
    oldestTzktOperation: pick(oldestTzktOperation, ['timestamp', 'level', 'id', 'hash']),
    status:
      status === 'applied'
        ? ActivityStatus.applied
        : status === 'pending'
        ? ActivityStatus.pending
        : ActivityStatus.failed
  };
}

function parseTezosPreActivityOperation(preOperation: TezosPreActivityOperation, address: string): TezosOperation {
  let tokenId: string | undefined;

  const operationBase: TezosOperation = (() => {
    if (preOperation.type === 'transaction') {
      tokenId = preOperation.tokenId;

      if (preOperation.subtype === 'approve' && preOperation.from.address !== address)
        return {
          kind: ActivityOperKindEnum.approve,
          spenderAddress: preOperation.to.at(0)!.address
        };

      // subtype === 'transfer' below

      const fromAddress = preOperation.from.address;
      const toAddress = preOperation.to.at(0)!.address;

      if (preOperation.from.address === address) {
        return {
          kind: ActivityOperKindEnum.transfer,
          type:
            preOperation.to.length === 1 && !isTezosContractAddress(preOperation.to[0].address)
              ? ActivityOperTransferType.sendToAccount
              : ActivityOperTransferType.send,
          fromAddress,
          toAddress
        };
      }

      if (preOperation.to.some(member => member.address === address))
        return {
          kind: ActivityOperKindEnum.transfer,
          type: isTezosContractAddress(preOperation.from.address)
            ? ActivityOperTransferType.receive
            : ActivityOperTransferType.receiveFromAccount,
          fromAddress,
          toAddress
        };

      return {
        kind: ActivityOperKindEnum.interaction,
        withAddress: preOperation.destination.address
      };
    }

    if (preOperation.type === 'delegation' && preOperation.sender.address === address && preOperation.destination) {
      return {
        kind: ActivityOperKindEnum.interaction,
        withAddress: preOperation.destination.address
      };
    }

    return {
      kind: ActivityOperKindEnum.interaction,
      withAddress: preOperation.destination?.address
    };
  })();

  if (isTransferActivityOperKind(operationBase.kind) || operationBase.kind === ActivityOperKindEnum.approve) {
    operationBase.assetSlug = toTezosAssetSlug(preOperation.contract ?? 'tez', tokenId);
    operationBase.amountSigned = preOperation.amountSigned;
  }

  return operationBase;
}
