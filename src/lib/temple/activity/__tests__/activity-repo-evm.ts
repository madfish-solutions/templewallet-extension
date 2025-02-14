import 'core-js/actual/structured-clone';

import { isDefined } from '@rnw-community/shared';
import { omit } from 'lodash';

import { EvmActivity, EvmActivityAsset } from 'lib/activity';

import { deleteEvmActivitiesByAddress, getClosestEvmActivitiesInterval, putEvmActivities } from '../repo';
import {
  DbEvmActivity,
  DbEvmActivityAsset,
  EvmActivitiesInterval,
  NO_TOKEN_ID_VALUE,
  db,
  evmActivities,
  evmActivitiesIntervals,
  evmActivityAssets
} from '../repo/db';

import rawDbInteractorActivity from './db-interactor-activity.json';
import rawDbVitalikActivityPart1 from './db-vitalik-activity-part1.json';
import rawDbVitalikActivityPart2 from './db-vitalik-activity-part2.json';
import rawInteractorActivityAssets from './interactor-activity-assets.json';
import rawInteractorActivity from './interactor-activity.json';
import rawVitalikActivityPart1 from './vitalik-activity-part1.json';
import rawVitalikActivityPart2 from './vitalik-activity-part2.json';
import rawVitalikActivityPartsAssets from './vitalik-activity-parts-assets.json';

const dbInteractorActivity = rawDbInteractorActivity as Omit<DbEvmActivity, 'account'>[];
const dbVitalikActivityPart1 = rawDbVitalikActivityPart1 as Omit<DbEvmActivity, 'account'>[];
const dbVitalikActivityPart2 = rawDbVitalikActivityPart2 as Omit<DbEvmActivity, 'account'>[];
const interactorActivity = rawInteractorActivity as EvmActivity[];
const vitalikActivityPart1 = rawVitalikActivityPart1 as EvmActivity[];
const vitalikActivityPart2 = rawVitalikActivityPart2 as EvmActivity[];
const interactorActivityAssets = rawInteractorActivityAssets as Array<
  Omit<EvmActivityAsset, 'amountSigned'> & { chainId: number }
>;
const vitalikActivityPartsAssets = rawVitalikActivityPartsAssets as Array<
  Omit<EvmActivityAsset, 'amountSigned'> & { chainId: number }
>;

const vitalikPkh: HexString = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
const vitalikPkhLowercased = vitalikPkh.toLowerCase() as HexString;
const interactorPkh: HexString = '0xbe09893cafe9d2cc02a1ad60853f2c835c3056ae';
const interactorPkhLowercased = interactorPkh.toLowerCase() as HexString;
const dbEthVitalikActivityPart1 = dbVitalikActivityPart1.filter(({ chainId }) => chainId === 1);
const ethVitalikActivityPart1 = vitalikActivityPart1.filter(({ chainId }) => chainId === 1);
const dbEthVitalikActivityPart2 = dbVitalikActivityPart2.filter(({ chainId }) => chainId === 1);
const ethVitalikActivityPart2 = vitalikActivityPart2.filter(({ chainId }) => chainId === 1);

if (!('structuredClone' in globalThis)) {
  globalThis.structuredClone = structuredClone;
}

describe('Activities DB', () => {
  const assetsSortPredicate = (
    { contract: aContract, tokenId: aTokenId = '' }: Pick<EvmActivityAsset, 'contract' | 'tokenId'>,
    { contract: bContract, tokenId: bTokenId = '' }: Pick<EvmActivityAsset, 'contract' | 'tokenId'>
  ) => {
    if (aContract === bContract) {
      return aTokenId.localeCompare(bTokenId);
    }

    return aContract.localeCompare(bContract);
  };

  const expectDbState = async (
    expectedActivities: (EvmActivity & { account: HexString })[],
    expectedIntervals: EvmActivitiesInterval[],
    expectedAssets: Omit<DbEvmActivityAsset, 'id'>[]
  ) => {
    const sortedExpectedActivities = expectedActivities.toSorted(
      (a, b) => Number(b.blockHeight) - Number(a.blockHeight)
    );
    const sortedExpectedIntervals = expectedIntervals.toSorted((a, b) => b.oldestBlockHeight - a.oldestBlockHeight);
    const activitiesFromDb = (await evmActivities.reverse().sortBy('blockHeight')).map(activity =>
      omit(activity, 'id')
    );
    const intervalsFromDb = (await evmActivitiesIntervals.reverse().sortBy('oldestBlockHeight')).map(interval =>
      omit(interval, 'id')
    );
    const assetsFromDb = await evmActivityAssets.toArray();
    const assetsFromDbIds = await evmActivityAssets.toCollection().primaryKeys();
    const actualActivities = activitiesFromDb.map(({ operations, blockHeight, ...activity }) => ({
      ...activity,
      blockHeight: String(blockHeight),
      operations: operations.map(({ fkAsset, amountSigned, ...operation }) => ({
        ...operation,
        asset: (() => {
          if (!isDefined(fkAsset)) {
            return undefined;
          }

          const { chainId, id, tokenId, ...asset } = assetsFromDb[assetsFromDbIds.indexOf(fkAsset)];

          const resultBase = { ...asset, amountSigned };

          if (tokenId !== NO_TOKEN_ID_VALUE) {
            return { ...resultBase, tokenId };
          }

          return resultBase;
        })()
      }))
    }));
    // console.log('oy vey 2', JSON.stringify({ assetsFromDb, intervalsFromDb, activitiesFromDb }));
    expect(intervalsFromDb).toEqual(sortedExpectedIntervals);
    expect(actualActivities).toEqual(sortedExpectedActivities);
    expect(assetsFromDb.map(({ id, ...asset }) => asset).sort(assetsSortPredicate)).toEqual(
      expectedAssets.sort(assetsSortPredicate)
    );
  };

  const resetDb = async () => {
    await db.delete();
    await db.open();
  };

  const insertFullDataSet = async () => {
    await evmActivitiesIntervals.bulkAdd([
      { chainId: 1, account: vitalikPkhLowercased, oldestBlockHeight: 21792864, newestBlockHeight: 21821418 },
      { chainId: 10, account: vitalikPkhLowercased, oldestBlockHeight: 131798516, newestBlockHeight: 131798516 },
      { chainId: 56, account: vitalikPkhLowercased, oldestBlockHeight: 46510527, newestBlockHeight: 46510527 },
      { chainId: 137, account: vitalikPkhLowercased, oldestBlockHeight: 67722210, newestBlockHeight: 67722210 },
      { chainId: 1, account: vitalikPkhLowercased, oldestBlockHeight: 21755593, newestBlockHeight: 21792842 },
      { chainId: 56, account: vitalikPkhLowercased, oldestBlockHeight: 46305530, newestBlockHeight: 46391420 },
      { chainId: 137, account: vitalikPkhLowercased, oldestBlockHeight: 67463030, newestBlockHeight: 67465071 },
      { chainId: 10, account: interactorPkhLowercased, oldestBlockHeight: 131281237, newestBlockHeight: 131799688 }
    ]);
    await evmActivityAssets.bulkAdd(
      vitalikActivityPartsAssets
        .concat(interactorActivityAssets.slice(0, 1))
        .map(({ tokenId, ...rest }) => ({ ...rest, tokenId: tokenId ?? NO_TOKEN_ID_VALUE }))
    );
    await evmActivities.bulkAdd(
      dbVitalikActivityPart2
        .concat(dbVitalikActivityPart1)
        .map(({ hash, chainId, ...activity }) => ({
          ...activity,
          hash,
          chainId,
          account: vitalikPkhLowercased
        }))
        .concat(dbInteractorActivity.map(activity => ({ ...activity, account: interactorPkhLowercased })))
    );
  };

  describe('getClosestEvmActivitiesInterval', () => {
    beforeAll(insertFullDataSet);

    it('should return an empty array if there is no matching interval', async () => {
      await expect(getClosestEvmActivitiesInterval('131798516', 10, vitalikPkh)).resolves.toEqual({
        activities: [],
        newestBlockHeight: 131798516,
        oldestBlockHeight: 131798516
      });
      await expect(getClosestEvmActivitiesInterval('131798515', 10, vitalikPkh)).resolves.toEqual({
        activities: [],
        newestBlockHeight: 131798515,
        oldestBlockHeight: 131798515
      });
      await expect(getClosestEvmActivitiesInterval('21755593', 1, vitalikPkh)).resolves.toEqual({
        activities: [],
        newestBlockHeight: 21755593,
        oldestBlockHeight: 21755593
      });
      await expect(getClosestEvmActivitiesInterval('21755592', 1, vitalikPkh)).resolves.toEqual({
        activities: [],
        newestBlockHeight: 21755592,
        oldestBlockHeight: 21755592
      });
      await expect(
        getClosestEvmActivitiesInterval(undefined, 1, '0xb35DC45877384AB8006e3707e1698C9Ff67cDEc1')
      ).resolves.toEqual({
        activities: [],
        newestBlockHeight: 0,
        oldestBlockHeight: 0
      });
    });

    it('should return activities from the closest matching interval that are older than the given block height', async () => {
      await expect(getClosestEvmActivitiesInterval('67463061', 137, vitalikPkh)).resolves.toEqual({
        activities: [vitalikActivityPart2[15], vitalikActivityPart2[16]],
        newestBlockHeight: 67463060,
        oldestBlockHeight: 67463030
      });
      await expect(getClosestEvmActivitiesInterval('67465080', 137, vitalikPkh)).resolves.toEqual({
        activities: [
          vitalikActivityPart2[13],
          vitalikActivityPart2[14],
          vitalikActivityPart2[15],
          vitalikActivityPart2[16]
        ],
        newestBlockHeight: 67465071,
        oldestBlockHeight: 67463030
      });
      await expect(getClosestEvmActivitiesInterval('131798517', 10, vitalikPkh)).resolves.toEqual({
        activities: [vitalikActivityPart1[4]],
        newestBlockHeight: 131798516,
        oldestBlockHeight: 131798516
      });
      await expect(getClosestEvmActivitiesInterval('131281238', 10, interactorPkh)).resolves.toEqual({
        activities: [interactorActivity.at(-1)],
        newestBlockHeight: 131281237,
        oldestBlockHeight: 131281237
      });
    });

    it('should return activities from the newest relevant interval if `olderThanBlockHeight` is not provided', async () => {
      await expect(getClosestEvmActivitiesInterval(undefined, 1, vitalikPkh)).resolves.toEqual({
        activities: vitalikActivityPart1.filter(({ chainId }) => chainId === 1),
        newestBlockHeight: 21821418,
        oldestBlockHeight: 21792864
      });
    });

    afterAll(resetDb);
  });

  describe('putEvmActivities', () => {
    afterEach(resetDb);

    describe('no new activities', () => {
      it('should do nothing if `olderThanBlockHeight` is not provided', async () => {
        await putEvmActivities([], 1, vitalikPkh, undefined);
        await expectDbState([], [], []);
      });

      it('should add only an empty interval if `olderThanBlockHeight` is provided and the DB is empty', async () => {
        await putEvmActivities([], 1, vitalikPkh, '21821418');
        await expectDbState(
          [],
          [{ chainId: 1, account: vitalikPkhLowercased, newestBlockHeight: 21821417, oldestBlockHeight: 0 }],
          []
        );
      });

      it('should only remove activities from the appropriate block levels and no longer used assets if \
  `olderThanBlockHeight` is provided and there is an interval that embraces the interval [0, `olderThanBlockHeight`)', async () => {
        await evmActivitiesIntervals.add({
          chainId: 1,
          account: vitalikPkhLowercased,
          oldestBlockHeight: 0,
          newestBlockHeight: 21792842
        });
        const assetsIds = await evmActivityAssets.bulkAdd(
          vitalikActivityPartsAssets.map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          })),
          { allKeys: true }
        );
        const testActivities = dbEthVitalikActivityPart2.map(activity => ({
          ...activity,
          account: vitalikPkhLowercased
        }));
        await evmActivityAssets.bulkDelete(
          assetsIds.filter(
            id => !testActivities.some(({ operations }) => operations.some(({ fkAsset }) => fkAsset === id))
          )
        );
        await evmActivities.bulkAdd(testActivities);
        await putEvmActivities([], 1, vitalikPkh, '21783161');
        await expectDbState(
          ethVitalikActivityPart2.slice(0, 4).map(activity => ({ ...activity, account: vitalikPkhLowercased })),
          [
            {
              chainId: 1,
              account: vitalikPkhLowercased,
              oldestBlockHeight: 0,
              newestBlockHeight: 21792842
            }
          ],
          [vitalikActivityPartsAssets[2], vitalikActivityPartsAssets[4]].map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          }))
        );
      });

      it('should join the intervals if `olderThanBlockHeight` is provided and there is an interval \
[`olderThanBlockHeight`, x]', async () => {
        await evmActivitiesIntervals.add({
          chainId: 1,
          account: vitalikPkhLowercased,
          oldestBlockHeight: 21792864,
          newestBlockHeight: 21821418
        });
        await evmActivities.bulkAdd(
          dbEthVitalikActivityPart1.map(activity => ({
            ...activity,
            account: vitalikPkhLowercased
          }))
        );
        const assets = vitalikActivityPartsAssets.map(({ tokenId, ...rest }) => ({
          ...rest,
          tokenId: tokenId ?? NO_TOKEN_ID_VALUE
        }));
        await evmActivityAssets.bulkAdd(assets);
        await putEvmActivities([], 1, vitalikPkh, '21792864');
        await expectDbState(
          ethVitalikActivityPart1.map(activity => ({ ...activity, account: vitalikPkhLowercased })),
          [{ chainId: 1, account: vitalikPkhLowercased, newestBlockHeight: 21821418, oldestBlockHeight: 0 }],
          assets
        );
      });
    });

    it('should throw an error if there is at least one activity from another chain than the specified one', async () => {
      expect(
        putEvmActivities(
          ethVitalikActivityPart2.concat(vitalikActivityPart2.filter(({ chainId }) => chainId === 137)),
          1,
          vitalikPkh,
          undefined
        )
      ).rejects.toBeTruthy();
    });

    it('should put new activities into empty DB with undefined `olderThanBlockHeight`', async () => {
      await putEvmActivities(ethVitalikActivityPart1, 1, vitalikPkh, undefined);
      await expectDbState(
        ethVitalikActivityPart1.map(activity => ({ ...activity, account: vitalikPkhLowercased })),
        [{ chainId: 1, account: vitalikPkhLowercased, newestBlockHeight: 21821418, oldestBlockHeight: 21792864 }],
        vitalikActivityPartsAssets
          .map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          }))
          .filter((_, i) =>
            dbEthVitalikActivityPart1.some(({ operations }) => operations.some(({ fkAsset }) => fkAsset === i + 1))
          )
      );
    });

    it('should put new activities into empty DB with the specified `olderThanBlockHeight`', async () => {
      await putEvmActivities(ethVitalikActivityPart1, 1, vitalikPkh, '21821420');
      await expectDbState(
        ethVitalikActivityPart1.map(activity => ({ ...activity, account: vitalikPkhLowercased })),
        [{ chainId: 1, account: vitalikPkhLowercased, newestBlockHeight: 21821419, oldestBlockHeight: 21792864 }],
        vitalikActivityPartsAssets
          .map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          }))
          .filter((_, i) =>
            dbEthVitalikActivityPart1.some(({ operations }) => operations.some(({ fkAsset }) => fkAsset === i + 1))
          )
      );
    });

    it('should overwrite activities with the same chain ID and account address having block height that is in the \
range of new activities', async () => {
      await evmActivitiesIntervals.bulkAdd([
        { chainId: 10, account: vitalikPkhLowercased, oldestBlockHeight: 131798516, newestBlockHeight: 131798516 },
        { chainId: 10, account: interactorPkhLowercased, oldestBlockHeight: 131281237, newestBlockHeight: 131799688 }
      ]);
      const testActivities = dbVitalikActivityPart1
        .filter(({ chainId }) => chainId === 10)
        .map(activity => ({
          ...activity,
          account: vitalikPkhLowercased
        }))
        .concat(dbInteractorActivity.map(activity => ({ ...activity, account: interactorPkhLowercased })));
      await evmActivities.bulkAdd(testActivities);
      const assetsIds = await evmActivityAssets.bulkAdd(
        vitalikActivityPartsAssets
          .concat(interactorActivityAssets.slice(0, 1))
          .map(({ tokenId, ...rest }) => ({ ...rest, tokenId: tokenId ?? NO_TOKEN_ID_VALUE })),
        { allKeys: true }
      );
      await evmActivityAssets.bulkDelete(
        assetsIds.filter(
          id => !testActivities.some(({ operations }) => operations.some(({ fkAsset }) => fkAsset === id))
        )
      );
      await putEvmActivities([interactorActivity[3]], 10, interactorPkh, '131799688');
      await expectDbState(
        [
          { ...interactorActivity[0], account: interactorPkhLowercased },
          { ...vitalikActivityPart1[4], account: vitalikPkhLowercased },
          { ...interactorActivity[3], account: interactorPkhLowercased },
          { ...interactorActivity[4], account: interactorPkhLowercased }
        ],
        [
          { chainId: 10, account: vitalikPkhLowercased, oldestBlockHeight: 131798516, newestBlockHeight: 131798516 },
          { chainId: 10, account: interactorPkhLowercased, oldestBlockHeight: 131281237, newestBlockHeight: 131799688 }
        ],
        [
          {
            contract: '0xCE677Ef463C413D6348FC7B44c5Cde9Dcee82a1F',
            tokenId: NO_TOKEN_ID_VALUE,
            chainId: 10,
            symbol: 'vs2OCT',
            decimals: 18,
            iconURL: 'https://logos.covalenthq.com/tokens/10/0xce677ef463c413d6348fc7b44c5cde9dcee82a1f.png'
          },
          {
            contract: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            tokenId: NO_TOKEN_ID_VALUE,
            chainId: 10,
            symbol: 'USDT',
            decimals: 6,
            iconURL: 'https://logos.covalenthq.com/tokens/10/0x94b008aa00579c1307b0ef2c499ad98a8ce58e58.png'
          }
        ]
      );
    });

    describe('intervals management', () => {
      it('should create an extended interval with older activities if the oldest new activity gets into the interval', async () => {
        await evmActivitiesIntervals.add({
          chainId: 1,
          account: vitalikPkhLowercased,
          oldestBlockHeight: 21755593,
          newestBlockHeight: 21792864
        });
        const assetsIds = await evmActivityAssets.bulkAdd(
          vitalikActivityPartsAssets.map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          })),
          { allKeys: true }
        );
        const testActivities = dbEthVitalikActivityPart2.map(activity => ({
          ...activity,
          account: vitalikPkhLowercased
        }));
        await evmActivityAssets.bulkDelete(
          assetsIds.filter(
            id => !testActivities.some(({ operations }) => operations.some(({ fkAsset }) => fkAsset === id))
          )
        );
        await evmActivities.bulkAdd(testActivities);
        await putEvmActivities(ethVitalikActivityPart1, 1, vitalikPkh, undefined);
        await expectDbState(
          ethVitalikActivityPart1
            .concat(ethVitalikActivityPart2)
            .map(activity => ({ ...activity, account: vitalikPkhLowercased })),
          [{ chainId: 1, account: vitalikPkhLowercased, newestBlockHeight: 21821418, oldestBlockHeight: 21755593 }],
          vitalikActivityPartsAssets
            .filter(({ chainId }) => chainId === 1)
            .map(({ tokenId, ...rest }) => ({
              ...rest,
              tokenId: tokenId ?? NO_TOKEN_ID_VALUE
            }))
        );
      });

      it('should create an extended interval with newer activities if `olderThanBlockHeight` is the edge of the interval', async () => {
        await evmActivitiesIntervals.add({
          chainId: 1,
          account: vitalikPkhLowercased,
          oldestBlockHeight: 21820086,
          newestBlockHeight: 21821418
        });
        const assetsIds = await evmActivityAssets.bulkAdd(
          vitalikActivityPartsAssets.map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          })),
          { allKeys: true }
        );
        const testActivities = dbEthVitalikActivityPart1.slice(0, 2).map(activity => ({
          ...activity,
          account: vitalikPkhLowercased
        }));
        await evmActivityAssets.bulkDelete(
          assetsIds.filter(
            id => !testActivities.some(({ operations }) => operations.some(({ fkAsset }) => fkAsset === id))
          )
        );
        await evmActivities.bulkAdd(testActivities);
        await putEvmActivities(ethVitalikActivityPart1.slice(2, 4), 1, vitalikPkh, '21820086');
        await expectDbState(
          vitalikActivityPart1.slice(0, 4).map(activity => ({ ...activity, account: vitalikPkhLowercased })),
          [{ chainId: 1, account: vitalikPkhLowercased, newestBlockHeight: 21821418, oldestBlockHeight: 21817611 }],
          vitalikActivityPartsAssets.slice(0, 3).map(({ tokenId, ...rest }) => ({
            ...rest,
            tokenId: tokenId ?? NO_TOKEN_ID_VALUE
          }))
        );
      });
    });
  });

  describe('deleteEvmActivities', () => {
    afterEach(resetDb);

    it('should remove only the data which is related to Vitalik', async () => {
      await insertFullDataSet();
      await deleteEvmActivitiesByAddress(vitalikPkh);
      await expectDbState(
        interactorActivity.map(activity => ({ ...activity, account: interactorPkhLowercased })),
        [{ chainId: 10, account: interactorPkhLowercased, oldestBlockHeight: 131281237, newestBlockHeight: 131799688 }],
        interactorActivityAssets.map(({ tokenId, ...rest }) => ({
          ...rest,
          tokenId: tokenId ?? NO_TOKEN_ID_VALUE
        }))
      );
    });

    it('should remove only the data which is related to the account that interacted with him', async () => {
      await insertFullDataSet();
      await deleteEvmActivitiesByAddress(interactorPkh);
      await expectDbState(
        vitalikActivityPart1
          .concat(vitalikActivityPart2)
          .map(activity => ({ ...activity, account: vitalikPkhLowercased })),
        [
          { chainId: 1, account: vitalikPkhLowercased, oldestBlockHeight: 21792864, newestBlockHeight: 21821418 },
          { chainId: 10, account: vitalikPkhLowercased, oldestBlockHeight: 131798516, newestBlockHeight: 131798516 },
          { chainId: 56, account: vitalikPkhLowercased, oldestBlockHeight: 46510527, newestBlockHeight: 46510527 },
          { chainId: 137, account: vitalikPkhLowercased, oldestBlockHeight: 67722210, newestBlockHeight: 67722210 },
          { chainId: 1, account: vitalikPkhLowercased, oldestBlockHeight: 21755593, newestBlockHeight: 21792842 },
          { chainId: 56, account: vitalikPkhLowercased, oldestBlockHeight: 46305530, newestBlockHeight: 46391420 },
          { chainId: 137, account: vitalikPkhLowercased, oldestBlockHeight: 67463030, newestBlockHeight: 67465071 }
        ],
        vitalikActivityPartsAssets.map(({ tokenId, ...rest }) => ({
          ...rest,
          tokenId: tokenId ?? NO_TOKEN_ID_VALUE
        }))
      );
    });
  });
});
