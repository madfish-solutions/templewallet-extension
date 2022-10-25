import { OperationContentsAndResult, OpKind, OperationContentsAndResultTransaction } from '@taquito/rpc';
import BigNumber from 'bignumber.js';

import * as Repo from 'lib/temple/repo';
import { TzktOperationType } from 'lib/tzkt';

import { ActivityOperation, Activity } from '../activity-new/types';

export const isPositiveNumber = (val: BigNumber.Value) => new BigNumber(val).isGreaterThan(0);

const toTokenId = (contractAddress: string, tokenId: string | number = 0) => `${contractAddress}_${tokenId}`;

export function tryParseTokenTransfers(
  parameters: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) {
  // FA1.2
  try {
    formatFa12(parameters, destination, onTransfer);
  } catch {}

  // FA2
  try {
    formatFa2(parameters, destination, onTransfer);
  } catch {}
}

const formatFa12 = (
  parameters: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) => {
  const { entrypoint, value } = parameters;
  if (entrypoint === 'transfer') {
    let from, to, amount: string | undefined;

    const { args: x } = value;
    if (typeof x[0].string === 'string') {
      from = x[0].string;
    }
    const { args: y } = x[1];
    if (typeof y[0].string === 'string') {
      to = y[0].string;
    }
    if (typeof y[1].int === 'string') {
      amount = y[1].int;
    }

    if (from && to && amount) {
      onTransfer(toTokenId(destination), from, to, amount);
    }
  }
};

const formatFa2 = (
  parameters: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) => {
  const { entrypoint, value } = parameters;
  if (entrypoint !== 'transfer') return;
  for (const { args: x } of value) {
    const from: string | undefined = checkIfVarString(x);
    for (const { args: y } of x[1]) {
      const to = checkIfVarString(y);
      const tokenId = checkDestination(y[1].args[0], destination);
      const amount: string | undefined = checkIfIntString(y[1].args[1]);

      if (from && to && tokenId && amount) {
        onTransfer(tokenId, from, to, amount);
      }
    }
  }
};

const checkIfVarString = (x: any) => (typeof x[0].string === 'string' ? x[0].string : undefined);

const checkIfIntString = (x: any) => (typeof x.int === 'string' ? x.int : undefined);

const checkDestination = (x: any, destination: string) =>
  typeof x.int === 'string' ? toTokenId(destination, x.int) : undefined;

export const mapOperationToActivity = (sourcePkh: string, { hash, addedAt, data }: Repo.IOperation): Activity => {
  return {
    hash,
    addedAt: new Date(addedAt).toISOString(),
    status: 'pending',
    oldestTzktOperation: null,
    operations: data.localGroup
      ? data.localGroup.map(group => mapLocalGroupToActivityOperation(sourcePkh, group, addedAt))
      : data.tzktGroup
      ? data.tzktGroup.map(() => mapTzktGroupToActivityOperation(sourcePkh, addedAt))
      : data.tzktTokenTransfers
      ? data.tzktTokenTransfers.map(() => mapTzktTokenTransferToActivityOperation(sourcePkh, addedAt))
      : []
  };
};

// legacy, thus dont need to have tzkt operation as param
const mapTzktTokenTransferToActivityOperation = (sourcePkh: string, addedAt: number): ActivityOperation => {
  return {
    id: -1,
    level: -1,
    type: 'transaction',
    destination: {
      address: ''
    },
    source: {
      address: sourcePkh
    },
    contractAddress: 'tez',
    status: 'pending',
    amountSigned: '0',
    addedAt: new Date(addedAt).toISOString()
  };
};

// legacy, thus dont need to have tzkt operation as param
const mapTzktGroupToActivityOperation = (sourcePkh: string, addedAt: number): ActivityOperation => {
  return {
    id: -1,
    level: -1,
    type: 'transaction',
    destination: {
      address: ''
    },
    source: {
      address: sourcePkh
    },
    contractAddress: 'tez',
    status: 'pending',
    amountSigned: '0',
    addedAt: new Date(addedAt).toISOString()
  };
};

const mapLocalGroupToActivityOperation = (
  sourcePkh: string,
  operation: OperationContentsAndResult,
  addedAt: number
): ActivityOperation => {
  if (operation.kind === OpKind.TRANSACTION) {
    return mapTransactionOperationToActivityOperation(sourcePkh, operation, addedAt);
  }
  const type: Exclude<TzktOperationType, 'transaction'> =
    operation.kind === OpKind.DELEGATION ? 'delegation' : operation.kind === OpKind.REVEAL ? 'reveal' : 'origination';
  return {
    id: -1,
    level: -1,
    type,
    destination: {
      address: ''
    },
    source: {
      address: sourcePkh
    },
    contractAddress: 'tez',
    status: 'pending',
    amountSigned: '0',
    addedAt: new Date(addedAt).toISOString()
  };
};

const mapTransactionOperationToActivityOperation = (
  sourcePkh: string,
  operation: OperationContentsAndResultTransaction,
  addedAt: number
): ActivityOperation => {
  const type = 'transaction';
  const address = operation.destination;
  const initialAmount = getAmountFromTransactionOperation(operation, sourcePkh);
  const updateOpParams = getAmountAndTokenidFromUpdateOperatorsTzop(operation, initialAmount, sourcePkh);
  const transferOpParams = getAmountAndTokenidFromTransferTzop(operation, updateOpParams);
  const approveOpParams = getAmountAndTokenidFromApproveTzop(operation, transferOpParams, sourcePkh);
  const { amount, tokenId } = approveOpParams;
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
};

interface AmountAndTokenid {
  tokenId: number | undefined;
  amount: string;
}

const getAmountFromTransactionOperation = (
  operation: OperationContentsAndResultTransaction,
  sourcePkh: string
): AmountAndTokenid => ({
  amount: operation.amount !== '0' && operation.destination !== sourcePkh ? `-${operation.amount}` : operation.amount,
  tokenId: undefined
});

const getAmountAndTokenidFromUpdateOperatorsTzop = (
  operation: OperationContentsAndResultTransaction,
  values: AmountAndTokenid,
  sourcePkh: string
): AmountAndTokenid => {
  if (operation.parameters?.entrypoint === 'update_operators') {
    const params = operation.parameters;
    const value = params.value as unknown;
    const outerArg = value && Array.isArray(value) && value.length > 0 && value[0].args ? value[0].args : null;
    const innerArg =
      outerArg && Array.isArray(outerArg) && outerArg.length > 0 && outerArg[0].args ? outerArg[0].args : null;
    const lastArg =
      innerArg && Array.isArray(innerArg) && innerArg.length > 1 && innerArg[1].args ? innerArg[1].args : null;

    if (Array.isArray(lastArg) && lastArg.length > 1 && lastArg[1].int) {
      return {
        tokenId: lastArg[1].int,
        amount: operation.destination !== sourcePkh ? `-${operation.amount}` : operation.amount
      };
    }
  }
  return {
    tokenId: values.tokenId,
    amount: values.amount
  };
};

const getAmountAndTokenidFromTransferTzop = (
  operation: OperationContentsAndResultTransaction,
  values: AmountAndTokenid
): AmountAndTokenid => {
  if (operation.parameters?.entrypoint === 'transfer') {
    const params = operation.parameters;
    const value = params.value as unknown;
    const outerArg = value && Array.isArray(value) && value.length > 0 && value[0].args ? value[0].args : null;
    const innerArg =
      outerArg && Array.isArray(outerArg) && outerArg.length > 1 && outerArg[1].args ? outerArg[0].args : null;
    const lastArg =
      innerArg && Array.isArray(innerArg) && innerArg.length > 1 && innerArg[1].args ? innerArg[1].args : null;

    if (Array.isArray(lastArg) && lastArg.length > 1 && lastArg[0].int && lastArg[1].int) {
      return { tokenId: lastArg[0].int, amount: lastArg[1].int };
    }
  }
  return values;
};

const getAmountAndTokenidFromApproveTzop = (
  operation: OperationContentsAndResultTransaction,
  values: AmountAndTokenid,
  sourcePkh: string
): AmountAndTokenid => {
  if (operation.parameters?.entrypoint === 'approve') {
    return {
      tokenId: 0,
      amount: operation.destination !== sourcePkh ? `-${operation.amount}` : operation.amount
    };
  }
  return values;
};
