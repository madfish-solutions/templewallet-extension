import 'core-js/actual/structured-clone';

import { pick } from 'lodash';

import { ActivityOperKindEnum, ActivityOperTransferType } from 'lib/activity';
import { TempleChainKind } from 'temple/types';

import { vitalikPkh, vitalikPkhLowercased } from './common-evm-mocks';
import { DbEvmActivity, NO_TOKEN_ID_VALUE, evmActivities, evmActivitiesIntervals, evmActivityAssets } from './db';
import { putEvmActivities, toFrontEvmActivity } from './evm';
import { checkDbState, resetDb } from './test-helpers';

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

const generateModifiedActivities = (activities: DbEvmActivity[]) =>
  activities.map(activity => {
    const originalAddedAtTs = new Date(activity.addedAt).getTime();

    return {
      ...activity,
      addedAt: new Date(originalAddedAtTs + 1000).toISOString()
    };
  });

const toActivitiesForCertainContract = (activities: DbEvmActivity[]) =>
  activities.map(activity => ({
    ...activity,
    contract: assets[activity.operations[0].fkAsset! as keyof typeof assets].contract
  }));

describe('putEvmActivities', () => {
  afterEach(resetDb);

  it('should throw an error if there are activities from different chains', async () => {
    expect(
      putEvmActivities({
        activities: [
          toFrontEvmActivity(activities[0], assets),
          {
            ...toFrontEvmActivity(activities[1], assets),
            chainId: 10
          }
        ],
        chainId: 1,
        account: vitalikPkh
      })
    ).rejects.toThrowError();
  });

  describe('no new activities, `olderThanBlockHeight` and `contractAddress` are specified', () => {
    it('should do nothing if there is a superset interval for all contracts', async () => {
      const activity = activities[0];
      const interval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        oldestBlockHeight: 0,
        newestBlockHeight: 21821430
      };

      await evmActivities.add(activity);
      await evmActivitiesIntervals.add(interval);
      await evmActivityAssets.add(assets[1]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821431',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState([interval], [activity], pick(assets, 1));

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821420',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState([interval], [activity], pick(assets, 1));
    });

    it('should only delete activities older than `olderThanBlockHeight` for the specified contract if there is a \
superset interval for the specified contract', async () => {
      const testActivities = toActivitiesForCertainContract([activities[1], activities[2]]);
      const interval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
        oldestBlockHeight: 0,
        newestBlockHeight: 21821430
      };

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.add(interval);
      const [firstAssetId] = await evmActivityAssets.bulkAdd([assets[1], assets[2]], { allKeys: true });
      await evmActivityAssets.delete(firstAssetId);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820077',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState([interval], testActivities, pick(assets, 2));

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820078',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState([interval], [testActivities[0]], pick(assets, 2));
    });

    it('should delete subset intervals for the specified contract', async () => {
      const testActivities = toActivitiesForCertainContract(activities.slice(0, 3));
      const intervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          oldestBlockHeight: 21821410,
          newestBlockHeight: 21821420
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          oldestBlockHeight: 21820080,
          newestBlockHeight: 21820090
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          oldestBlockHeight: 21820070,
          newestBlockHeight: 21820077
        }
      ];

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.bulkAdd(intervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821425',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          intervals[0],
          {
            ...intervals[1],
            oldestBlockHeight: 0,
            newestBlockHeight: 21821424
          }
        ],
        [testActivities[0]],
        pick(assets, 1)
      );
    });

    it('should create several intervals if there is at least one subset interval for all contracts', async () => {
      const testActivities = [activities[0], activities[1]];
      const intervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          oldestBlockHeight: 21821410,
          newestBlockHeight: 21821420
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          oldestBlockHeight: 21820080,
          newestBlockHeight: 21820090
        }
      ];
      const testAssets = [assets[1], assets[2]];
      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.bulkAdd(intervals);
      await evmActivityAssets.bulkAdd(testAssets);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821423',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState(
        intervals.concat([
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            oldestBlockHeight: 21821421,
            newestBlockHeight: 21821422
          },
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            oldestBlockHeight: 21820091,
            newestBlockHeight: 21821409
          },
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            oldestBlockHeight: 0,
            newestBlockHeight: 21820079
          }
        ]),
        testActivities,
        pick(assets, 1, 2)
      );

      await resetDb();
      await evmActivities.bulkAdd(testActivities);
      const intervals2 = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          oldestBlockHeight: 0,
          newestBlockHeight: 21820090
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          oldestBlockHeight: 21821410,
          newestBlockHeight: 21821420
        }
      ];
      await evmActivitiesIntervals.bulkAdd(intervals2);
      await evmActivityAssets.bulkAdd(testAssets);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821421',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState(
        intervals2.concat([
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            oldestBlockHeight: 21820091,
            newestBlockHeight: 21821409
          }
        ]),
        testActivities,
        pick(assets, 1, 2)
      );
    });

    it('should replace the interval which is for the specified contract, has newer activities, \
and intersects with a new one, with a joined interval', async () => {
      const testActivities = toActivitiesForCertainContract(activities.slice(0, 3));
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          oldestBlockHeight: 21820077,
          newestBlockHeight: 21821430
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          oldestBlockHeight: 21820077,
          newestBlockHeight: 21821430
        }
      ];

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            ...testIntervals[1],
            oldestBlockHeight: 0
          }
        ],
        [testActivities[0], testActivities[1]],
        pick(assets, 1, 2)
      );
    });

    it('should replace the interval which is for the specified contract, has newer activities and is neighboring \
with a new one, with a new joined interval', async () => {
      const testActivities = toActivitiesForCertainContract(activities.slice(0, 3));
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          oldestBlockHeight: 21820077,
          newestBlockHeight: 21821430
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          oldestBlockHeight: 21820077,
          newestBlockHeight: 21821430
        }
      ];

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820077',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            ...testIntervals[1],
            oldestBlockHeight: 0
          }
        ],
        testActivities,
        pick(assets, 1, 2)
      );
    });

    it('should create a trimmed interval for the specified contract if there is an interval for all contracts \
that intersects', async () => {
      const testActivities = [activities[0], activities[1]];
      const interval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        oldestBlockHeight: 21820086,
        newestBlockHeight: 21821430
      };

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.add(interval);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820087',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState(
        [
          interval,
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            oldestBlockHeight: 0,
            newestBlockHeight: 21820085
          }
        ],
        testActivities,
        pick(assets, 1, 2)
      );
    });

    it('should create a separate interval for the specified contract if there is an interval for all contracts \
that is neighboring', async () => {
      const testActivities = [activities[0], activities[1]];
      const interval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        oldestBlockHeight: 21820086,
        newestBlockHeight: 21821430
      };

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.add(interval);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState(
        [
          interval,
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            oldestBlockHeight: 0,
            newestBlockHeight: 21820085
          }
        ],
        testActivities,
        pick(assets, 1, 2)
      );
    });

    it('should create a separate interval if there is no intersection or neighboring', async () => {
      const testActivities = toActivitiesForCertainContract([activities[1], activities[2]]);
      const interval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
        oldestBlockHeight: 21820077,
        newestBlockHeight: 21820086
      };

      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.add(interval);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820076',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          interval,
          {
            ...interval,
            oldestBlockHeight: 0,
            newestBlockHeight: 21820075
          }
        ],
        testActivities,
        pick(assets, 1, 2)
      );
    });
  });

  describe('no new activities, `olderThanBlockHeight` is specified but `contractAddress` is undefined', () => {
    it('should only delete activities older than `olderThanBlockHeight` for all contracts if there is a \
superset interval for all contracts', async () => {
      await evmActivities.bulkAdd(activities);
      const interval = {
        chainId: 1,
        newestBlockHeight: 21821418,
        oldestBlockHeight: 0,
        account: vitalikPkhLowercased,
        contract: ''
      };
      await evmActivitiesIntervals.add(interval);
      await evmActivityAssets.bulkAdd(Object.values(assets));
      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086'
      });

      await checkDbState([interval], activities.slice(0, 2), pick(assets, 1, 2));
    });

    it('should crop superset intervals for certain contracts', async () => {
      const testActivities = toActivitiesForCertainContract(activities.slice(0, 2));
      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.bulkAdd([
        {
          chainId: 1,
          newestBlockHeight: 21821418,
          oldestBlockHeight: 0,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
        },
        {
          chainId: 1,
          newestBlockHeight: 21820086,
          oldestBlockHeight: 0,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
        }
      ]);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);
      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086'
      });

      await checkDbState(
        [
          {
            chainId: 1,
            newestBlockHeight: 21821418,
            oldestBlockHeight: 21820086,
            account: vitalikPkhLowercased,
            contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4'
          },
          {
            chainId: 1,
            newestBlockHeight: 21820086,
            oldestBlockHeight: 21820086,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
          },
          {
            chainId: 1,
            newestBlockHeight: 21820085,
            oldestBlockHeight: 0,
            account: vitalikPkhLowercased,
            contract: ''
          }
        ],
        testActivities.slice(0, 2),
        pick(assets, 1, 2)
      );
    });

    it('should delete subset intervals', async () => {
      await evmActivities.bulkAdd([
        { ...activities[1], contract: '' },
        ...toActivitiesForCertainContract(activities.slice(2, 4))
      ]);
      await evmActivitiesIntervals.bulkAdd([
        {
          chainId: 1,
          newestBlockHeight: 21820086,
          oldestBlockHeight: 21820078,
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          chainId: 1,
          newestBlockHeight: 21820077,
          oldestBlockHeight: 21817612,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
        },
        {
          chainId: 1,
          newestBlockHeight: 21817611,
          oldestBlockHeight: 0,
          account: vitalikPkhLowercased,
          contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9'
        }
      ]);
      const assetsIds = await evmActivityAssets.bulkAdd(Object.values(assets), { allKeys: true });
      await evmActivityAssets.delete(assetsIds[0]);
      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820087'
      });

      await checkDbState(
        [
          {
            chainId: 1,
            newestBlockHeight: 21820086,
            oldestBlockHeight: 0,
            account: vitalikPkhLowercased,
            contract: ''
          }
        ],
        [],
        {}
      );
    });

    it('should crop intervals which are for certain contracts, have newer activities, and intersect with a new one', async () => {
      const testActivities = toActivitiesForCertainContract(activities.slice(0, 3));
      await evmActivities.bulkAdd(testActivities);
      await evmActivitiesIntervals.bulkAdd([
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21817611
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21820086,
          oldestBlockHeight: 21817611
        }
      ]);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);
      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086',
        activities: []
      });
      await checkDbState(
        [
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
            newestBlockHeight: 21821418,
            oldestBlockHeight: 21820086
          },
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820086,
            oldestBlockHeight: 21820086
          },
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '',
            newestBlockHeight: 21820085,
            oldestBlockHeight: 0
          }
        ],
        testActivities.slice(0, 2),
        pick(assets, 1, 2)
      );
    });

    it('should replace the interval which is for all contracts, has newer activities, and intersects with a new one, \
with a joined interval', async () => {
      const testActivities = [activities[0]];
      await evmActivities.bulkAdd(testActivities);
      const testInterval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        newestBlockHeight: 21821418,
        oldestBlockHeight: 21820087
      };
      await evmActivitiesIntervals.add(testInterval);
      await evmActivityAssets.bulkAdd([assets[1]]);
      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820090'
      });
      await checkDbState([{ ...testInterval, oldestBlockHeight: 0 }], testActivities, pick(assets, 1));
    });

    it('should replace the interval which is for all contracts, has newer activities, and is neighboring with a new one, \
with a new joined interval', async () => {
      const testActivities = [activities[0]];
      await evmActivities.bulkAdd(testActivities);
      const testInterval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        newestBlockHeight: 21821418,
        oldestBlockHeight: 21820087
      };
      await evmActivitiesIntervals.add(testInterval);
      await evmActivityAssets.bulkAdd([assets[1]]);
      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820087'
      });
      await checkDbState([{ ...testInterval, oldestBlockHeight: 0 }], testActivities, pick(assets, 1));
    });

    it('should create a separate interval if there is no intersection or neighboring', async () => {
      const testActivities = [activities[0]];
      await evmActivities.bulkAdd(testActivities);
      const testInterval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        newestBlockHeight: 21821418,
        oldestBlockHeight: 21820087
      };
      await evmActivitiesIntervals.add(testInterval);
      await evmActivityAssets.bulkAdd([assets[1]]);
      await putEvmActivities({
        activities: [],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086'
      });
      await checkDbState(
        [
          testInterval,
          { chainId: 1, account: vitalikPkhLowercased, contract: '', newestBlockHeight: 21820085, oldestBlockHeight: 0 }
        ],
        testActivities,
        pick(assets, 1)
      );
    });
  });

  it('should do nothing if there are no activities to put and no `olderThanBlockHeight` is specified', async () => {
    const testActivities = activities.slice(0, 2);
    await evmActivities.bulkAdd(testActivities);
    const testIntervals = [
      {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        newestBlockHeight: 21821418,
        oldestBlockHeight: 21820087
      },
      {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
        newestBlockHeight: 21820086,
        oldestBlockHeight: 21820078
      }
    ];
    await evmActivitiesIntervals.bulkAdd(testIntervals);
    await evmActivityAssets.bulkAdd([assets[1], assets[2]]);
    await putEvmActivities({
      activities: [],
      chainId: 1,
      account: vitalikPkh,
      contractAddress: '0x2f375ce83ee85e505150d24e85a1742fd03ca593'
    });
    await checkDbState(testIntervals, testActivities, pick(assets, 1, 2));
    await putEvmActivities({
      activities: [],
      chainId: 1,
      account: vitalikPkh
    });
    await checkDbState(testIntervals, testActivities, pick(assets, 1, 2));
  });

  describe('some new activities, `olderThanBlockHeight` and `contractAddress` are specified', () => {
    it('should do nothing if there is a superset interval for all contracts', async () => {
      const prevActivity = activities[0];
      const prevInterval = {
        chainId: 1,
        account: vitalikPkhLowercased,
        contract: '',
        oldestBlockHeight: 21820080,
        newestBlockHeight: 21821430
      };
      const prevAsset = assets[1];

      await evmActivities.add(prevActivity);
      await evmActivitiesIntervals.add(prevInterval);
      await evmActivityAssets.add(prevAsset);

      await putEvmActivities({
        activities: [toFrontEvmActivity(activities[1], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821431',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState([prevInterval], [prevActivity], { 1: prevAsset });

      await putEvmActivities({
        activities: [toFrontEvmActivity(activities[1], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821420',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState([prevInterval], [prevActivity], { 1: prevAsset });
    });

    it('should only overwrite activites in the range of new activities for the specified contract if there is a \
superset interval for the specified contract', async () => {
      const testInitialActivities = toActivitiesForCertainContract(activities);
      const testModifiedActivities = generateModifiedActivities(testInitialActivities);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = Object.values(assets).map(({ contract }) => ({
        chainId: 1,
        account: vitalikPkhLowercased,
        contract,
        oldestBlockHeight: 21817611,
        newestBlockHeight: 21821418
      }));
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd(Object.values(assets));

      await putEvmActivities({
        activities: [toFrontEvmActivity(testModifiedActivities[2], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820086',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        testIntervals,
        [testInitialActivities[0], testInitialActivities[1], testInitialActivities[3], testModifiedActivities[2]],
        assets
      );

      await resetDb();
      await evmActivities.bulkAdd(testInitialActivities);
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd(Object.values(assets));
      await putEvmActivities({
        activities: [toFrontEvmActivity(testModifiedActivities[1], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821419',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        testIntervals,
        [testInitialActivities[0], testInitialActivities[2], testInitialActivities[3], testModifiedActivities[1]],
        assets
      );
    });

    it('should delete subset intervals for the specified contract and overwrite their activities', async () => {
      const testInitialActivities = toActivitiesForCertainContract(activities);
      const testModifiedActivities = generateModifiedActivities(testInitialActivities);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21821410
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21820086,
          oldestBlockHeight: 21820080
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21820078,
          oldestBlockHeight: 21820077
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
          newestBlockHeight: 21817611,
          oldestBlockHeight: 21817610
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd(Object.values(assets));

      await putEvmActivities({
        activities: [toFrontEvmActivity(testModifiedActivities[2], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820087',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          testIntervals[0],
          testIntervals[3],
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820086,
            oldestBlockHeight: 21820077
          }
        ],
        [testInitialActivities[0], testInitialActivities[3], testModifiedActivities[2]],
        assets
      );
    });

    it('should create several intervals and add only activities that belong to them if there is at least one subset \
interval for all contracts', async () => {
      const testInitialActivities = [activities[0], activities[2]];
      const testInitialAssets = [assets[1], assets[2]];
      const testModifiedActivities = generateModifiedActivities(activities);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21821410
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21820080,
          oldestBlockHeight: 21820077
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd(testInitialAssets);

      await putEvmActivities({
        activities: [
          toFrontEvmActivity(testModifiedActivities[1], assets),
          toFrontEvmActivity(testModifiedActivities[2], assets)
        ],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821419',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        testIntervals.concat([
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21821409,
            oldestBlockHeight: 21820081
          }
        ]),
        testInitialActivities.concat(testModifiedActivities[1]),
        pick(assets, 1, 2)
      );

      await resetDb();
      await evmActivities.bulkAdd(testInitialActivities);
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd(testInitialAssets);
      await putEvmActivities({
        activities: [toFrontEvmActivity(activities[3], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21821430',
        contractAddress: '0x7CE31075d7450Aff4A9a82DdDF69D451B1e0C4E9'
      });
      await checkDbState(
        testIntervals.concat([
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            newestBlockHeight: 21821429,
            oldestBlockHeight: 21821419
          },
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            newestBlockHeight: 21821409,
            oldestBlockHeight: 21820081
          },
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x7ce31075d7450aff4a9a82dddf69d451b1e0c4e9',
            newestBlockHeight: 21820076,
            oldestBlockHeight: 21817611
          }
        ]),
        testInitialActivities.concat(activities[3]),
        assets
      );
    });

    it('should replace the interval which is for the specified contract, has newer activities, \
and intersects with a new one, with a joined interval', async () => {
      const testInitialActivities = toActivitiesForCertainContract([activities[0], activities[1]]);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[2], assets)],
        olderThanBlockHeight: '21820083'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            ...testIntervals[1],
            oldestBlockHeight: 21820077
          }
        ],
        testInitialActivities.concat(toActivitiesForCertainContract([activities[2]])),
        pick(assets, 1, 2)
      );
    });

    it('should replace the interval which is for the specified contract, has newer activities and is neighboring \
with a new one, with a new joined interval', async () => {
      const testInitialActivities = toActivitiesForCertainContract([activities[0], activities[1]]);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0xe4e0dc08c6945ade56e8209e3473024abf29a9b4',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        },
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[2], assets)],
        olderThanBlockHeight: '21820080'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            ...testIntervals[1],
            oldestBlockHeight: 21820077
          }
        ],
        testInitialActivities.concat(toActivitiesForCertainContract([activities[2]])),
        pick(assets, 1, 2)
      );
    });

    it('should replace the interval which is for the specified contract, has older activities, \
and intersects with a new one, with a joined interval', async () => {
      const testInitialActivities = toActivitiesForCertainContract([activities[2]]);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21820090,
          oldestBlockHeight: 21820077
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      const [firstAssetId] = await evmActivityAssets.bulkAdd([assets[1], assets[2]], { allKeys: true });
      await evmActivityAssets.delete(firstAssetId);

      await putEvmActivities({
        activities: [toFrontEvmActivity(activities[1], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820099',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          {
            ...testIntervals[0],
            newestBlockHeight: 21820098
          }
        ],
        [activities[2], activities[1]],
        pick(assets, 2)
      );
    });

    it('should replace the interval which is for the specified contract, has newer activities and is neighboring \
with a new one, with a new joined interval', async () => {
      const testInitialActivities = toActivitiesForCertainContract([activities[2]]);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
          newestBlockHeight: 21820085,
          oldestBlockHeight: 21820077
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      const [firstAssetId] = await evmActivityAssets.bulkAdd([assets[1], assets[2]], { allKeys: true });
      await evmActivityAssets.delete(firstAssetId);

      await putEvmActivities({
        activities: [toFrontEvmActivity(activities[1], assets)],
        chainId: 1,
        account: vitalikPkh,
        olderThanBlockHeight: '21820099',
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593'
      });
      await checkDbState(
        [
          {
            ...testIntervals[0],
            newestBlockHeight: 21820098
          }
        ],
        [activities[2], activities[1]],
        pick(assets, 2)
      );
    });

    it('should create a trimmed interval for the specified contract and add only activities that belong to it \
if there is an interval with newer activities for all contracts that intersects', async () => {
      const testInitialActivities = activities.slice(0, 2);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[2], assets)],
        olderThanBlockHeight: '21820083'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820079,
            oldestBlockHeight: 21820077
          }
        ],
        testInitialActivities.concat(toActivitiesForCertainContract([activities[2]])),
        pick(assets, 1, 2)
      );
    });

    it('should create a separate interval for the specified contract if there is an interval with newer activities \
for all contracts that is neighboring', async () => {
      const testInitialActivities = activities.slice(0, 2);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[2], assets)],
        olderThanBlockHeight: '21820080'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820079,
            oldestBlockHeight: 21820077
          }
        ],
        testInitialActivities.concat(toActivitiesForCertainContract([activities[2]])),
        pick(assets, 1, 2)
      );
    });

    it('should create a trimmed interval for the specified contract and add only activities that belong to it \
if there is an interval with older activities for all contracts that intersects', async () => {
      const testInitialActivities = activities.slice(2, 4);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21820077,
          oldestBlockHeight: 21817611
        }
      ];
      const [modifiedActivity] = generateModifiedActivities([testInitialActivities[0]]);
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      const [firstAssetId] = await evmActivityAssets.bulkAdd(Object.values(assets), { allKeys: true });
      await evmActivityAssets.delete(firstAssetId);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[1], assets), toFrontEvmActivity(modifiedActivity, assets)],
        olderThanBlockHeight: '21820087'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820086,
            oldestBlockHeight: 21820078
          }
        ],
        testInitialActivities.concat(activities[1]),
        pick(assets, 2, 3)
      );
    });

    it('should create a separate interval for the specified contract if there is an interval with older activities \
      for all contracts that is neighboring', async () => {
      const testInitialActivities = activities.slice(2, 4);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21820085,
          oldestBlockHeight: 21817611
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      const [firstAssetId] = await evmActivityAssets.bulkAdd(Object.values(assets), { allKeys: true });
      await evmActivityAssets.delete(firstAssetId);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[1], assets)],
        olderThanBlockHeight: '21820087'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820086,
            oldestBlockHeight: 21820086
          }
        ],
        testInitialActivities.concat(activities[1]),
        pick(assets, 2, 3)
      );
    });

    it('should create a separate interval with all new activities if there is no intersection or neighboring', async () => {
      const testInitialActivities = toActivitiesForCertainContract([activities[0], activities[1]]);
      await evmActivities.bulkAdd(testInitialActivities);
      const testIntervals = [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21820080
        }
      ];
      await evmActivitiesIntervals.bulkAdd(testIntervals);
      await evmActivityAssets.bulkAdd([assets[1], assets[2]]);

      await putEvmActivities({
        chainId: 1,
        account: vitalikPkh,
        contractAddress: '0x2F375Ce83EE85e505150d24E85A1742fd03cA593',
        activities: [toFrontEvmActivity(activities[2], assets)],
        olderThanBlockHeight: '21820079'
      });
      await checkDbState(
        [
          testIntervals[0],
          {
            chainId: 1,
            account: vitalikPkhLowercased,
            contract: '0x2f375ce83ee85e505150d24e85a1742fd03ca593',
            newestBlockHeight: 21820078,
            oldestBlockHeight: 21820077
          }
        ],
        testInitialActivities.concat(toActivitiesForCertainContract([activities[2]])),
        pick(assets, 1, 2)
      );
    });
  });

  it('should take the block height of the latest transaction as the `olderThanBlockHeight` by default', async () => {
    await putEvmActivities({
      activities: activities.map(activity => toFrontEvmActivity(activity, assets)),
      chainId: 1,
      account: vitalikPkh
    });

    await checkDbState(
      [
        {
          chainId: 1,
          account: vitalikPkhLowercased,
          contract: '',
          newestBlockHeight: 21821418,
          oldestBlockHeight: 21817611
        }
      ],
      activities,
      assets
    );
  });
});
