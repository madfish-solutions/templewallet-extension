import { toChainAssetSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

import { isStorefrontPseudocollection, orderCollections } from './order-collections';

const collection = (collectionSlug: string, chainSlugs: string[], pinnedToBottom = false) => ({
  collectionSlug,
  chainSlugs,
  pinnedToBottom
});

describe('orderCollections', () => {
  it('orders collections by size and keeps equal sizes in the incoming order', () => {
    const order = orderCollections([
      collection('one-a', ['a']),
      collection('two', ['b', 'c']),
      collection('one-b', ['d']),
      collection('three', ['e', 'f', 'g'])
    ]);

    expect(order).toEqual(['three', 'two', 'one-a', 'one-b']);
  });

  it('places unnamed storefront groups after every other collection, still by size', () => {
    const order = orderCollections([
      collection('unknown-small', ['a'], true),
      collection('one', ['b']),
      collection('two', ['c', 'd']),
      collection('unknown-large', ['e', 'f', 'g'], true)
    ]);

    expect(order).toEqual(['two', 'one', 'unknown-large', 'unknown-small']);
  });
});

describe('isStorefrontPseudocollection', () => {
  const storefrontId = ((1n << 96n) + 1n).toString();
  const storefrontSlug = toChainAssetSlug(
    TempleChainKind.EVM,
    1,
    `0x495f947276749Ce646f68AC8c248420045cb7b5e_${storefrontId}`
  );

  it('pins only an unnamed group that holds a shared-storefront token', () => {
    expect(isStorefrontPseudocollection('Unknown collection', 'Unknown collection', [storefrontSlug])).toBe(true);
    expect(isStorefrontPseudocollection('3d-objects-voxtoglb', 'Unknown collection', [storefrontSlug])).toBe(false);
    expect(
      isStorefrontPseudocollection('Unknown collection', 'Unknown collection', [
        toChainAssetSlug(TempleChainKind.EVM, 1, '0x8754F54074400CE745a7CEddC928FB1b7E985eD6_1')
      ])
    ).toBe(false);
  });
});
