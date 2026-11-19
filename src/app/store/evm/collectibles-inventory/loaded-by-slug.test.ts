import { loadedNftsBySlug } from './loaded-by-slug';
import { InventoryLoadedNft } from './place-collections';

const nft = (slug: string): InventoryLoadedNft => ({ slug, contractAddress: slug.split('_')[0] });

describe('loadedNftsBySlug', () => {
  it('finds a token by slug without scanning again for the same list', () => {
    const loaded = [nft('0xAbC_1'), nft('0xDef_2')];
    const first = loadedNftsBySlug(loaded);
    const second = loadedNftsBySlug(loaded);

    expect(second).toBe(first);
    expect(first.get('0xabc_1')).toBe(loaded[0]);
    expect(first.get('0xmissing_1')).toBeUndefined();
  });
});
