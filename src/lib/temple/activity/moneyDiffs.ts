import { OperationContentsAndResult, OpKind } from '@taquito/rpc';
import BigNumber from 'bignumber.js';

import { BcdTokenTransfer } from 'lib/better-call-dev';
import * as Repo from 'lib/temple/repo';
import { TzktOperation } from 'lib/tzkt';

import { isPositiveNumber, tryParseTokenTransfers, toTokenId } from './helpers';

interface MoneyDiff {
  assetId: string;
  diff: string;
}

type DiffSource = 'local' | 'tzkt' | 'bcd';

export function parseMoneyDiffs(operation: Repo.IOperation, address: string) {
  const diffs: Record<string, { source: DiffSource; diff: string }[]> = {};

  const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

  estimateLocalGroup(localGroup, address, diffs);
  estimateTzktGroup(tzktGroup, address, diffs);
  estimateBcdTokenTransfers(bcdTokenTransfers, address, diffs);

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

const appendToDiff = (
  source: DiffSource,
  assetId: string,
  diff: string,
  diffs: Record<string, { source: DiffSource; diff: string }[]>
) => {
  if (!(assetId in diffs)) {
    diffs[assetId] = [];
  }
  if (diffs[assetId].every(d => d.source === source || d.diff !== diff)) {
    diffs[assetId].push({ source, diff });
  }
};

const estimateLocalGroup = (
  localGroup: OperationContentsAndResult[] | undefined,
  address: string,
  diffs: Record<string, { source: DiffSource; diff: string }[]>
) => {
  if (!localGroup) return;
  for (const op of localGroup) {
    if (op.kind === OpKind.ORIGINATION) {
      if (op.source === address && isPositiveNumber(op.balance)) {
        appendToDiff('local', 'tez', new BigNumber(op.balance).times(-1).toFixed(), diffs);
      }
    } else if (op.kind === OpKind.TRANSACTION) {
      estimateTransactionOperation(op, address, diffs);
    }
  }
};

const estimateTransactionOperation = (
  op: OperationContentsAndResult,
  address: string,
  diffs: Record<string, { source: DiffSource; diff: string }[]>
) => {
  if (op.kind !== OpKind.TRANSACTION) return;
  if ((op.source === address || op.destination === address) && isPositiveNumber(op.amount)) {
    appendToDiff('local', 'tez', new BigNumber(op.amount).times(op.source === address ? -1 : 1).toFixed(), diffs);
  }

  if (op.parameters) {
    tryParseTokenTransfers(op.parameters, op.destination, (assetId, from, to, amount) => {
      if (from === address || to === address) {
        appendToDiff('local', assetId, new BigNumber(amount).times(from === address ? -1 : 1).toFixed(), diffs);
      }
    });
  }
};

const estimateTzktGroup = (
  tzktGroup: TzktOperation[] | undefined,
  address: string,
  diffs: Record<string, { source: DiffSource; diff: string }[]>
) => {
  if (!tzktGroup) return;
  for (const tzktOp of tzktGroup) {
    if (tzktOp.type === 'transaction' && tzktOp.status === 'applied') {
      estimateTzktOp(tzktOp, address, diffs);
    }
  }
};

const estimateTzktOp = (
  tzktOp: TzktOperation,
  address: string,
  diffs: Record<string, { source: DiffSource; diff: string }[]>
) => {
  if (tzktOp.type !== 'transaction' || tzktOp.status !== 'applied') return;
  if ((tzktOp.sender.address === address || tzktOp.target.address === address) && isPositiveNumber(tzktOp.amount)) {
    appendToDiff(
      'tzkt',
      'tez',
      new BigNumber(tzktOp.amount).times(tzktOp.sender.address === address ? -1 : 1).toFixed(),
      diffs
    );
  }

  if (!tzktOp.parameters) return;
  try {
    tryParseTokenTransfers(JSON.parse(tzktOp.parameters), tzktOp.target.address, (assetId, from, to, amount) => {
      if (from === address || to === address) {
        appendToDiff('tzkt', assetId, new BigNumber(amount).times(from === address ? -1 : 1).toFixed(), diffs);
      }
    });
  } catch {}
};

const estimateBcdTokenTransfers = (
  bcdTokenTransfers: BcdTokenTransfer[] | undefined,
  address: string,
  diffs: Record<string, { source: DiffSource; diff: string }[]>
) => {
  if (!bcdTokenTransfers) return;
  for (const tokenTrans of bcdTokenTransfers) {
    if (tokenTrans.status === 'applied' && (tokenTrans.from === address || tokenTrans.to === address)) {
      appendToDiff(
        'bcd',
        toTokenId(tokenTrans.contract, tokenTrans.token_id),
        new BigNumber(tokenTrans.amount).times(tokenTrans.from === address ? -1 : 1).toFixed(),
        diffs
      );
    }
  }
};
