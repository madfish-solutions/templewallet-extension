import { isDefined } from '@rnw-community/shared';

import { TezosActivity } from 'lib/activity';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';

import { DbTezosActivity } from '../db';

export const lowerLimitTsPath = 'lowerLimit.oldestTzktOperation.timestamp' as const;
export const upperLimitTsPath = 'upperLimit.oldestTzktOperation.timestamp' as const;
export const activityTsPath = 'oldestTzktOperation.timestamp' as const;

export const lowestIntervalLimit = Object.freeze({
  hash: 'BLockGenesisGenesisGenesisGenesisGenesisf79b5d1CoW2',
  oldestTzktOperation: {
    level: 0,
    timestamp: '2018-06-30T16:07:32Z'
  }
});

export const getIntervalLimit = (baseActivity: TezosActivityOlderThan, shift = 0) => {
  const { level: opLevel, timestamp } = baseActivity.oldestTzktOperation;
  const operationTs = new Date(timestamp).getTime() + 1000 * shift;

  return {
    hash: shift === 0 ? baseActivity.hash : '',
    oldestTzktOperation: {
      level: opLevel! + shift,
      timestamp: new Date(operationTs).toISOString().replace('.000', '')
    }
  };
};

export const compareLimits = (a: TezosActivityOlderThan, b: TezosActivityOlderThan) => {
  const { level: aLevel, timestamp: aTimestamp } = a.oldestTzktOperation;
  const { level: bLevel, timestamp: bTimestamp } = b.oldestTzktOperation;

  if (isDefined(aLevel) && isDefined(bLevel)) {
    return aLevel - bLevel;
  }

  return aTimestamp.localeCompare(bTimestamp);
};

export const toFrontTezosActivity = ({ account, assetSlug, id, ...activity }: DbTezosActivity): TezosActivity =>
  activity;

export const toDbTezosActivity = (activity: TezosActivity, assetSlug: string, account: string) => ({
  ...activity,
  assetSlug,
  account
});

export const getPointerTimestamp = (pointer: TezosActivityOlderThan) => pointer.oldestTzktOperation.timestamp;
