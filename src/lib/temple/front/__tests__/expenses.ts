import BigNumber from 'bignumber.js';

import DELEGATE_OPERATIONS from '../__mocks__/delegateOperations';
import SWAP_OPERATIONS from '../__mocks__/swapOperations';
import TEZ_TRANSFER_OPERATIONS from '../__mocks__/tezTransferOperations';
import { tryParseExpenses } from '../expenses';

const ACCOUNT = 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o';

describe('Expenses', () => {
  it('tryParseExpenses tez transfer', async () => {
    const expenses = tryParseExpenses(TEZ_TRANSFER_OPERATIONS, ACCOUNT);

    expect(expenses).toStrictEqual([
      {
        amount: 99000000,
        contractAddress: undefined,
        expenses: [
          {
            amount: new BigNumber('99000000'),
            to: 'tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9'
          }
        ],
        isEntrypointInteraction: false,
        type: 'transaction'
      }
    ]);
  });

  it('tryParseExpenses delegate', async () => {
    const expenses = tryParseExpenses(DELEGATE_OPERATIONS, ACCOUNT);

    expect(expenses).toStrictEqual([
      {
        amount: 0,
        delegate: 'tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9',
        expenses: [],
        isEntrypointInteraction: false,
        type: 'delegation'
      }
    ]);
  });

  it('tryParseExpenses swap', async () => {
    const expenses = tryParseExpenses(SWAP_OPERATIONS, ACCOUNT);

    expect(expenses).toStrictEqual([
      {
        amount: 0,
        contractAddress: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
        expenses: [
          {
            amount: new BigNumber('0'),
            to: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj'
          }
        ],
        isEntrypointInteraction: true,
        type: 'update_operators'
      },
      {
        amount: 0,
        contractAddress: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus',
        expenses: [
          {
            amount: new BigNumber('0'),
            to: 'KT1T2BiwkP5goinYv81pX64kxCR1DUL7yNus'
          }
        ],
        isEntrypointInteraction: true,
        type: 'use'
      },
      {
        amount: 789964,
        contractAddress: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4',
        expenses: [
          {
            amount: new BigNumber('789964'),
            to: 'KT1GdCu6VyfijaARRx5tDPg4ZU2U8uQadBT4'
          }
        ],
        isEntrypointInteraction: true,
        type: 'use'
      },
      {
        amount: 0,
        contractAddress: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj',
        expenses: [
          {
            amount: new BigNumber('0'),
            to: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj'
          }
        ],
        isEntrypointInteraction: true,
        type: 'update_operators'
      }
    ]);
  });
});
