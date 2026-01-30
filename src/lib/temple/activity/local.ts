import { OperationContentsAndResult, OpKind } from '@tezos-x/octez.js-rpc';

import * as Repo from 'lib/temple/repo';

import { isPositiveNumber, tryParseTokenTransfers } from './helpers';

export async function addLocalOperation(chainId: string, hash: string, localGroup: OperationContentsAndResult[]) {
  const memberSet = new Set<string>();
  const assetIdSet = new Set<string>();

  for (const op of localGroup) {
    // Add sources to members
    switch (op.kind) {
      case OpKind.ACTIVATION:
        memberSet.add(op.pkh);
        break;

      case OpKind.PROPOSALS:
      case OpKind.BALLOT:
      case OpKind.REVEAL:
      case OpKind.TRANSACTION:
      case OpKind.DELEGATION:
      case OpKind.ORIGINATION:
        memberSet.add(op.source);
        break;
    }

    // Add targets to members
    switch (op.kind) {
      case OpKind.TRANSACTION:
        memberSet.add(op.destination);
        break;

      case OpKind.DELEGATION:
        op.delegate && memberSet.add(op.delegate);
        break;
    }

    // Parse asset ids
    if (op.kind === OpKind.ORIGINATION) {
      addTezIfPositive(op.balance, assetIdSet);
    } else if (op.kind === OpKind.TRANSACTION) {
      addTezIfPositive(op.amount, assetIdSet);

      if (op.parameters) {
        tryParseTokenTransfers(op.parameters, op.destination, (assetId, from, to) => {
          memberSet.add(from).add(to);
          assetIdSet.add(assetId);
        });
      }
    }
  }

  const members = Array.from(memberSet);
  const assetIds = Array.from(assetIdSet);

  return Repo.operations.add({
    hash,
    chainId,
    members,
    assetIds,
    addedAt: Date.now(),
    data: {
      localGroup
    }
  });
}

const addTezIfPositive = (x: string, assetSet: Set<string>) => isPositiveNumber(x) && assetSet.add('tez');
