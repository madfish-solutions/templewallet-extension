import { OpKind } from '@taquito/rpc';
import BigNumber from 'bignumber.js';

import * as Repo from 'lib/temple/repo';

import { isPositiveNumber, tryParseTokenTransfers, toTokenId } from './helpers';

interface MoneyDiff {
  assetId: string;
  diff: string;
}

type DiffSource = 'local' | 'tzkt' | 'bcd';

export function parseMoneyDiffs(operation: Repo.IOperation, address: string) {
  const diffs: Record<string, { source: DiffSource; diff: string }[]> = {};
  const appendToDiff = (source: DiffSource, assetId: string, diff: string) => {
    if (!(assetId in diffs)) {
      diffs[assetId] = [];
    }
    if (diffs[assetId].every(d => d.source === source || d.diff !== diff)) {
      diffs[assetId].push({ source, diff });
    }
  };

  const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

  if (localGroup) {
    for (const op of localGroup) {
      if (op.kind === OpKind.ORIGINATION) {
        if (op.source === address && isPositiveNumber(op.balance)) {
          appendToDiff('local', 'tez', new BigNumber(op.balance).times(-1).toFixed());
        }
      } else if (op.kind === OpKind.TRANSACTION) {
        if ((op.source === address || op.destination === address) && isPositiveNumber(op.amount)) {
          appendToDiff('local', 'tez', new BigNumber(op.amount).times(op.source === address ? -1 : 1).toFixed());
        }

        if (op.parameters) {
          tryParseTokenTransfers(op.parameters, op.destination, (assetId, from, to, amount) => {
            if (from === address || to === address) {
              appendToDiff('local', assetId, new BigNumber(amount).times(from === address ? -1 : 1).toFixed());
            }
          });
        }
      }
    }
  }

  if (tzktGroup) {
    for (const tzktOp of tzktGroup) {
      if (tzktOp.type === 'transaction' && tzktOp.status === 'applied') {
        if (
          (tzktOp.sender.address === address || tzktOp.target.address === address) &&
          isPositiveNumber(tzktOp.amount)
        ) {
          appendToDiff(
            'tzkt',
            'tez',
            new BigNumber(tzktOp.amount).times(tzktOp.sender.address === address ? -1 : 1).toFixed()
          );
        }

        if (tzktOp.parameters) {
          try {
            tryParseTokenTransfers(
              JSON.parse(tzktOp.parameters),
              tzktOp.target.address,
              (assetId, from, to, amount) => {
                if (from === address || to === address) {
                  appendToDiff('tzkt', assetId, new BigNumber(amount).times(from === address ? -1 : 1).toFixed());
                }
              }
            );
          } catch {}
        }
      }
    }
  }

  if (bcdTokenTransfers) {
    for (const tokenTrans of bcdTokenTransfers) {
      if (tokenTrans.status === 'applied' && (tokenTrans.from === address || tokenTrans.to === address)) {
        appendToDiff(
          'bcd',
          toTokenId(tokenTrans.contract, tokenTrans.token_id),
          new BigNumber(tokenTrans.amount).times(tokenTrans.from === address ? -1 : 1).toFixed()
        );
      }
    }
  }

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
