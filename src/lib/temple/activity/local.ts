import { OperationContentsAndResult, OpKind } from '@taquito/rpc';

import * as Repo from 'lib/temple/repo';
import { TzktOperationType } from 'lib/tzkt';

import { Activity } from '../activity-new';
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

export async function removeLocalOperation(hash: string) {
  return Repo.operations.delete(hash);
}

export async function getLocalOperation(chainId: string, sourcePkh: string): Promise<Array<Activity>> {
  const operations = await Repo.operations.where({ chainId }).toArray();
  return operations.map(({ hash, addedAt, data }) => {
    return {
      hash,
      addedAt: new Date(addedAt).toISOString(),
      status: 'pending',
      oldestTzktOperation: null,
      operations: data.localGroup
        ? data.localGroup.map(operation => {
            let address: string | undefined;
            let tokenId: number | undefined;
            let amount = '0';

            if (operation.kind === OpKind.TRANSACTION) {
              const type = 'transaction';
              address = operation.destination;
              if (operation.amount !== '0') {
                amount = operation.destination !== sourcePkh ? `-${operation.amount}` : operation.amount;
              }
              if (operation.parameters?.entrypoint === 'update_operators') {
                const params = operation.parameters;
                const value = params.value as unknown;
                const outerArg =
                  value && Array.isArray(value) && value.length > 0 && value[0].args ? value[0].args : null;
                const innerArg =
                  outerArg && Array.isArray(outerArg) && outerArg.length > 0 && outerArg[0].args
                    ? outerArg[0].args
                    : null;
                const lastArg =
                  innerArg && Array.isArray(innerArg) && innerArg.length > 1 && innerArg[1].args
                    ? innerArg[1].args
                    : null;

                if (Array.isArray(lastArg) && lastArg.length > 1 && lastArg[1].int) {
                  tokenId = lastArg[1].int;
                  amount = operation.destination !== sourcePkh ? `-${operation.amount}` : operation.amount;
                }
              }
              if (operation.parameters?.entrypoint === 'transfer') {
                const params = operation.parameters;
                const value = params.value as unknown;
                const outerArg =
                  value && Array.isArray(value) && value.length > 0 && value[0].args ? value[0].args : null;
                const innerArg =
                  outerArg && Array.isArray(outerArg) && outerArg.length > 1 && outerArg[1].args
                    ? outerArg[0].args
                    : null;
                const lastArg =
                  innerArg && Array.isArray(innerArg) && innerArg.length > 1 && innerArg[1].args
                    ? innerArg[1].args
                    : null;

                if (Array.isArray(lastArg) && lastArg.length > 1 && lastArg[0].int && lastArg[1].int) {
                  tokenId = lastArg[0].int;
                  amount = lastArg[1].int;
                }
              }
              if (operation.parameters?.entrypoint === 'approve') {
                tokenId = 0;
                amount = operation.destination !== sourcePkh ? `-${operation.amount}` : operation.amount;
              }
              return {
                id: -1,
                level: -1,
                type,
                destination: {
                  address: address ?? ''
                },
                source: {
                  address: sourcePkh
                },
                contractAddress: address,
                status: 'pending',
                amountSigned: amount,
                addedAt: new Date(addedAt).toISOString(),
                entrypoint: operation.parameters?.entrypoint ?? 'transfer',
                tokenId: (tokenId ?? 0).toString()
              };
            } else {
              const type: Exclude<TzktOperationType, 'transaction'> =
                operation.kind === OpKind.DELEGATION
                  ? 'delegation'
                  : operation.kind === OpKind.REVEAL
                  ? 'reveal'
                  : 'origination';
              return {
                id: -1,
                level: -1,
                type,
                destination: {
                  address: address ?? ''
                },
                source: {
                  address: sourcePkh
                },
                contractAddress: address,
                status: 'pending',
                amountSigned: amount,
                addedAt: new Date(addedAt).toISOString()
              };
            }
          })
        : []
    };
  });
}

const addTezIfPositive = (x: string, assetSet: Set<string>) => isPositiveNumber(x) && assetSet.add('tez');
