import { getAddress } from 'viem';

import { alchemyContractAddressesForSearch, directContractSearch } from './search-query';

const koda = '0xabb3738f04dc2ec20f4ae4462c3d069d02ae045b';

describe('directContractSearch', () => {
  it('reads a contract address and an optional token id', () => {
    expect(directContractSearch(`  ${koda}  `)).toEqual({ address: getAddress(koda) });
    expect(directContractSearch(`${koda}_26645003`)).toEqual({
      address: getAddress(koda),
      tokenId: '26645003'
    });
  });

  it('rejects a prefix and a non-address', () => {
    expect(directContractSearch(koda.slice(0, 12))).toBeUndefined();
    expect(directContractSearch('known-origin')).toBeUndefined();
  });
});

describe('alchemyContractAddressesForSearch', () => {
  const contracts = [
    { address: koda, name: 'KnownOriginDigitalAsset', distinctTokensOwned: 32 },
    { address: '0x1111111111111111111111111111111111111111', name: 'Alone', distinctTokensOwned: 2 },
    { address: '0x2222222222222222222222222222222222222222', name: 'Other', distinctTokensOwned: 1 }
  ];
  const collections = [
    {
      slug: 'known-origin',
      name: 'KnownOrigin',
      itemCount: 31,
      contractAddresses: [koda, '0xfbeef911dc5821886e1dda71586d90ed28174b7d']
    },
    {
      slug: 'virtuoso-creation',
      name: 'Virtuoso',
      itemCount: 1,
      contractAddresses: [koda]
    },
    {
      slug: 'solo-drop',
      name: 'Solo Drop',
      itemCount: 2,
      contractAddresses: ['0x1111111111111111111111111111111111111111']
    }
  ];

  it('matches a stored contract by address prefix', () => {
    expect(alchemyContractAddressesForSearch(koda.slice(0, 12), contracts, collections)).toEqual([koda]);
  });

  it('matches a single-collection contract by name and skips a shared host', () => {
    expect(alchemyContractAddressesForSearch('alone', contracts, collections)).toEqual([
      '0x1111111111111111111111111111111111111111'
    ]);
    expect(alchemyContractAddressesForSearch('solo', contracts, collections)).toEqual([
      '0x1111111111111111111111111111111111111111'
    ]);
    expect(alchemyContractAddressesForSearch('KnownOrigin', contracts, collections)).toEqual([
      '0xfbeef911dc5821886e1dda71586d90ed28174b7d'
    ]);
    expect(alchemyContractAddressesForSearch('virtuoso', contracts, collections)).toEqual([]);
  });

  it('leaves a short name and an exact address to their other paths', () => {
    expect(alchemyContractAddressesForSearch('al', contracts, collections)).toEqual([]);
    expect(alchemyContractAddressesForSearch(koda, contracts, collections)).toEqual([]);
  });
});
