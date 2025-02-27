import 'core-js/actual/structured-clone';

import { TezosActivity } from 'lib/activity';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { TempleTezosChainId } from 'lib/temple/types';

import { DbTezosActivity, tezosActivities, tezosActivitiesIntervals } from '../db';
import { checkTezosDbState, resetDb } from '../test-helpers';

import { testAccountPkh, tkeySlug } from './common-tezos-mocks';
import rawTestAccountActivitiesGhostnet from './test-account-activities-ghostnet.json';
import rawTestAccountActivities from './test-account-activities.json';

import { getIntervalLimit, lowestOlderThanValue, putTezosActivities, toDbTezosActivity } from '.';

const testAccountActivities = rawTestAccountActivities as TezosActivity[];
const testAccountActivitiesGhostnet = rawTestAccountActivitiesGhostnet as TezosActivity[];

const tezosActivitiesIndexes = [1, 4, 6];
const youTokenSlug = 'KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL_0';

const tezTokenDbActivities = tezosActivitiesIndexes.map(index =>
  toDbTezosActivity(testAccountActivities[index], TEZ_TOKEN_SLUG, testAccountPkh)
);
const tezTokenAsAllAssetsDbActivities = tezosActivitiesIndexes.map(index =>
  toDbTezosActivity(testAccountActivities[index], '', testAccountPkh)
);

const variousAssetsSlugs = [tkeySlug, TEZ_TOKEN_SLUG, youTokenSlug];
const variousAssetsDbActivities = testAccountActivities
  .slice(0, 3)
  .map((activity, i) => toDbTezosActivity(activity, variousAssetsSlugs[i], testAccountPkh));
const variousAllAssetsDbActivities = testAccountActivities
  .slice(0, 3)
  .map(activity => toDbTezosActivity(activity, '', testAccountPkh));

const makeMainnetIntervalBase = (assetSlug: string) => ({
  chainId: TempleTezosChainId.Mainnet,
  account: testAccountPkh,
  assetSlug
});

const mainnetTezIntervalBase = makeMainnetIntervalBase(TEZ_TOKEN_SLUG);
const mainnetTkeyIntervalBase = makeMainnetIntervalBase(tkeySlug);
const mainnetAllAssetsIntervalBase = makeMainnetIntervalBase('');

const generateModifiedActivities = (activities: DbTezosActivity[], assetSlug?: string) =>
  activities.map(activity => ({
    ...activity,
    assetSlug: assetSlug ?? activity.assetSlug,
    oldestTzktOperation: {
      ...activity.oldestTzktOperation,
      hash: activity.oldestTzktOperation.hash + 'modified'
    }
  }));

describe('putTezosActivities', () => {
  afterEach(resetDb);

  it('should throw an error if there are activities from different chains', async () => {
    await expect(
      putTezosActivities({
        activities: [testAccountActivities[0], testAccountActivitiesGhostnet[0]],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh
      })
    ).rejects.toThrowError();
  });

  describe('no new activities, `olderThan` and `assetSlug` are specified', () => {
    it('should do nothing if there is a superset interval for all assets', async () => {
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities);
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: lowestOlderThanValue
      };
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 1),
        assetSlug: tkeySlug
      });
      await checkTezosDbState([testInterval], variousAllAssetsDbActivities);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0]),
        assetSlug: tkeySlug
      });
      await checkTezosDbState([testInterval], variousAllAssetsDbActivities);
    });

    it('should only delete activities older than `olderThan` for the specified asset if there is a superset interval \
for the specified asset', async () => {
      const activity = toDbTezosActivity(testAccountActivities[0], tkeySlug, testAccountPkh);
      await tezosActivities.add(activity);
      const testInterval = {
        ...mainnetTkeyIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 2),
        lowerLimit: lowestOlderThanValue
      };
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0]),
        assetSlug: tkeySlug
      });
      await checkTezosDbState([testInterval], [activity]);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 1),
        assetSlug: tkeySlug
      });
      await checkTezosDbState([testInterval], []);

      await resetDb();
      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 2),
        assetSlug: tkeySlug
      });
      await checkTezosDbState([testInterval], []);
    });

    it('should delete subset intervals for the specified asset', async () => {
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      await tezosActivitiesIntervals.bulkAdd(
        tezosActivitiesIndexes.map(index => ({
          ...mainnetTezIntervalBase,
          upperLimit: getIntervalLimit(testAccountActivities[index], 1),
          lowerLimit:
            index === tezosActivitiesIndexes.at(-1)
              ? lowestOlderThanValue
              : getIntervalLimit(testAccountActivities[1], -1)
        }))
      );

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1], 1),
        assetSlug: TEZ_TOKEN_SLUG
      });
      await checkTezosDbState(
        [
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1], 1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        []
      );
    });

    it('should create several intervals if there is at least one subset interval for all assets', async () => {
      await tezosActivities.bulkAdd(tezTokenAsAllAssetsDbActivities);

      const initialIntervals = tezosActivitiesIndexes.map(index => ({
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[index], 1),
        lowerLimit:
          index === tezosActivitiesIndexes.at(-1)
            ? lowestOlderThanValue
            : getIntervalLimit(testAccountActivities[index], -1)
      }));
      const initialIntervalsIds = await tezosActivitiesIntervals.bulkAdd(initialIntervals, { allKeys: true });

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1], 1),
        assetSlug: TEZ_TOKEN_SLUG
      });
      await checkTezosDbState(
        initialIntervals.concat([
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1], -1),
            lowerLimit: getIntervalLimit(testAccountActivities[4], 1)
          },
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[4], -1),
            lowerLimit: getIntervalLimit(testAccountActivities[6], 1)
          }
        ]),
        tezTokenAsAllAssetsDbActivities
      );

      const allIntervalsIds = await tezosActivitiesIntervals.toCollection().primaryKeys();
      await tezosActivitiesIntervals.bulkDelete(allIntervalsIds.filter(id => !initialIntervalsIds.includes(id)));
      initialIntervals.at(-1)!.lowerLimit = getIntervalLimit(testAccountActivities[6], -1);
      await tezosActivitiesIntervals.update(initialIntervalsIds.at(-1)!, {
        lowerLimit: getIntervalLimit(testAccountActivities[6], -1)
      });

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1], 2),
        assetSlug: TEZ_TOKEN_SLUG
      });
      await checkTezosDbState(
        initialIntervals.concat([
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1], 2),
            lowerLimit: getIntervalLimit(testAccountActivities[1], 1)
          },
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1], -1),
            lowerLimit: getIntervalLimit(testAccountActivities[4], 1)
          },
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[4], -1),
            lowerLimit: getIntervalLimit(testAccountActivities[6], 1)
          },
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[6], -1),
            lowerLimit: lowestOlderThanValue
          }
        ]),
        tezTokenAsAllAssetsDbActivities
      );
    });

    it('should replace the interval which is for the specified asset, has newer activities, and intersects \
with a new one, with a joined interval', async () => {
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      await tezosActivitiesIntervals.add({
        ...mainnetTezIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[6])
      });

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(testAccountActivities[4])
      });
      await checkTezosDbState(
        [
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1], 1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        tezTokenDbActivities.slice(0, 2)
      );
    });

    it('should replace the interval which is for the specified asset, has newer activities and is neighboring \
with a new one, with a new joined interval', async () => {
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      await tezosActivitiesIntervals.add({
        ...mainnetTezIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[6])
      });

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(testAccountActivities[6])
      });
      await checkTezosDbState(
        [
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1], 1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        tezTokenDbActivities
      );
    });

    it('should create a trimmed interval for the specified asset if there is an interval for all assets \
with newer operations that intersects', async () => {
      await tezosActivities.bulkAdd(tezTokenAsAllAssetsDbActivities);
      const allAssetsInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[6])
      };
      await tezosActivitiesIntervals.add(allAssetsInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(testAccountActivities[4])
      });
      await checkTezosDbState(
        [
          allAssetsInterval,
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[6]),
            lowerLimit: lowestOlderThanValue
          }
        ],
        tezTokenAsAllAssetsDbActivities
      );
    });

    it('should create a separate interval for the specified asset if there is an interval for all assets \
that is neighboring', async () => {
      await tezosActivities.bulkAdd(tezTokenAsAllAssetsDbActivities);
      const allAssetsInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[6])
      };
      await tezosActivitiesIntervals.add(allAssetsInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(testAccountActivities[6])
      });
      await checkTezosDbState(
        [
          allAssetsInterval,
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[6]),
            lowerLimit: lowestOlderThanValue
          }
        ],
        tezTokenAsAllAssetsDbActivities
      );
    });

    it('should create a separate interval if there is no intersection or neighboring', async () => {
      const testActivities = tezTokenAsAllAssetsDbActivities.slice(0, 2);
      await tezosActivities.bulkAdd(testActivities);
      const allAssetsInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[4])
      };
      await tezosActivitiesIntervals.add(allAssetsInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(testAccountActivities[6])
      });
      await checkTezosDbState(
        [
          allAssetsInterval,
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[6]),
            lowerLimit: lowestOlderThanValue
          }
        ],
        testActivities
      );
    });
  });

  describe('no new activities, `olderThan` is specified but `assetSlug` is undefined', () => {
    it('should only delete activities older than `olderThan` for all assets if there is a superset interval \
for all assets', async () => {
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities);
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: lowestOlderThanValue
      };
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState([testInterval], variousAllAssetsDbActivities.slice(0, 2));

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 1)
      });
      await checkTezosDbState([testInterval], []);
    });

    it('should crop superset intervals for certain assets', async () => {
      const testActivities = [
        toDbTezosActivity(testAccountActivities[0], tkeySlug, testAccountPkh),
        toDbTezosActivity(testAccountActivities[1], TEZ_TOKEN_SLUG, testAccountPkh)
      ];
      const testIntervals = [
        {
          ...mainnetTkeyIntervalBase,
          upperLimit: getIntervalLimit(testAccountActivities[0], 1),
          lowerLimit: lowestOlderThanValue
        },
        {
          ...mainnetTezIntervalBase,
          upperLimit: getIntervalLimit(testAccountActivities[1], 1),
          lowerLimit: lowestOlderThanValue
        }
      ];
      await tezosActivities.bulkAdd(testActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState(
        testIntervals
          .map(interval => ({ ...interval, lowerLimit: getIntervalLimit(testAccountActivities[1]) }))
          .concat({
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1]),
            lowerLimit: lowestOlderThanValue
          }),
        testActivities
      );
    });

    it('should delete the same intervals for certain assets', async () => {
      const firstActivity = testAccountActivities[0];
      const testActivities = [
        toDbTezosActivity(firstActivity, tkeySlug, testAccountPkh),
        toDbTezosActivity(testAccountActivities[1], TEZ_TOKEN_SLUG, testAccountPkh)
      ];
      const testIntervals = [
        {
          ...mainnetTkeyIntervalBase,
          upperLimit: getIntervalLimit(firstActivity, 1),
          lowerLimit: lowestOlderThanValue
        },
        {
          ...mainnetTezIntervalBase,
          upperLimit: getIntervalLimit(firstActivity, 1),
          lowerLimit: lowestOlderThanValue
        }
      ];
      await tezosActivities.bulkAdd(testActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(firstActivity, 1)
      });
      await checkTezosDbState(
        [
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(firstActivity, 1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        []
      );
    });

    it('should delete subset intervals', async () => {
      const firstActivity = testAccountActivities[0];
      const testIntervals = variousAllAssetsDbActivities.map((_, i) => ({
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[i], 1),
        lowerLimit: i === 2 ? lowestOlderThanValue : getIntervalLimit(testAccountActivities[i], -1)
      }));
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(firstActivity, 1)
      });
      await checkTezosDbState(
        [
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(firstActivity, 1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        []
      );

      await resetDb();
      testIntervals.forEach((interval, index) => (interval.assetSlug = variousAssetsSlugs[index]));
      await tezosActivities.bulkAdd(variousAssetsDbActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(firstActivity, 1)
      });
      await checkTezosDbState(
        [
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(firstActivity, 1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        []
      );
    });

    it('should crop intervals which are for certain assets, have newer activities, and intersect with a new one', async () => {
      const testIntervals = variousAssetsDbActivities.map((_, i) => ({
        ...makeMainnetIntervalBase(variousAssetsSlugs[i]),
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      }));
      await tezosActivities.bulkAdd(variousAssetsDbActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState(
        testIntervals
          .map(interval => ({
            ...interval,
            lowerLimit: getIntervalLimit(testAccountActivities[1])
          }))
          .concat({
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1]),
            lowerLimit: lowestOlderThanValue
          }),
        variousAssetsDbActivities.slice(0, 2)
      );
    });

    it('should replace the interval which is for all assets, has newer activities, and intersects with a new one, \
with a joined interval', async () => {
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      };
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities);
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState(
        [{ ...testInterval, lowerLimit: lowestOlderThanValue }],
        variousAllAssetsDbActivities.slice(0, 2)
      );
    });

    it('should replace the interval which is for all assets, has newer activities, and is neighboring with a new one, \
with a new joined interval', async () => {
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      };
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities);
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[2])
      });
      await checkTezosDbState([{ ...testInterval, lowerLimit: lowestOlderThanValue }], variousAllAssetsDbActivities);
    });

    it('should create a separate interval if there is no intersection or neighboring', async () => {
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      };
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities);
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[2], -1)
      });
      await checkTezosDbState(
        [
          testInterval,
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[2], -1),
            lowerLimit: lowestOlderThanValue
          }
        ],
        variousAllAssetsDbActivities
      );
    });
  });

  it('should do nothing if there are no activities to put and no `olderThan` is specified', async () => {
    const testActivities = testAccountActivities
      .slice(0, 2)
      .map(activity => toDbTezosActivity(activity, '', testAccountPkh))
      .concat(toDbTezosActivity(testAccountActivities[2], youTokenSlug, testAccountPkh));
    const intervals = [
      {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      },
      {
        ...makeMainnetIntervalBase(youTokenSlug),
        upperLimit: getIntervalLimit(testAccountActivities[2], 1),
        lowerLimit: lowestOlderThanValue
      }
    ];
    await tezosActivities.bulkAdd(testActivities);
    await tezosActivitiesIntervals.bulkAdd(intervals);

    await putTezosActivities({
      activities: [],
      account: testAccountPkh,
      chainId: TempleTezosChainId.Mainnet
    });
    await checkTezosDbState(intervals, testActivities);
  });

  describe('some new activities, `olderThan` is specified but `assetSlug` is undefined', () => {
    it('should only overwrite activities in the range of new ones if there is a superset interval for all assets', async () => {
      const initialActivities = testAccountActivities
        .slice(0, 5)
        .map(activity => toDbTezosActivity(activity, '', testAccountPkh));
      await tezosActivities.bulkAdd(initialActivities);
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[4])
      };
      await tezosActivitiesIntervals.add(testInterval);

      const newActivities = generateModifiedActivities(initialActivities.slice(2, 4));
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState(
        [testInterval],
        [initialActivities[0], initialActivities[1], initialActivities[4], ...newActivities]
      );
    });

    it('should crop superset intervals for specific assets', async () => {
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      const tezInterval = {
        ...mainnetTezIntervalBase,
        upperLimit: getIntervalLimit(tezTokenDbActivities[0], 1),
        lowerLimit: getIntervalLimit(tezTokenDbActivities[2])
      };
      await tezosActivitiesIntervals.add(tezInterval);

      let newActivities = generateModifiedActivities([tezTokenDbActivities[1]], '');
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(tezTokenDbActivities[1], 10)
      });
      await checkTezosDbState(
        [
          {
            ...tezInterval,
            lowerLimit: getIntervalLimit(tezTokenDbActivities[1], 10)
          },
          {
            ...tezInterval,
            upperLimit: getIntervalLimit(tezTokenDbActivities[1])
          },
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(tezTokenDbActivities[1], 10),
            lowerLimit: getIntervalLimit(tezTokenDbActivities[1])
          }
        ],
        [tezTokenDbActivities[0], tezTokenDbActivities[2], ...newActivities]
      );

      await resetDb();
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      await tezosActivitiesIntervals.add(tezInterval);

      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(tezTokenDbActivities[0], 1)
      });
      await checkTezosDbState(
        [
          {
            ...tezInterval,
            upperLimit: getIntervalLimit(tezTokenDbActivities[1])
          },
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(tezTokenDbActivities[0], 1),
            lowerLimit: getIntervalLimit(tezTokenDbActivities[1])
          }
        ],
        [tezTokenDbActivities[2], ...newActivities]
      );

      await resetDb();
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      await tezosActivitiesIntervals.add(tezInterval);
      newActivities = generateModifiedActivities([tezTokenDbActivities[2]], '');
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(tezTokenDbActivities[1], 1)
      });
      await checkTezosDbState(
        [
          {
            ...tezInterval,
            lowerLimit: getIntervalLimit(tezTokenDbActivities[1], 1)
          },
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(tezTokenDbActivities[1], 1),
            lowerLimit: getIntervalLimit(tezTokenDbActivities[2])
          }
        ],
        [tezTokenDbActivities[0], ...newActivities]
      );
    });

    it('should delete the same intervals for specific assets', async () => {
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      const tezInterval = {
        ...mainnetTezIntervalBase,
        upperLimit: getIntervalLimit(tezTokenDbActivities[0], 1),
        lowerLimit: getIntervalLimit(tezTokenDbActivities[2])
      };
      await tezosActivitiesIntervals.add(tezInterval);

      const newActivities = generateModifiedActivities([tezTokenDbActivities[2]], '');
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(tezTokenDbActivities[0], 1)
      });
      await checkTezosDbState([{ ...tezInterval, ...mainnetAllAssetsIntervalBase }], newActivities);
    });

    it('should delete subset intervals and overwrite their activities', async () => {
      await tezosActivities.bulkAdd(tezTokenDbActivities);
      const intervalsLimits = tezTokenDbActivities.map(activity => ({
        upperLimit: getIntervalLimit(activity, 1),
        lowerLimit: getIntervalLimit(activity)
      }));
      await tezosActivitiesIntervals.bulkAdd(intervalsLimits.map(limits => ({ ...limits, ...mainnetTezIntervalBase })));
      const newActivities = generateModifiedActivities([tezTokenDbActivities[2]], '');

      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: intervalsLimits[0].upperLimit
      });
      await checkTezosDbState(
        [
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: intervalsLimits[0].upperLimit,
            lowerLimit: intervalsLimits[2].lowerLimit
          }
        ],
        newActivities
      );

      await resetDb();
      await tezosActivities.bulkAdd(tezTokenAsAllAssetsDbActivities);
      await tezosActivitiesIntervals.bulkAdd(
        intervalsLimits.map(limits => ({ ...limits, ...mainnetAllAssetsIntervalBase }))
      );

      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: intervalsLimits[0].upperLimit
      });
      await checkTezosDbState(
        [
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: intervalsLimits[0].upperLimit,
            lowerLimit: intervalsLimits[2].lowerLimit
          }
        ],
        newActivities
      );
    });

    it('should crop intervals which are for certain assets, have newer activities, and intersect with a new one', async () => {
      const testIntervals = variousAssetsDbActivities.map((_, i) => ({
        ...makeMainnetIntervalBase(variousAssetsSlugs[i]),
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      }));
      await tezosActivities.bulkAdd(variousAssetsDbActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      const newActivities = generateModifiedActivities([variousAssetsDbActivities[2]], '');
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState(
        testIntervals
          .map(interval => ({
            ...interval,
            lowerLimit: getIntervalLimit(testAccountActivities[1])
          }))
          .concat({
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[1]),
            lowerLimit: getIntervalLimit(testAccountActivities[2])
          }),
        variousAssetsDbActivities.slice(0, 2).concat(newActivities)
      );
    });

    it('should replace the interval which is for all assets, has newer activities, and intersects with a new one, \
with a joined interval', async () => {
      const initialInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      };
      await tezosActivitiesIntervals.add(initialInterval);
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities.slice(0, 2));

      const newActivities = generateModifiedActivities(variousAllAssetsDbActivities.slice(1, 3));
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1], 1)
      });
      await checkTezosDbState(
        [
          {
            ...initialInterval,
            lowerLimit: getIntervalLimit(newActivities.at(-1)!)
          }
        ],
        [variousAllAssetsDbActivities[0], ...newActivities]
      );
    });

    it('should replace the interval which is for all assets, has newer activities and is neighboring with a new one, \
with a new joined interval', async () => {
      const initialInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      };
      await tezosActivitiesIntervals.add(initialInterval);
      const initialActivities = variousAllAssetsDbActivities.slice(0, 2);
      await tezosActivities.bulkAdd(initialActivities);
      const newActivities = [variousAllAssetsDbActivities[2]];
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[1])
      });
      await checkTezosDbState(
        [
          {
            ...initialInterval,
            lowerLimit: getIntervalLimit(newActivities[0])
          }
        ],
        initialActivities.concat(newActivities)
      );
    });

    it('should crop intervals which are for certain assets, have older activities, and intersect with a new one', async () => {
      const testIntervals = variousAssetsDbActivities.map((_, i) => ({
        ...makeMainnetIntervalBase(variousAssetsSlugs[i]),
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      }));
      await tezosActivities.bulkAdd(variousAssetsDbActivities);
      await tezosActivitiesIntervals.bulkAdd(testIntervals);

      const newActivities = generateModifiedActivities([variousAssetsDbActivities[0]], '');
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 1)
      });
      await checkTezosDbState(
        testIntervals
          .map(interval => ({
            ...interval,
            upperLimit: getIntervalLimit(testAccountActivities[0])
          }))
          .concat({
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[0], 1),
            lowerLimit: getIntervalLimit(testAccountActivities[0])
          }),
        variousAssetsDbActivities.slice(1, 3).concat(newActivities)
      );
    });

    it('should replace the interval which is for all assets, has older activities, and intersects with a new one, \
with a joined interval', async () => {
      const initialInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      };
      await tezosActivitiesIntervals.add(initialInterval);
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities.slice(1, 3));

      const newActivities = generateModifiedActivities(variousAllAssetsDbActivities.slice(0, 2));
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 1)
      });
      await checkTezosDbState(
        [
          {
            ...initialInterval,
            upperLimit: getIntervalLimit(testAccountActivities[0], 1)
          }
        ],
        [variousAllAssetsDbActivities[2], ...newActivities]
      );
    });

    it('should replace the interval which is for all assets, has older activities and is neighboring with a new one, \
with a new joined interval', async () => {
      const initialInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[1]),
        lowerLimit: getIntervalLimit(testAccountActivities[2])
      };
      await tezosActivitiesIntervals.add(initialInterval);
      const initialActivities = [variousAllAssetsDbActivities[2]];
      await tezosActivities.bulkAdd(initialActivities);
      const newActivities = variousAllAssetsDbActivities.slice(0, 2);
      await putTezosActivities({
        activities: newActivities,
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[0], 1)
      });
      await checkTezosDbState(
        [
          {
            ...initialInterval,
            upperLimit: getIntervalLimit(newActivities[0], 1)
          }
        ],
        initialActivities.concat(newActivities)
      );
    });

    it('should create a separate interval with all new activities if there is no intersection or neighboring', async () => {
      const testInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(testAccountActivities[0], 1),
        lowerLimit: getIntervalLimit(testAccountActivities[1])
      };
      await tezosActivities.bulkAdd(variousAllAssetsDbActivities.slice(0, 2));
      await tezosActivitiesIntervals.add(testInterval);

      await putTezosActivities({
        activities: [testAccountActivities[2]],
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        olderThan: getIntervalLimit(testAccountActivities[2], 2)
      });
      await checkTezosDbState(
        [
          testInterval,
          {
            ...mainnetAllAssetsIntervalBase,
            upperLimit: getIntervalLimit(testAccountActivities[2], 2),
            lowerLimit: getIntervalLimit(testAccountActivities[2])
          }
        ],
        variousAllAssetsDbActivities
      );
    });
  });

  describe('some new activities, both `olderThan` and `assetSlug` are specified', () => {
    it('should create a trimmed interval for the specified asset if there is an interval for all assets \
with newer operations that intersects', async () => {
      const initialActivities = tezTokenAsAllAssetsDbActivities.slice(0, 2);
      await tezosActivities.bulkAdd(initialActivities);
      const allAssetsInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[0], 1),
        lowerLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[1])
      };
      await tezosActivitiesIntervals.add(allAssetsInterval);

      await putTezosActivities({
        activities: tezTokenDbActivities.slice(1, 3),
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(tezTokenAsAllAssetsDbActivities[1], 10)
      });
      await checkTezosDbState(
        [
          allAssetsInterval,
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[1]),
            lowerLimit: getIntervalLimit(tezTokenDbActivities[2])
          }
        ],
        initialActivities.concat(tezTokenDbActivities[2])
      );
    });

    it('should create a trimmed interval for the specified asset if there is an interval for all assets \
with older operations that intersects', async () => {
      const initialActivities = tezTokenAsAllAssetsDbActivities.slice(1, 3);
      await tezosActivities.bulkAdd(initialActivities);
      const allAssetsInterval = {
        ...mainnetAllAssetsIntervalBase,
        upperLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[1], 1),
        lowerLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[2])
      };
      await tezosActivitiesIntervals.add(allAssetsInterval);

      await putTezosActivities({
        activities: tezTokenDbActivities.slice(0, 2),
        chainId: TempleTezosChainId.Mainnet,
        account: testAccountPkh,
        assetSlug: TEZ_TOKEN_SLUG,
        olderThan: getIntervalLimit(tezTokenAsAllAssetsDbActivities[0], 1)
      });
      await checkTezosDbState(
        [
          allAssetsInterval,
          {
            ...mainnetTezIntervalBase,
            upperLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[0], 1),
            lowerLimit: getIntervalLimit(tezTokenAsAllAssetsDbActivities[1], 1)
          }
        ],
        initialActivities.concat(tezTokenDbActivities[0])
      );
    });
  });

  it('should take the pointer of the latest transaction plus 1 step as the `olderThan` by default', async () => {
    await putTezosActivities({
      activities: testAccountActivities.slice(0, 3),
      chainId: TempleTezosChainId.Mainnet,
      account: testAccountPkh
    });
    await checkTezosDbState(
      [
        {
          ...mainnetAllAssetsIntervalBase,
          upperLimit: getIntervalLimit(testAccountActivities[0], 1),
          lowerLimit: getIntervalLimit(testAccountActivities[2])
        }
      ],
      testAccountActivities.slice(0, 3).map(activity => toDbTezosActivity(activity, '', testAccountPkh))
    );
  });
});
