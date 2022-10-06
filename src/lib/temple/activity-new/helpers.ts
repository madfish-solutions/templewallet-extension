import BigNumber from 'bignumber.js';

import type { Activity } from 'lib/temple/activity-new';

import { OperStackItemInterface, OperStackItemTypeEnum } from './types';

export function parseOperationsStack(activity: Activity, address: string) {
  const opStack: OperStackItemInterface[] = [];

  for (const oper of activity.operations) {
    if (oper.type === 'transaction') {
      if (isZero(oper.amountSigned)) {
        opStack.push({
          type: OperStackItemTypeEnum.Interaction,
          with: oper.destination.address,
          entrypoint: oper.entrypoint
        });
      } else if (oper.source.address === address) {
        opStack.push({
          type: OperStackItemTypeEnum.TransferTo,
          to: oper.destination.address
        });
      } else if (oper.destination.address === address) {
        opStack.push({
          type: OperStackItemTypeEnum.TransferFrom,
          from: oper.source.address
        });
      }
    } else if (oper.type === 'delegation' && oper.source.address === address && oper.destination) {
      opStack.push({
        type: OperStackItemTypeEnum.Delegation,
        to: oper.destination.address
      });
    } else {
      opStack.push({
        type: OperStackItemTypeEnum.Other,
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

const isZero = (val: BigNumber.Value) => new BigNumber(val).isZero();

const toTokenSlug = (contractAddress: string, tokenId: string | number = 0) => `${contractAddress}_${tokenId}`;
