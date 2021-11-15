import OPERATION_COMPLEX from '../__mocks__/operation_0';
import OPERATION_TOKEN_TRANSFER_ONLY from '../__mocks__/operation_1';
import OPERATION_LOCAL_ONLY from '../__mocks__/operation_2';
import { parseMoneyDiffs } from '../moneyDiffs';

const ACCOUNT = 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o';

describe('Money diffs', () => {
  it('parseMoneyDiffs complex', async () => {
    const moneyDiffs = parseMoneyDiffs(OPERATION_COMPLEX, ACCOUNT);

    expect(moneyDiffs).toStrictEqual([
      {
        assetId: 'KT1DaKxkR1LdnXW1tr7yozdwEAiSQDpCLUBj_0',
        diff: '-100'
      },
      {
        assetId: 'KT1P3RGEAa78XLTs3Hkpd1VWtryQRLDjiXqF_0',
        diff: '341'
      }
    ]);
  });

  it('parseMoneyDiffs token transfer only', async () => {
    const moneyDiffs = parseMoneyDiffs(OPERATION_TOKEN_TRANSFER_ONLY, ACCOUNT);

    expect(moneyDiffs).toStrictEqual([
      {
        assetId: 'KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV_0',
        diff: '162162162162162160000'
      }
    ]);
  });

  it('parseMoneyDiffs local only', async () => {
    const moneyDiffs = parseMoneyDiffs(OPERATION_LOCAL_ONLY, ACCOUNT);

    expect(moneyDiffs).toStrictEqual([
      {
        assetId: 'tez',
        diff: '-55000000'
      }
    ]);
  });
});
