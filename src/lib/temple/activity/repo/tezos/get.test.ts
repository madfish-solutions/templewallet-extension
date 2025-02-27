import 'core-js/actual/structured-clone';
import { pick } from 'lodash';

import { TezosActivity } from 'lib/activity';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { TempleTezosChainId } from 'lib/temple/types';

import { tezosActivities, tezosActivitiesIntervals } from '../db';
import { resetDb } from '../test-helpers';

import { testAccount2Pkh, testAccountPkh, tkeySlug } from './common-tezos-mocks';
import rawTestAccountActivities from './test-account-activities.json';

import {
  getClosestTezosActivitiesInterval,
  lowestOlderThanValue,
  toDbTezosActivity as genericToDbTezosActivity,
  getIntervalLimit
} from '.';

const testAccountActivities = rawTestAccountActivities as TezosActivity[];

const toDbTezosActivity = (activity: TezosActivity, assetSlug = '') =>
  genericToDbTezosActivity(activity, assetSlug, testAccountPkh);

describe('getClosestTezosActivitiesInterval', () => {
  afterEach(resetDb);

  describe('history for all assets', () => {
    it('should return an empty array if there is no matching interval', async () => {
      const testActivity = testAccountActivities[0];

      const activityId = await tezosActivities.add(toDbTezosActivity(testActivity));
      const intervalUpperLimit = getIntervalLimit(testActivity, 1);
      const intervalId = await tezosActivitiesIntervals.add({
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: '',
        upperLimit: intervalUpperLimit,
        lowerLimit: pick(testActivity, ['hash', 'oldestTzktOperation'])
      });

      const olderThan1 = getIntervalLimit(testActivity);
      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: olderThan1,
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: olderThan1,
        lowerLimit: olderThan1
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: intervalUpperLimit,
          chainId: TempleTezosChainId.Ghostnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: intervalUpperLimit,
        lowerLimit: intervalUpperLimit
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: intervalUpperLimit,
          chainId: TempleTezosChainId.Mainnet,
          account: testAccount2Pkh
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: intervalUpperLimit,
        lowerLimit: intervalUpperLimit
      });

      await tezosActivities.delete(activityId);
      await tezosActivitiesIntervals.delete(intervalId);
      await tezosActivities.add(toDbTezosActivity(testActivity, tkeySlug));
      await tezosActivitiesIntervals.add({
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: tkeySlug,
        upperLimit: intervalUpperLimit,
        lowerLimit: pick(testActivity, ['hash', 'oldestTzktOperation'])
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: intervalUpperLimit,
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: intervalUpperLimit,
        lowerLimit: intervalUpperLimit
      });
    });

    it('should return activities from the closest matching interval that are older than the given block height', async () => {
      await tezosActivities.bulkAdd(testAccountActivities.slice(0, 3).map(activity => toDbTezosActivity(activity)));
      await tezosActivitiesIntervals.bulkAdd([
        {
          chainId: TempleTezosChainId.Mainnet,
          upperLimit: getIntervalLimit(testAccountActivities[0], 1),
          lowerLimit: getIntervalLimit(testAccountActivities[1]),
          account: testAccountPkh,
          assetSlug: ''
        },
        {
          chainId: TempleTezosChainId.Mainnet,
          upperLimit: getIntervalLimit(testAccountActivities[1]),
          lowerLimit: getIntervalLimit(testAccountActivities[2]),
          account: testAccountPkh,
          assetSlug: ''
        }
      ]);

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0], 2),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[0], testAccountActivities[1]],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0], 1),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[0], testAccountActivities[1]],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0]),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[1]],
        upperLimit: getIntervalLimit(testAccountActivities[0]),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      });
    });

    it('should return activities from the newest relevant interval if `olderThan` is not provided', async () => {
      await tezosActivities.bulkAdd(testAccountActivities.slice(0, 3).map(activity => toDbTezosActivity(activity)));
      await tezosActivitiesIntervals.bulkAdd([
        {
          chainId: TempleTezosChainId.Mainnet,
          upperLimit: getIntervalLimit(testAccountActivities[0], 1),
          lowerLimit: getIntervalLimit(testAccountActivities[1]),
          account: testAccountPkh,
          assetSlug: ''
        },
        {
          chainId: TempleTezosChainId.Mainnet,
          upperLimit: getIntervalLimit(testAccountActivities[1]),
          lowerLimit: getIntervalLimit(testAccountActivities[2]),
          account: testAccountPkh,
          assetSlug: ''
        }
      ]);

      await expect(
        getClosestTezosActivitiesInterval({
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[0], testAccountActivities[1]],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      });

      await tezosActivitiesIntervals.update(1, { assetSlug: tkeySlug });

      await expect(
        getClosestTezosActivitiesInterval({
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[2]],
        upperLimit: getIntervalLimit(testAccountActivities[1]),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      });
    });
  });

  describe('history for a certain asset', () => {
    it('should return an empty array if there is no matching interval', async () => {
      const testActivity = testAccountActivities[0];

      await tezosActivities.add(toDbTezosActivity(testActivity));
      const intervalUpperLimit = getIntervalLimit(testActivity, 1);
      await tezosActivitiesIntervals.add({
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: tkeySlug,
        upperLimit: intervalUpperLimit,
        lowerLimit: pick(testActivity, ['hash', 'oldestTzktOperation'])
      });

      const olderThan1 = getIntervalLimit(testActivity);
      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: olderThan1,
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: olderThan1,
        lowerLimit: olderThan1
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: intervalUpperLimit,
          chainId: TempleTezosChainId.Ghostnet,
          account: testAccountPkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: intervalUpperLimit,
        lowerLimit: intervalUpperLimit
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: intervalUpperLimit,
          chainId: TempleTezosChainId.Mainnet,
          account: testAccount2Pkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: intervalUpperLimit,
        lowerLimit: intervalUpperLimit
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: intervalUpperLimit,
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: TEZ_TOKEN_SLUG
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: intervalUpperLimit,
        lowerLimit: intervalUpperLimit
      });
    });

    it('should return activities from the closest matching interval that are older than the given block height \
and tokens are of the specified asset', async () => {
      const testActivities = [
        toDbTezosActivity(testAccountActivities[0]),
        toDbTezosActivity(testAccountActivities[1], TEZ_TOKEN_SLUG),
        toDbTezosActivity(testAccountActivities[2], 'KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL_0'),
        toDbTezosActivity(testAccountActivities[3], 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn_0')
      ];
      await tezosActivities.bulkAdd(testActivities);
      await tezosActivitiesIntervals.bulkAdd([
        {
          upperLimit: getIntervalLimit(testAccountActivities[0], 1),
          lowerLimit: getIntervalLimit(testAccountActivities[0], -1),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: ''
        },
        ...testAccountActivities.slice(1, 4).map((_, i) => ({
          upperLimit: getIntervalLimit(testAccountActivities[i], -1),
          lowerLimit: getIntervalLimit(testAccountActivities[i + 1], -1),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: testActivities[i + 1].assetSlug
        }))
      ]);

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0], 2),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[0]],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[0], -1)
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0]),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: getIntervalLimit(testAccountActivities[0]),
        lowerLimit: getIntervalLimit(testAccountActivities[0], -1)
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0], 2),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: TEZ_TOKEN_SLUG
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[0], -1)
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0], -1),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: TEZ_TOKEN_SLUG
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[1]],
        upperLimit: getIntervalLimit(testAccountActivities[0], -1),
        lowerLimit: getIntervalLimit(testAccountActivities[1], -1)
      });

      await expect(
        getClosestTezosActivitiesInterval({
          olderThan: getIntervalLimit(testAccountActivities[0], -1),
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: 'KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL_0'
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[2]],
        upperLimit: getIntervalLimit(testAccountActivities[1], -1),
        lowerLimit: getIntervalLimit(testAccountActivities[2], -1)
      });
    });

    it('should return activities from the newest relevant interval if `olderThan` is not provided', async () => {
      const testActivities = [
        toDbTezosActivity(testAccountActivities[0]),
        toDbTezosActivity(testAccountActivities[1], TEZ_TOKEN_SLUG),
        toDbTezosActivity(testAccountActivities[2], 'KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL_0'),
        toDbTezosActivity(testAccountActivities[3], 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn_0')
      ];
      const activitiesIds = await tezosActivities.bulkAdd(testActivities, { allKeys: true });
      const intervalsIds = await tezosActivitiesIntervals.bulkAdd(
        [
          {
            upperLimit: getIntervalLimit(testAccountActivities[0], 1),
            lowerLimit: getIntervalLimit(testAccountActivities[0], -1),
            chainId: TempleTezosChainId.Mainnet,
            account: testAccountPkh,
            assetSlug: ''
          },
          ...testAccountActivities.slice(1, 4).map((_, i) => ({
            upperLimit: getIntervalLimit(testAccountActivities[i], -1),
            lowerLimit: getIntervalLimit(testAccountActivities[i + 1], -1),
            chainId: TempleTezosChainId.Mainnet,
            account: testAccountPkh,
            assetSlug: testActivities[i + 1].assetSlug
          }))
        ],
        { allKeys: true }
      );

      await expect(
        getClosestTezosActivitiesInterval({
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [testAccountActivities[0]],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[0], -1)
      });

      await expect(
        getClosestTezosActivitiesInterval({
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: TEZ_TOKEN_SLUG
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[0], -1)
      });

      await tezosActivities.delete(activitiesIds[0]);
      await tezosActivitiesIntervals.delete(intervalsIds[0]);

      await expect(
        getClosestTezosActivitiesInterval({
          chainId: TempleTezosChainId.Mainnet,
          account: testAccountPkh,
          assetSlug: tkeySlug
        })
      ).resolves.toEqual({
        activities: [],
        upperLimit: lowestOlderThanValue,
        lowerLimit: lowestOlderThanValue
      });
    });
  });
});
