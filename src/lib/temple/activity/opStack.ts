import { OperationContentsAndResult, OpKind } from '@taquito/rpc';

import { BcdTokenTransfer } from 'lib/better-call-dev';
import * as Repo from 'lib/temple/repo';
import { TzktOperation } from 'lib/tzkt';

import { isPositiveNumber, tryParseTokenTransfers } from './helpers';
import { OpStackItem, OpStackItemType } from './types';

export function parseOpStack(operation: Repo.IOperation, address: string) {
  const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

  const opStack: OpStackItem[] = [];
  const addIfNotExist = (itemToAdd: OpStackItem) => {
    if (opStack.every(item => !isOpStackItemsEqual(item, itemToAdd))) {
      opStack.push(itemToAdd);
    }
  };

  estimateTzktGroup(tzktGroup, address, opStack);
  estimateLocalGroup(localGroup, address, opStack);
  estimateBcdTokenTransfer(bcdTokenTransfers, address, addIfNotExist);

  return opStack.sort((a, b) => a.type - b.type);
}

function isOpStackItemsEqual(a: OpStackItem, b: OpStackItem) {
  switch (a.type) {
    case OpStackItemType.Delegation:
      return a.type === b.type && a.to === b.to;

    case OpStackItemType.Origination:
      return a.type === b.type && a.contract === b.contract;

    case OpStackItemType.Interaction:
      return a.type === b.type && a.with === b.with && a.entrypoint === b.entrypoint;

    case OpStackItemType.TransferFrom:
      return a.type === b.type && a.from === b.from;

    case OpStackItemType.TransferTo:
      return a.type === b.type && a.to === b.to;

    case OpStackItemType.Other:
      return a.type === b.type && a.name === b.name;
  }
}

const estimateTzktGroup = (tzktGroup: TzktOperation[] | undefined, address: string, opStack: OpStackItem[]) => {
  if (!tzktGroup) return;
  /**
   * Tzkt group
   */

  for (const tzktOp of tzktGroup) {
    if (tzktOp.type === 'delegation' && tzktOp.sender.address === address && tzktOp.newDelegate) {
      opStack.push({
        type: OpStackItemType.Delegation,
        to: tzktOp.newDelegate.address
      });
    } else if (tzktOp.type === 'transaction') {
      if (tzktOp.parameters) {
        tryToParseTzktDelegationOp(tzktOp, address, opStack);
      } else if (isPositiveNumber(tzktOp.amount)) {
        addTzktSenderAddress(tzktOp, address, opStack);
      }
    } else {
      opStack.push({
        type: OpStackItemType.Other,
        name: tzktOp.type
      });
    }
  }
};

const tryToParseTzktDelegationOp = (tzktOp: TzktOperation, address: string, opStack: OpStackItem[]) => {
  if (tzktOp.type !== 'transaction') return;
  if (!tzktOp.parameters) return;
  let parsed;
  try {
    parsed = JSON.parse(tzktOp.parameters);
  } catch {}

  if (parsed) {
    const tokenTransfers: TokenTransfers[] = [];
    tryParseTokenTransfers(parsed, tzktOp.target.address, (assetId, from, to, amount) => {
      tokenTransfers.push({ assetId, from, to, amount });
    });

    getTzktTransfers(tokenTransfers, tzktOp, address, opStack, parsed);
  }
};

const addTzktSenderAddress = (tzktOp: TzktOperation, address: string, opStack: OpStackItem[]) => {
  if (tzktOp.type !== 'transaction') return;
  if (tzktOp.parameters) return;
  if (tzktOp.sender.address === address) {
    opStack.push({
      type: OpStackItemType.TransferTo,
      to: tzktOp.target.address
    });
  } else if (tzktOp.target.address === address) {
    opStack.push({
      type: OpStackItemType.TransferFrom,
      from: tzktOp.sender.address
    });
  }
};

const getTzktTransfers = (
  tokenTransfers: TokenTransfers[],
  tzktOp: TzktOperation,
  address: string,
  opStack: OpStackItem[],
  parsed: any
) => {
  if (tzktOp.type !== 'transaction') return;
  if (!tzktOp.parameters) return;
  if (tokenTransfers.length > 0) {
    for (const tt of tokenTransfers) {
      if (tt.from === address) {
        opStack.push({
          type: OpStackItemType.TransferTo,
          to: tt.to
        });
      } else if (tt.to === address) {
        opStack.push({
          type: OpStackItemType.TransferFrom,
          from: tt.from
        });
      }
    }
  } else if (tzktOp.sender.address === address) {
    opStack.push({
      type: OpStackItemType.Interaction,
      with: tzktOp.target.address,
      entrypoint: parsed.entrypoint
    });
  }
};

const estimateBcdTokenTransfer = (
  bcdTokenTransfers: BcdTokenTransfer[] | undefined,
  address: string,
  addIfNotExist: (itemToAdd: OpStackItem) => void
) => {
  if (!bcdTokenTransfers) return;
  /**
   * BCD token transfers
   */

  for (const tokenTrans of bcdTokenTransfers) {
    if (tokenTrans.from === address) {
      addIfNotExist({
        type: OpStackItemType.TransferTo,
        to: tokenTrans.to
      });
    } else if (tokenTrans.to === address) {
      addIfNotExist({
        type: OpStackItemType.TransferFrom,
        from: tokenTrans.from
      });
    }
  }
};

const estimateLocalGroup = (
  localGroup: OperationContentsAndResult[] | undefined,
  address: string,
  opStack: OpStackItem[]
) => {
  if (!localGroup) return;
  /**
   * Local group
   */

  for (const op of localGroup) {
    switch (op.kind) {
      case OpKind.ORIGINATION:
        if (op.source === address) {
          const contract = op?.metadata?.operation_result?.originated_contracts?.[0];
          opStack.push({
            type: OpStackItemType.Origination,
            contract
          });
        }
        break;
      case OpKind.DELEGATION:
        if (op.source === address && op.delegate) {
          opStack.push({
            type: OpStackItemType.Delegation,
            to: op.delegate
          });
        }
        break;
      case OpKind.TRANSACTION:
        if (op.parameters) {
          const tokenTransfers: {
            assetId: string;
            from: string;
            to: string;
            amount: string;
          }[] = [];
          tryParseTokenTransfers(op.parameters, op.destination, (assetId, from, to, amount) => {
            tokenTransfers.push({ assetId, from, to, amount });
          });
          getTokenTransfers(tokenTransfers, op, address, opStack);
        }
        transactionOpCheck(op, address, opStack);
        break;
      default:
        opStack.push({
          type: OpStackItemType.Other,
          name: op.kind
        });
        break;
    }
  }
};

const transactionOpCheck = (op: OperationContentsAndResult, address: string, opStack: OpStackItem[]) => {
  if (op.kind !== OpKind.TRANSACTION) return;
  if (isPositiveNumber(op.amount)) {
    if (op.source === address) {
      opStack.push({
        type: OpStackItemType.TransferTo,
        to: op.destination
      });
    } else if (op.destination === address) {
      opStack.push({
        type: OpStackItemType.TransferFrom,
        from: op.source
      });
    }
  }
};

interface TokenTransfers {
  assetId: string;
  from: string;
  to: string;
  amount: string;
}

const getTokenTransfers = (
  tokenTransfers: TokenTransfers[],
  op: OperationContentsAndResult,
  address: string,
  opStack: OpStackItem[]
) => {
  if (op.kind !== OpKind.TRANSACTION) return;
  if (!op.parameters) return;
  if (tokenTransfers.length > 0) {
    for (const tt of tokenTransfers) {
      if (tt.from === address) {
        opStack.push({
          type: OpStackItemType.TransferTo,
          to: tt.to
        });
      } else if (tt.to === address) {
        opStack.push({
          type: OpStackItemType.TransferFrom,
          from: tt.from
        });
      }
    }
  } else {
    opStack.push({
      type: OpStackItemType.Interaction,
      with: op.destination,
      entrypoint: op.parameters.entrypoint
    });
  }
};
