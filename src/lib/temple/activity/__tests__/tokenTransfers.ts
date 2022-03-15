import TOKEN_TRANFER_FA1_2 from '../__mocks__/tokenTransfer_fa1_2';
import TOKEN_TRANSFER_FA2 from '../__mocks__/tokenTransfer_fa2';
import { tryParseTokenTransfers } from '../helpers';

interface TokenTransfer {
  tokenId: string;
  from: string;
  to: string;
  amount: string;
}

describe('Money diffs', () => {
  it('tryParseTokenTransfers FA1.2', async () => {
    const transfers: TokenTransfer[] = [];
    tryParseTokenTransfers(
      TOKEN_TRANFER_FA1_2.parameters,
      TOKEN_TRANFER_FA1_2.destination,
      (tokenId, from, to, amount) => {
        transfers.push({ tokenId, from, to, amount });
      }
    );

    expect(transfers).toStrictEqual([
      {
        tokenId: 'KT1NbznEfpxZZyPUNcSWRm9Y8qZkdEgWEFaV_0',
        from: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        to: 'tz1R3sPNAYaH2ZbweLpvvBnnJHHh1Zt68t7D',
        amount: '10000000000000000000'
      }
    ]);
  });

  it('tryParseTokenTransfers FA2', async () => {
    const transfers: TokenTransfer[] = [];
    tryParseTokenTransfers(
      TOKEN_TRANSFER_FA2.parameters,
      TOKEN_TRANSFER_FA2.destination,
      (tokenId, from, to, amount) => {
        transfers.push({ tokenId, from, to, amount });
      }
    );

    expect(transfers).toStrictEqual([
      {
        tokenId: 'KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6_0',
        from: 'tz3Qth49881bX2dymtRREEKkFnuKzvhBjr6o',
        to: 'tz1R3sPNAYaH2ZbweLpvvBnnJHHh1Zt68t7D',
        amount: '500'
      }
    ]);
  });
});
