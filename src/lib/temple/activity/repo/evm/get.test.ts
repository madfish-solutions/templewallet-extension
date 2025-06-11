import 'core-js/actual/structured-clone';

import { ActivityOperKindEnum, ActivityOperTransferType } from 'lib/activity';
import { VITALIK_ADDRESS } from 'lib/constants';
import { TempleChainKind } from 'temple/types';

import { getClosestEvmActivitiesInterval } from '..';
import { DbEvmActivity, NO_TOKEN_ID_VALUE, evmActivities, evmActivitiesIntervals, evmActivityAssets } from '../db';
import { resetDb } from '../test-helpers';

import { toEvmActivitiesForCertainContract, interactorPkh, vitalikPkhLowercased } from './test-helpers';
import { toFrontEvmActivity } from './utils';

describe('getClosestEvmActivitiesInterval', () => {
  const operation1 = {
    kind: ActivityOperKindEnum.transfer,
    type: ActivityOperTransferType.receiveFromAccount,
    fromAddress: '0x3dbaf8e89fc8a12cbc5d7aea21bf6d3bf0b83815',
    toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    logIndex: 1029,
    amountSigned: '11251326453126453120',
    fkAsset: 1
  };
  const operation2 = {
    kind: ActivityOperKindEnum.transfer,
    type: ActivityOperTransferType.receiveFromAccount,
    fromAddress: '0xae690b82b56379d899d57ac52ad2f4021265f245',
    toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    logIndex: 575,
    amountSigned: '7999000000000000000000',
    fkAsset: 2
  };
  const operation3 = {
    kind: ActivityOperKindEnum.transfer,
    type: ActivityOperTransferType.receiveFromAccount,
    fromAddress: '0xae690b82b56379d899d57ac52ad2f4021265f245',
    toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    logIndex: 309,
    amountSigned: '6674000000000000000000',
    fkAsset: 2
  };
  const operation4 = {
    kind: ActivityOperKindEnum.transfer,
    type: ActivityOperTransferType.receiveFromAccount,
    fromAddress: '0xc97dfc795b046653df9d06f022e7676190b5f406',
    toAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    logIndex: 483,
    amountSigned: '87500000000000000',
    fkAsset: 3
  };
  const activities: DbEvmActivity[] = [
    {
      chain: TempleChainKind.EVM,
      hash: '0x3ae1cc6f7c9361d573eeede46c678cd2d0678f772b64ff37301f91efb520806d',
      addedAt: '2025-02-11T06:13:59.000Z',
      operationsCount: 1,
      chainId: 1,
      blockHeight: 21821418,
      operations: [operation1],
      account: vitalikPkhLowercased,
      contract: ''
    },
    {
      chain: TempleChainKind.EVM,
      hash: '0xd7c78a15920a2d0819f865dfe14d593b6f08f40b2f2cbca1aae70bdac4a5be65',
      addedAt: '2025-02-11T01:45:47.000Z',
      operationsCount: 1,
      chainId: 1,
      blockHeight: 21820086,
      operations: [operation2],
      account: vitalikPkhLowercased,
      contract: ''
    },
    {
      chain: TempleChainKind.EVM,
      hash: '0x0985d2ead03c407decae3033b1a49653d684afc581b106c2619286f855ffb799',
      addedAt: '2025-02-11T01:43:59.000Z',
      operationsCount: 1,
      chainId: 1,
      blockHeight: 21820077,
      operations: [operation3],
      account: vitalikPkhLowercased,
      contract: ''
    },
    {
      chain: TempleChainKind.EVM,
      hash: '0x4e574e6dbb0dd72d00d1d8467c8fea3dc2d800e7d2ba69f6d9613037d788f8d7',
      addedAt: '2025-02-10T17:28:23.000Z',
      operationsCount: 1,
      chainId: 1,
      blockHeight: 21817611,
      operations: [operation4],
      account: vitalikPkhLowercased,
      contract: ''
    }
  ];
  const assets = {
    1: {
      contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
      symbol: 'CODE AIAGENT',
      decimals: 8,
      iconURL: 'https://logos.covalenthq.com/tokens/1/0xe4e0dc08c6945ade56e8209e3473024abf29a9b4.png',
      chainId: 1,
      tokenId: NO_TOKEN_ID_VALUE
    },
    2: {
      contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
      symbol: 'TST',
      decimals: 8,
      iconURL: 'https://logos.covalenthq.com/tokens/1/0x2f375ce83ee85e505150d24e85a1742fd03ca593.png',
      chainId: 1,
      tokenId: NO_TOKEN_ID_VALUE
    },
    3: {
      contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
      symbol: 'DEEPSEEK',
      decimals: 8,
      iconURL: 'https://logos.covalenthq.com/tokens/1/0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9.png',
      chainId: 1,
      tokenId: NO_TOKEN_ID_VALUE
    }
  };

  describe('history for all contracts', () => {
    afterEach(resetDb);

    it('should return `undefined` if there is no matching interval', async () => {
      const activityId = await evmActivities.add(activities[0]);
      const intervalId = await evmActivitiesIntervals.add({
        chainId: 1,
        account: vitalikPkhLowercased,
        oldestBlockHeight: 21821418,
        newestBlockHeight: 21821418,
        contract: ''
      });
      await evmActivityAssets.add(assets[1]);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821418',
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual(undefined);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 10,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual(undefined);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 1,
          account: interactorPkh
        })
      ).resolves.toEqual(undefined);

      await evmActivities.delete(activityId);
      await evmActivitiesIntervals.delete(intervalId);
      await evmActivities.add({
        ...activities[0],
        contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
      });
      await evmActivitiesIntervals.add({
        chainId: 1,
        account: vitalikPkhLowercased,
        oldestBlockHeight: 21821418,
        newestBlockHeight: 21821418,
        contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual(undefined);
    });

    it('should return activities from the closest matching interval that are older than the given block height', async () => {
      await evmActivities.bulkAdd(activities.slice(0, 3));
      await evmActivitiesIntervals.bulkAdd([
        {
          chainId: 1,
          newestBlockHeight: 21821420,
          oldestBlockHeight: 21820086,
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          chainId: 1,
          newestBlockHeight: 21820085,
          oldestBlockHeight: 21820077,
          account: vitalikPkhLowercased,
          contract: ''
        }
      ]);
      await evmActivityAssets.bulkAdd(Object.values(assets));

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821430',
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[0], assets), toFrontEvmActivity(activities[1], assets)],
        newestBlockHeight: 21821420,
        oldestBlockHeight: 21820086
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[0], assets), toFrontEvmActivity(activities[1], assets)],
        newestBlockHeight: 21821418,
        oldestBlockHeight: 21820086
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821418',
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[1], assets)],
        newestBlockHeight: 21821417,
        oldestBlockHeight: 21820086
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21820086',
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[2], assets)],
        newestBlockHeight: 21820085,
        oldestBlockHeight: 21820077
      });
    });

    it('should return activities from the newest relevant interval if `olderThanBlockHeight` is not provided', async () => {
      await evmActivities.bulkAdd(activities.slice(0, 3));
      await evmActivitiesIntervals.bulkAdd([
        {
          chainId: 1,
          newestBlockHeight: 21821420,
          oldestBlockHeight: 21820087,
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          chainId: 1,
          newestBlockHeight: 21820086,
          oldestBlockHeight: 21820077,
          account: vitalikPkhLowercased,
          contract: ''
        }
      ]);
      await evmActivityAssets.bulkAdd(Object.values(assets));

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[0], assets)],
        newestBlockHeight: 21821420,
        oldestBlockHeight: 21820087
      });

      await evmActivitiesIntervals.update(1, { contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4' });

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[1], assets), toFrontEvmActivity(activities[2], assets)],
        newestBlockHeight: 21820086,
        oldestBlockHeight: 21820077
      });
    });
  });

  describe('history for a certain contract', () => {
    afterEach(resetDb);

    it('should return `undefined` if there is no matching interval', async () => {
      await evmActivities.add(activities[0]);
      await evmActivitiesIntervals.add({
        chainId: 1,
        account: vitalikPkhLowercased,
        oldestBlockHeight: 21821418,
        newestBlockHeight: 21821418,
        contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
      });
      await evmActivityAssets.add(assets[1]);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821418',
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
        })
      ).resolves.toEqual(undefined);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 10,
          account: VITALIK_ADDRESS,
          contractAddress: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
        })
      ).resolves.toEqual(undefined);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 1,
          account: interactorPkh,
          contractAddress: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
        })
      ).resolves.toEqual(undefined);

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821419',
          chainId: 1,
          account: interactorPkh,
          contractAddress: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
        })
      ).resolves.toEqual(undefined);
    });

    it('should return activities from the closest matching interval that are older than the given block height \
and tokens are of the specified contract', async () => {
      await evmActivities.bulkAdd([
        activities[0],
        ...toEvmActivitiesForCertainContract(activities.slice(1, 4), assets)
      ]);
      await evmActivitiesIntervals.bulkAdd([
        {
          newestBlockHeight: 21821420,
          oldestBlockHeight: 21821401,
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          newestBlockHeight: 21821400,
          oldestBlockHeight: 21820086,
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
        },
        {
          newestBlockHeight: 21820085,
          oldestBlockHeight: 21817611,
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
        },
        {
          newestBlockHeight: 21820084,
          oldestBlockHeight: 21817610,
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9'
        }
      ]);
      await evmActivityAssets.bulkAdd(Object.values(assets));

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821430',
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0xe4e0dc08c6945ade56e8209E3473024ABF29A9b4'
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[0], assets)],
        newestBlockHeight: 21821420,
        oldestBlockHeight: 21821401
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821418',
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0xe4e0dc08c6945ade56e8209E3473024ABF29A9b4'
        })
      ).resolves.toEqual({
        activities: [],
        newestBlockHeight: 21821417,
        oldestBlockHeight: 21821401
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21821430',
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
        })
      ).resolves.toEqual({
        activities: [],
        newestBlockHeight: 21821420,
        oldestBlockHeight: 21821401
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21820086',
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[2], assets)],
        newestBlockHeight: 21820085,
        oldestBlockHeight: 21817611
      });

      await expect(
        getClosestEvmActivitiesInterval({
          olderThanBlockHeight: '21820086',
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[3], assets)],
        newestBlockHeight: 21820084,
        oldestBlockHeight: 21817610
      });
    });

    it('should return activities from the newest relevant interval if `olderThanBlockHeight` is not provided', async () => {
      const activitiesIds = await evmActivities.bulkAdd(
        [activities[0], ...toEvmActivitiesForCertainContract(activities.slice(1, 4), assets)],
        { allKeys: true }
      );
      const activitiesIntervalsIds = await evmActivitiesIntervals.bulkAdd(
        [
          {
            newestBlockHeight: 21821420,
            oldestBlockHeight: 21821401,
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: ''
          },
          {
            newestBlockHeight: 21821400,
            oldestBlockHeight: 21820086,
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
          },
          {
            newestBlockHeight: 21820085,
            oldestBlockHeight: 21817611,
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
          },
          {
            newestBlockHeight: 21820084,
            oldestBlockHeight: 21817610,
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9'
          }
        ],
        { allKeys: true }
      );
      await evmActivityAssets.bulkAdd(Object.values(assets));

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0xe4e0dc08c6945ade56e8209E3473024ABF29A9b4'
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[0], assets)],
        newestBlockHeight: 21821420,
        oldestBlockHeight: 21821401
      });

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
        })
      ).resolves.toEqual({
        activities: [],
        newestBlockHeight: 21821420,
        oldestBlockHeight: 21821401
      });

      await evmActivities.delete(activitiesIds[0]);
      await evmActivitiesIntervals.delete(activitiesIntervalsIds[0]);

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0xe4e0dc08c6945ade56e8209E3473024ABF29A9b4'
        })
      ).resolves.toEqual(undefined);

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[1], assets)],
        newestBlockHeight: 21821400,
        oldestBlockHeight: 21820086
      });

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
        })
      ).resolves.toEqual({
        activities: [toFrontEvmActivity(activities[3], assets)],
        newestBlockHeight: 21820084,
        oldestBlockHeight: 21817610
      });
    });
  });

  describe('limiting the number of returned activities', () => {
    const intervalUpperLimit = activities[0].blockHeight;
    const intervalLowerLimit = activities.at(-1)!.blockHeight;
    beforeAll(async () => {
      await evmActivities.bulkAdd(activities);
      await evmActivitiesIntervals.add({
        chainId: 1,
        account: vitalikPkhLowercased,
        newestBlockHeight: intervalUpperLimit,
        oldestBlockHeight: intervalLowerLimit,
        contract: ''
      });
      await evmActivityAssets.bulkAdd(Object.values(assets));
    });

    afterAll(resetDb);

    it('should return all matching activities by default', async () => {
      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS
        })
      ).resolves.toEqual({
        activities: activities.map(activity => toFrontEvmActivity(activity, assets)),
        newestBlockHeight: intervalUpperLimit,
        oldestBlockHeight: intervalLowerLimit
      });
    });

    it.each([Infinity, NaN, -1, 0, 1.5])('should ignore `maxItems` value of %d', async maxItems => {
      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          maxItems
        })
      ).resolves.toEqual({
        activities: activities.map(activity => toFrontEvmActivity(activity, assets)),
        newestBlockHeight: intervalUpperLimit,
        oldestBlockHeight: intervalLowerLimit
      });
    });

    it('should return not more than `maxItems` activities', async () => {
      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          maxItems: 3
        })
      ).resolves.toEqual({
        activities: activities.slice(0, 3).map(activity => toFrontEvmActivity(activity, assets)),
        newestBlockHeight: intervalUpperLimit,
        oldestBlockHeight: activities[2].blockHeight
      });

      await expect(
        getClosestEvmActivitiesInterval({
          chainId: 1,
          account: VITALIK_ADDRESS,
          maxItems: 3,
          contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
        })
      ).resolves.toEqual({
        activities: activities.slice(1, 3).map(activity => toFrontEvmActivity(activity, assets)),
        newestBlockHeight: intervalUpperLimit,
        oldestBlockHeight: activities[2].blockHeight
      });
    });
  });
});
