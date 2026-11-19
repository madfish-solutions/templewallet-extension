import { EvmChainCollectiblesInventory } from 'app/store/evm/collectibles-inventory/state';

import { alchemyInventoryCollections } from './inventory-collections';

const inventory = (
  loaded: EvmChainCollectiblesInventory['loaded'],
  distinctTokensOwned: number
): EvmChainCollectiblesInventory => ({
  settled: true,
  contracts: [{ address: '0xabc', name: 'Collection', distinctTokensOwned }],
  collections: [],
  loaded
});

const nft = (slug: string) => ({ slug, contractAddress: '0xabc', balance: '1' });

describe('alchemyInventoryCollections', () => {
  it('takes a hidden token off the card and its count', () => {
    const [card, slugs] = alchemyInventoryCollections(1, inventory([nft('0xabc_1'), nft('0xabc_2')], 2), {
      searching: false,
      excludedSlugs: new Set(['0xabc_1'])
    })[0];

    expect(slugs).toEqual(['evm:1:0xabc_2']);
    expect(card.ownedCount).toBe(1);
  });

  it('drops a card whose only token is hidden', () => {
    expect(
      alchemyInventoryCollections(1, inventory([nft('0xabc_1')], 1), {
        searching: false,
        excludedSlugs: new Set(['0xabc_1'])
      })
    ).toEqual([]);
  });
});
