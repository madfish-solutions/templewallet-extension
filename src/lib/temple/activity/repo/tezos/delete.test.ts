import 'core-js/actual/structured-clone';

import { TezosActivity } from 'lib/activity';
import { TempleTezosChainId } from 'lib/temple/types';

import { tezosActivities, tezosActivitiesIntervals } from '../db';
import { resetDb } from '../test-helpers';

import { deleteTezosActivitiesByAddress } from './delete';
import rawTestAccountActivities from './test-account-activities.json';
import rawTestAccount2Activities from './test-account2-activities.json';
import { checkTezosDbState, testAccount2Pkh, testAccountPkh } from './test-helpers';
import { toDbTezosActivity } from './utils';

const testAccountActivities = (rawTestAccountActivities as TezosActivity[]).map(activity =>
  toDbTezosActivity(activity, '', testAccountPkh)
);
const testAccount2Activities = (rawTestAccount2Activities as TezosActivity[]).map(activity =>
  toDbTezosActivity(activity, '', testAccount2Pkh)
);

const testIntervals = [
  {
    chainId: TempleTezosChainId.Mainnet,
    upperLimit: {
      hash: '',
      oldestTzktOperation: {
        level: 8021854,
        timestamp: '2025-02-20T14:54:45Z'
      }
    },
    lowerLimit: {
      hash: 'opZp2NFj7kyxJnRzu4A9u7t9p7LAmdDWsFnUmWa5dFg6m3HcNQH',
      oldestTzktOperation: {
        level: 7989796,
        timestamp: '2025-02-17T15:21:28Z'
      }
    },
    account: testAccountPkh,
    assetSlug: ''
  },
  {
    chainId: TempleTezosChainId.Mainnet,
    upperLimit: {
      hash: '',
      oldestTzktOperation: {
        level: 8021847,
        timestamp: '2025-02-20T14:53:49Z'
      }
    },
    lowerLimit: {
      hash: 'ooS4SsuTxUt1x7vvoxZuKmpoDDM9un7rwrAeSHbkTBf9VjuyoTJ',
      oldestTzktOperation: {
        level: 8008288,
        timestamp: '2025-02-19T08:37:00Z'
      }
    },
    account: testAccount2Pkh,
    assetSlug: ''
  }
];

describe('deleteTezosActivities', () => {
  afterEach(resetDb);

  beforeEach(async () => {
    await tezosActivities.bulkAdd(
      testAccountActivities
        .map(activity => toDbTezosActivity(activity, '', testAccountPkh))
        .concat(testAccount2Activities)
    );
    await tezosActivitiesIntervals.bulkAdd(testIntervals);
  });

  it('should remove only the data which is related only to account 1', async () => {
    await deleteTezosActivitiesByAddress(testAccountPkh);
    await checkTezosDbState([testIntervals[1]], testAccount2Activities);
  });

  it('should remove only the data which is related only to account 2', async () => {
    await deleteTezosActivitiesByAddress(testAccount2Pkh);
    await checkTezosDbState([testIntervals[0]], testAccountActivities);
  });
});
