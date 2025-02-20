import 'core-js/actual/structured-clone';

import { pick } from 'lodash';

import { interactorPkh, interactorPkhLowercased, vitalikPkh, vitalikPkhLowercased } from './common-evm-mocks';
import { DbEvmActivity, NO_TOKEN_ID_VALUE, evmActivities, evmActivitiesIntervals, evmActivityAssets } from './db';
import rawDbInteractorActivities from './db-evm-delete-interactor-activities.json';
import rawDbVitalikActivities from './db-evm-delete-vitalik-activities.json';
import { deleteEvmActivitiesByAddress } from './evm';
import { checkDbState, resetDb } from './test-helpers';

const dbInteractorActivities = rawDbInteractorActivities as Omit<DbEvmActivity, 'account' | 'contract'>[];
const dbVitalikActivities = rawDbVitalikActivities as Omit<DbEvmActivity, 'account' | 'contract'>[];
const assets = {
  1: {
    contract: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    symbol: 'USDT',
    decimals: 6,
    iconURL: 'https://logos.covalenthq.com/tokens/10/0x94b008aa00579c1307b0ef2c499ad98a8ce58e58.png',
    chainId: 10,
    tokenId: NO_TOKEN_ID_VALUE
  },
  2: {
    contract: '0xCE677Ef463C413D6348FC7B44c5Cde9Dcee82a1F',
    symbol: 'vs2OCT',
    decimals: 18,
    iconURL: 'https://logos.covalenthq.com/tokens/10/0xce677ef463c413d6348fc7b44c5cde9dcee82a1f.png',
    chainId: 10,
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

describe('deleteEvmActivities', () => {
  afterEach(resetDb);

  beforeEach(async () => {
    await evmActivities.bulkAdd(
      dbInteractorActivities
        .map(activity => ({ ...activity, account: interactorPkhLowercased, contract: '' }))
        .concat(dbVitalikActivities.map(activity => ({ ...activity, account: vitalikPkhLowercased, contract: '' })))
    );
    await evmActivityAssets.bulkAdd(Object.values(assets));
    await evmActivitiesIntervals.bulkAdd([
      {
        chainId: 10,
        newestBlockHeight: 131799688,
        oldestBlockHeight: 131795308,
        account: interactorPkhLowercased,
        contract: ''
      },
      {
        chainId: 1,
        newestBlockHeight: 21817611,
        oldestBlockHeight: 21815333,
        account: vitalikPkhLowercased,
        contract: ''
      },
      {
        chainId: 10,
        newestBlockHeight: 131798516,
        oldestBlockHeight: 131795308,
        account: vitalikPkhLowercased,
        contract: ''
      }
    ]);
  });

  it('should remove only the data which is related only to Vitalik', async () => {
    await deleteEvmActivitiesByAddress(vitalikPkh);
    await checkDbState(
      [
        {
          chainId: 10,
          newestBlockHeight: 131799688,
          oldestBlockHeight: 131795308,
          account: interactorPkhLowercased,
          contract: ''
        }
      ],
      dbInteractorActivities.map(activity => ({ ...activity, account: interactorPkhLowercased, contract: '' })),
      pick(assets, 1, 2)
    );
  });

  it('should remove only the data which is related only to the account that interacted with him', async () => {
    await deleteEvmActivitiesByAddress(interactorPkh);
    await checkDbState(
      [
        {
          chainId: 1,
          newestBlockHeight: 21817611,
          oldestBlockHeight: 21815333,
          account: vitalikPkhLowercased,
          contract: ''
        },
        {
          chainId: 10,
          newestBlockHeight: 131798516,
          oldestBlockHeight: 131795308,
          account: vitalikPkhLowercased,
          contract: ''
        }
      ],
      dbVitalikActivities.map(activity => ({ ...activity, account: vitalikPkhLowercased, contract: '' })),
      pick(assets, 2, 3)
    );
  });
});
