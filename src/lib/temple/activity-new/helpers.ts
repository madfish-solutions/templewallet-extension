import BigNumber from 'bignumber.js';

import type { Activity } from 'lib/temple/activity-new';

import { OperStackItem, OperStackItemType } from './types';

function isZero(val: BigNumber.Value) {
  return new BigNumber(val).isZero();
}

function toTokenSlug(contractAddress: string, tokenId: string | number = 0) {
  return `${contractAddress}_${tokenId}`;
}

export function parseOperStack(activity: Activity, address: string) {
  const opStack: OperStackItem[] = [];

  for (const oper of activity.operations) {
    if (oper.type === 'transaction') {
      if (isZero(oper.amountSigned)) {
        opStack.push({
          type: OperStackItemType.Interaction,
          with: oper.destination.address,
          entrypoint: oper.entrypoint
        });
      } else if (oper.source.address === address) {
        opStack.push({
          type: OperStackItemType.TransferTo,
          to: oper.destination.address
        });
      } else if (oper.destination.address === address) {
        opStack.push({
          type: OperStackItemType.TransferFrom,
          from: oper.source.address
        });
      }
    } else if (oper.type === 'delegation' && oper.source.address === address && oper.destination) {
      opStack.push({
        type: OperStackItemType.Delegation,
        to: oper.destination.address
      });
    } else {
      opStack.push({
        type: OperStackItemType.Other,
        name: oper.type
      });
    }
  }

  return opStack.sort((a, b) => a.type - b.type);
}

interface MoneyDiff {
  assetSlug: string;
  diff: string;
}

export function parseMoneyDiffs(activity: Activity) {
  const diffsMap: Record<string, BigNumber> = {};

  for (const oper of activity.operations) {
    if (oper.type !== 'transaction' || oper.status !== 'applied' || isZero(oper.amountSigned)) continue;
    const assetSlug = oper.contractAddress == null ? 'tez' : toTokenSlug(oper.contractAddress, oper.tokenId);
    diffsMap[assetSlug] = new BigNumber(oper.amountSigned).plus(diffsMap[assetSlug] || 0);
  }

  const diffs: MoneyDiff[] = [];
  for (const assetSlug of Object.keys(diffsMap)) {
    const diff = diffsMap[assetSlug]!.toFixed();
    diffs.push({
      assetSlug,
      diff
    });
  }

  return diffs;
}
