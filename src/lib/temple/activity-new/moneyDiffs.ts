import BigNumber from 'bignumber.js';

import type { Activity } from 'lib/temple/activity-new/utils';
import { TzktOperation } from 'lib/tzkt';

import { isPositiveNumber, tryParseTokenTransfers } from './helpers';

interface MoneyDiff {
  assetId: string;
  diff: string;
}

type DiffSource = 'local' | 'tzkt' | 'bcd';

type Diffs = Record<string, Array<{ source: DiffSource; diff: string }>>;

export function parseMoneyDiffs(activity: Activity, address: string) {
  const diffs: Diffs = {};

  const tzktGroup = activity.tzktOperations;

  estimateTzktGroup(tzktGroup, address, diffs);

  return flattenDiffs(diffs);
}

function flattenDiffs(diffs: Diffs) {
  const flatted: Record<string, string> = {};
  for (const assetId of Object.keys(diffs)) {
    flatted[assetId] = diffs[assetId].reduce((sum, val) => sum.plus(val.diff), new BigNumber(0)).toFixed();
  }

  const { tez, ...rest } = flatted;
  const result: MoneyDiff[] = [];

  if (tez && isValidDiff(tez)) {
    result.push({
      assetId: 'tez',
      diff: tez
    });
  }

  for (const assetId of Object.keys(rest)) {
    const diff = rest[assetId];
    if (isValidDiff(diff)) {
      result.push({
        assetId,
        diff
      });
    }
  }

  return result;
}

function isValidDiff(val: BigNumber.Value) {
  const bn = new BigNumber(val);
  return !bn.isNaN() && bn.isFinite() && !bn.isZero();
}

const appendToDiff = (source: DiffSource, assetId: string, diff: string, diffs: Diffs) => {
  if (!(assetId in diffs)) {
    diffs[assetId] = [];
  }
  if (diffs[assetId].every(d => d.source === source || d.diff !== diff)) {
    diffs[assetId].push({ source, diff });
  }
};

const estimateTzktGroup = (tzktGroup: Array<TzktOperation> | undefined, address: string, diffs: Diffs) => {
  if (!tzktGroup) return;
  for (const tzktOp of tzktGroup) {
    if (tzktOp.type === 'transaction' && tzktOp.status === 'applied') {
      estimateTzktOp(tzktOp, address, diffs);
    }
  }
};

const estimateTzktOp = (tzktOp: TzktOperation, address: string, diffs: Diffs) => {
  if (tzktOp.type !== 'transaction' || tzktOp.status !== 'applied') return;
  if ((tzktOp.sender.address === address || tzktOp.target.address === address) && isPositiveNumber(tzktOp.amount)) {
    appendToDiff(
      'tzkt',
      'tez',
      new BigNumber(tzktOp.amount).times(tzktOp.sender.address === address ? -1 : 1).toFixed(),
      diffs
    );
  }

  if (!tzktOp.parameter) return;
  try {
    tryParseTokenTransfers(tzktOp.parameter, tzktOp.target.address, (assetId, from, to, amount) => {
      if (from === address || to === address) {
        appendToDiff('tzkt', assetId, new BigNumber(amount).times(from === address ? -1 : 1).toFixed(), diffs);
      }
    });
  } catch {}
};
