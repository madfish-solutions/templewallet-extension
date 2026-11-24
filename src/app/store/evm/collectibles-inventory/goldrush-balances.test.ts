import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm';

import {
  closerOwnedCount,
  goldrushBalanceByContract,
  parseGoldrushContractBalance,
  withCloserGoldrushCounts
} from './goldrush-balances';
import { InventoryCollectionRef, InventoryContractRef } from './place-collections';

const CONTRACT = '0x02f6653457df91c92a2357460181f619299db793';

const contract = (address: string, distinctTokensOwned: number): InventoryContractRef => ({
  address,
  distinctTokensOwned
});

const collection = (addresses: string[]): InventoryCollectionRef => ({
  slug: 'named',
  name: 'Named',
  itemCount: 4,
  contractAddresses: addresses
});

describe('parseGoldrushContractBalance', () => {
  it('keeps a whole count and skips a balance that is not one', () => {
    expect(parseGoldrushContractBalance('3')).toBe(3);
    expect(parseGoldrushContractBalance('0')).toBe(0);
    expect(parseGoldrushContractBalance(null)).toBeUndefined();
    expect(parseGoldrushContractBalance('1.5')).toBeUndefined();
  });
});

describe('goldrushBalanceByContract', () => {
  it('indexes a returned contract balance by address', () => {
    const data: NftAddressBalanceNftResponse = {
      address: '0x4D85A924B1b137abf7acb9B0c07355a97460637E',
      updated_at: new Date(0),
      items: [
        {
          contract_name: 'Goldrush',
          contract_ticker_symbol: 'GR',
          contract_address: CONTRACT,
          supports_erc: ['erc721'],
          is_spam: false,
          last_transfered_at: new Date(0),
          balance: '2',
          balance_24h: '0',
          type: 'nft',
          floor_price_quote: 0,
          pretty_floor_price_quote: '0',
          floor_price_native_quote: 0,
          nft_data: []
        }
      ]
    };

    expect(goldrushBalanceByContract(data).get(CONTRACT)).toBe(2);
  });
});

describe('closerOwnedCount', () => {
  it('uses Goldrush when it is closer to the chain count', () => {
    expect(closerOwnedCount(10, 3, 2)).toBe(3);
  });

  it('keeps Alchemy when it is closer or the distance is the same', () => {
    expect(closerOwnedCount(2, 9, 2)).toBe(2);
    expect(closerOwnedCount(0, 4, 2)).toBe(0);
  });

  it('keeps Alchemy when Goldrush or the chain count is missing', () => {
    expect(closerOwnedCount(5, undefined, 2)).toBe(5);
    expect(closerOwnedCount(5, 1, null)).toBe(5);
  });
});

describe('withCloserGoldrushCounts', () => {
  it('replaces a contract card and leaves an OpenSea collection contract', () => {
    const goldrush = new Map([[CONTRACT, 2]]);
    const truth = new Map([[CONTRACT, 2]]);
    const other = '0x1111111111111111111111111111111111111111';
    const adjusted = withCloserGoldrushCounts(
      [contract(CONTRACT, 8), contract(other, 4)],
      [collection([other])],
      goldrush,
      truth
    );

    expect(adjusted.contracts.map(item => item.distinctTokensOwned)).toEqual([2, 4]);
    expect(adjusted.delta).toBe(-6);
  });
});
