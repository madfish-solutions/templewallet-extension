import BigNumber from 'bignumber.js';

import { toTokenSlug } from 'lib/assets';
import type { Activity } from 'lib/temple/activity-new';

import { OperStackItemInterface, OperStackItemTypeEnum } from './types';

export function buildOperStack(activity: Activity, address: string) {
  const opStack: OperStackItemInterface[] = [];

  for (const oper of activity.operations) {
    if (oper.type === 'transaction') {
      if (isZero(oper.amountSigned)) {
        opStack.push({
          type: OperStackItemTypeEnum.Interaction,
          with: oper.target.address,
          entrypoint: oper.entrypoint
        });
      } else if (oper.from.address === address) {
        opStack.push({
          type: OperStackItemTypeEnum.TransferTo,
          to: oper.to.address
        });
      } else if (oper.to.address === address) {
        opStack.push({
          type: OperStackItemTypeEnum.TransferFrom,
          from: oper.from.address
        });
      }
    } else if (oper.type === 'delegation' && oper.source.address === address && oper.target) {
      opStack.push({
        type: OperStackItemTypeEnum.Delegation,
        to: oper.target.address
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

export function buildMoneyDiffs(activity: Activity) {
  const diffs: MoneyDiff[] = [];

  for (const oper of activity.operations) {
    if (oper.type !== 'transaction' || isZero(oper.amountSigned)) continue;
    const assetSlug = oper.contractAddress == null ? 'tez' : toTokenSlug(oper.contractAddress, oper.tokenId);
    const diff = new BigNumber(oper.amountSigned).toFixed();
    diffs.push({ assetSlug, diff });
  }

  return diffs;
}

const isZero = (val: BigNumber.Value) => new BigNumber(val).isZero();
