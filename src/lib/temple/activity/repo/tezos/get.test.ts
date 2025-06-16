import 'core-js/actual/structured-clone';
import { pick } from 'lodash';

import { TezosActivity } from 'lib/activity';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { TempleTezosChainId } from 'lib/temple/types';

import { tezosActivities, tezosActivitiesIntervals } from '../db';
import { resetDb } from '../test-helpers';

import rawTestAccountActivitiesGhostnet from './test-account-activities-ghostnet.json';
import rawTestAccountActivities from './test-account-activities.json';
import { testAccount2Pkh, testAccountPkh, tkeySlug } from './test-helpers';
import { toDbTezosActivity as genericToDbTezosActivity, getIntervalLimit } from './utils';

import { getClosestTezosActivitiesInterval, getSeparateActivities } from '.';

const testAccountActivities = rawTestAccountActivities as TezosActivity[];
const testAccountActivitiesGhostnet = rawTestAccountActivitiesGhostnet as TezosActivity[];

const toDbTezosActivity = (activity: TezosActivity, assetSlug = '') =>
  genericToDbTezosActivity(activity, assetSlug, testAccountPkh);

describe('GET functions', () => {
  describe('getSeparateActivities', () => {
    afterAll(resetDb);

    beforeAll(() =>
      tezosActivities.bulkAdd(
        testAccountActivitiesGhostnet.concat(testAccountActivities).map(activity => toDbTezosActivity(activity, ''))
      )
    );

    it('should return activities for the current users by specified hashes', async () => {
      const expectedActivitiesIndexes = [6, 5, 8];
      const expectedActivities = expectedActivitiesIndexes.map(i => testAccountActivitiesGhostnet[i]);

      await expect(
        getSeparateActivities(TempleTezosChainId.Ghostnet, testAccountPkh, [
          'onq6nDca3LiVUZHjwYAJh1aKLtvTsP332x4vnQuAB765XaKQY3u',
          'opZp2NFj7kyxJnRzu4A9u7t9p7LAmdDWsFnUmWa5dFg6m3HcNQH',
          'ooeyRuzN9KzWH3zkjLnFd7BSWvhF5DCNQJ2tvSboNaMp9W1ML9e',
          'opBs1VRvVYygCeAuGFffaud19sZppz7HCPuHkrkjhTtUi6uuhiD'
        ])
      ).resolves.toEqual(expectedActivities);
    });
  });

  describe('getClosestTezosActivitiesInterval', () => {
    describe('history for all assets', () => {
      afterEach(resetDb);

      it('should return `undefined` if there is no matching interval', async () => {
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

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: getIntervalLimit(testActivity),
            chainId: TempleTezosChainId.Mainnet,
            account: testAccountPkh
          })
        ).resolves.toEqual(undefined);

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: intervalUpperLimit,
            chainId: TempleTezosChainId.Ghostnet,
            account: testAccountPkh
          })
        ).resolves.toEqual(undefined);

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: intervalUpperLimit,
            chainId: TempleTezosChainId.Mainnet,
            account: testAccount2Pkh
          })
        ).resolves.toEqual(undefined);

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
        ).resolves.toEqual(undefined);
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
      afterEach(resetDb);

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

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: getIntervalLimit(testActivity),
            chainId: TempleTezosChainId.Mainnet,
            account: testAccountPkh,
            assetSlug: tkeySlug
          })
        ).resolves.toEqual(undefined);

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: intervalUpperLimit,
            chainId: TempleTezosChainId.Ghostnet,
            account: testAccountPkh,
            assetSlug: tkeySlug
          })
        ).resolves.toEqual(undefined);

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: intervalUpperLimit,
            chainId: TempleTezosChainId.Mainnet,
            account: testAccount2Pkh,
            assetSlug: tkeySlug
          })
        ).resolves.toEqual(undefined);

        await expect(
          getClosestTezosActivitiesInterval({
            olderThan: intervalUpperLimit,
            chainId: TempleTezosChainId.Mainnet,
            account: testAccountPkh,
            assetSlug: TEZ_TOKEN_SLUG
          })
        ).resolves.toEqual(undefined);
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
        ).resolves.toEqual(undefined);
      });
    });

    describe('limiting the number of returned activities', () => {
      const intervalUpperLimit = getIntervalLimit(testAccountActivitiesGhostnet[0], 1);
      const intervalLowerLimit = getIntervalLimit(testAccountActivitiesGhostnet.at(-1)!);
      beforeAll(async () => {
        await tezosActivities.bulkAdd(testAccountActivitiesGhostnet.map(activity => toDbTezosActivity(activity)));
        await tezosActivitiesIntervals.add({
          chainId: TempleTezosChainId.Ghostnet,
          account: testAccountPkh,
          upperLimit: intervalUpperLimit,
          lowerLimit: intervalLowerLimit,
          assetSlug: ''
        });
      });

      afterAll(resetDb);

      it('should return all matching activities by default', async () => {
        await expect(
          getClosestTezosActivitiesInterval({
            chainId: TempleTezosChainId.Ghostnet,
            account: testAccountPkh
          })
        ).resolves.toEqual({
          activities: testAccountActivitiesGhostnet,
          upperLimit: intervalUpperLimit,
          lowerLimit: intervalLowerLimit
        });
      });

      it.each([Infinity, NaN, -1, 0, 1.5])('should ignore `maxItems` value of %d', async maxItems => {
        await expect(
          getClosestTezosActivitiesInterval({
            chainId: TempleTezosChainId.Ghostnet,
            account: testAccountPkh,
            maxItems
          })
        ).resolves.toEqual({
          activities: testAccountActivitiesGhostnet,
          upperLimit: intervalUpperLimit,
          lowerLimit: intervalLowerLimit
        });
      });

      it('should return not more than `maxItems` activities', async () => {
        await expect(
          getClosestTezosActivitiesInterval({
            chainId: TempleTezosChainId.Ghostnet,
            account: testAccountPkh,
            maxItems: 10
          })
        ).resolves.toEqual({
          activities: testAccountActivitiesGhostnet.slice(0, 10),
          upperLimit: intervalUpperLimit,
          lowerLimit: getIntervalLimit(testAccountActivitiesGhostnet[9])
        });

        await expect(
          getClosestTezosActivitiesInterval({
            chainId: TempleTezosChainId.Ghostnet,
            account: testAccountPkh,
            maxItems: 10,
            assetSlug: 'tez'
          })
        ).resolves.toEqual({
          activities: testAccountActivitiesGhostnet
            .slice(0, 10)
            .filter(activity => activity.operations.some(op => op.assetSlug === 'tez')),
          upperLimit: intervalUpperLimit,
          lowerLimit: getIntervalLimit(testAccountActivitiesGhostnet[9])
        });
      });
    });
  });
});
