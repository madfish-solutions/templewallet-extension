import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { mergeCollectibleMetadata } from './verify-collection-ownership';

const token = (patch: Partial<EvmCollectibleMetadata>): EvmCollectibleMetadata => ({
  address: '0x0000000000000000000000000000000000000001',
  tokenId: '1',
  ...patch
});

describe('mergeCollectibleMetadata', () => {
  it('keeps an OpenSea CDN image and the traits Alchemy did not have', () => {
    const merged = mergeCollectibleMetadata(
      token({
        name: 'Alchemy name',
        image: 'https://ipfs.covalenthq.com/ipfs/abc',
        images: ['https://ipfs.covalenthq.com/ipfs/abc']
      }),
      token({
        name: 'slug',
        image: 'https://i2.seadn.io/art.png',
        images: ['https://i2.seadn.io/art.png'],
        attributes: [{ trait_type: 'Color', value: 'red' }],
        artifactUrl: 'https://raw2.seadn.io/art.mp4',
        description: 'From OpenSea'
      })
    );

    expect(merged?.image).toBe('https://i2.seadn.io/art.png');
    expect(merged?.name).toBe('Alchemy name');
    expect(merged?.attributes).toEqual([{ trait_type: 'Color', value: 'red' }]);
    expect(merged?.artifactUrl).toBe('https://raw2.seadn.io/art.mp4');
    expect(merged?.description).toBe('From OpenSea');
  });

  it('keeps a usable Alchemy image ahead of an IPFS OpenSea image', () => {
    const merged = mergeCollectibleMetadata(
      token({ image: 'https://cdn.example/art.png', images: ['https://cdn.example/art.png'] }),
      token({ image: 'ipfs://bafy', images: ['ipfs://bafy'], description: 'OpenSea' })
    );

    expect(merged?.image).toBe('https://cdn.example/art.png');
    expect(merged?.description).toBe('OpenSea');
  });
});
