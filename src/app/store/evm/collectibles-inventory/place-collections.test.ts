import { collectionImageForToken, placeInventoryCollections } from './place-collections';

const contract = (address: string, distinctTokensOwned: number, name?: string) => ({
  address,
  name,
  distinctTokensOwned
});

describe('placeInventoryCollections', () => {
  it('keeps a contract as one card until an OpenSea collection names it', () => {
    const cards = placeInventoryCollections(
      [contract('0xaaa', 4, 'Alone')],
      [],
      [{ slug: '0xaaa_1', contractAddress: '0xAaA' }]
    );

    expect(cards).toEqual([
      expect.objectContaining({
        id: 'contract:0xaaa',
        title: 'Alone',
        ownedCount: 4,
        slugs: ['0xaaa_1']
      })
    ]);
  });

  it('replaces a contract card with one card per OpenSea collection and keeps the owned count', () => {
    const cards = placeInventoryCollections(
      [contract('0xabb', 32, 'KnownOriginDigitalAsset')],
      [
        {
          slug: 'known-origin',
          name: 'KnownOrigin',
          itemCount: 31,
          contractAddresses: ['0xABB', '0xFBE']
        },
        {
          slug: 'other-drop',
          name: 'Other drop',
          itemCount: 1,
          contractAddresses: ['0xabb']
        }
      ],
      [
        { slug: '0xabb_1', contractAddress: '0xabb', collectionSlug: 'known-origin' },
        { slug: '0xabb_2', contractAddress: '0xabb', collectionSlug: 'other-drop' }
      ]
    );

    expect(cards.map(card => [card.id, card.ownedCount, card.slugs])).toEqual([
      ['collection:known-origin', 31, ['0xabb_1']],
      ['collection:other-drop', 1, ['0xabb_2']]
    ]);
  });

  it('puts one collection that spans two contracts on a single card', () => {
    const cards = placeInventoryCollections(
      [contract('0xabb', 20), contract('0xfbe', 11)],
      [
        {
          slug: 'known-origin',
          name: 'KnownOrigin',
          itemCount: 31,
          contractAddresses: ['0xabb', '0xfbe']
        }
      ],
      [
        { slug: '0xabb_1', contractAddress: '0xabb', collectionSlug: 'known-origin' },
        { slug: '0xfbe_2', contractAddress: '0xfbe', collectionSlug: 'known-origin' }
      ]
    );

    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual(
      expect.objectContaining({
        id: 'collection:known-origin',
        ownedCount: 31,
        slugs: ['0xabb_1', '0xfbe_2']
      })
    );
  });
});

describe('collectionImageForToken', () => {
  const inventory = {
    contracts: [{ address: '0xAbB', distinctTokensOwned: 2, name: 'Wearables', imageUrl: 'contract.png' }],
    collections: [
      {
        slug: 'the-philosopher-brand',
        name: 'The Philosopher Brand',
        imageUrl: 'collection.png',
        itemCount: 4,
        contractAddresses: ['0xabb']
      },
      {
        slug: 'other-wearables',
        name: 'Other',
        imageUrl: 'other.png',
        itemCount: 1,
        contractAddresses: ['0xabb']
      }
    ],
    loaded: [{ slug: '0xAbB_1', contractAddress: '0xAbB', collectionSlug: 'the-philosopher-brand' }]
  };

  it('uses the collection image shown on that token card', () => {
    expect(collectionImageForToken(inventory, '0xAbB_1')).toBe('collection.png');
  });

  it('uses the contract image when the card is the contract', () => {
    expect(
      collectionImageForToken({ contracts: inventory.contracts, collections: [], loaded: inventory.loaded }, '0xAbB_1')
    ).toBe('contract.png');
  });
});
