import type { Activity } from 'lib/temple/activity-new/utils';
import { TzktOperation } from 'lib/tzkt';

import { isPositiveNumber, tryParseTokenTransfers } from './helpers';
import { OpStackItem, OpStackItemType } from './types';

export function parseOperStack(activity: Activity, address: string) {
  const tzktGroup = activity.tzktOperations;

  const opStack: OpStackItem[] = [];

  if (tzktGroup) estimateTzktGroup(tzktGroup, address, opStack);

  return opStack.sort((a, b) => a.type - b.type);
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
      if (tzktOp.parameter) {
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
  if (!tzktOp.parameter) return;
  let parsed;
  try {
    parsed = tzktOp.parameter;
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
  if (tzktOp.parameter) return;
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
  tokenTransfers: Array<TokenTransfers>,
  tzktOp: TzktOperation,
  address: string,
  opStack: Array<OpStackItem>,
  parsed: any
) => {
  if (tzktOp.type !== 'transaction') return;
  if (!tzktOp.parameter) return;
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

interface TokenTransfers {
  assetId: string;
  from: string;
  to: string;
  amount: string;
}
