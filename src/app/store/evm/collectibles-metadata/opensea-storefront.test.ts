import { sharedStorefrontCollectionsToLoad } from './opensea-storefront';
import { sharedStorefrontCreatorAddress } from './utils';

const address = (id: number): HexString => `0x${id.toString(16).padStart(40, '0')}`;

describe('sharedStorefrontCollectionsToLoad', () => {
  const contract = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
  const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
  const siblingId = '105652905984981711355387048174102533489553866874432653063576599430133931048961';
  const slug = `${contract}_${tokenId}`;
  const sibling = `${contract}_${siblingId}`;
  const nft = {
    identifier: tokenId,
    collection: '3d-objects-voxtoglb',
    contract,
    tokenStandard: 'erc1155',
    openseaUrl: 'https://opensea.io/collection/3d-objects-voxtoglb',
    updatedAt: '2026-10-23T00:00:00.000Z',
    isDisabled: false,
    isNsfw: false,
    traits: []
  };

  it('skips a collection when that creator holds only two tokens', () => {
    expect(sharedStorefrontCollectionsToLoad(1, [nft], [slug, sibling], {}, new Set([slug]), new Set())).toEqual([]);
  });

  it('requests the collection when the creator holds more than two tokens and one is still unnamed', () => {
    const creator = BigInt(sharedStorefrontCreatorAddress(tokenId) ?? '0');
    const thirdId = ((creator << 96n) + (22n << 40n) + 1n).toString();

    expect(
      sharedStorefrontCollectionsToLoad(
        1,
        [nft],
        [slug, sibling, `${contract}_${thirdId}`],
        {},
        new Set([slug]),
        new Set()
      )
    ).toEqual([{ collection: '3d-objects-voxtoglb', contractAddress: contract }]);
  });

  it('does not request a collection because a different creator still has an unnamed token', () => {
    const otherCreatorId = ((2n << 96n) + 1n).toString();

    expect(
      sharedStorefrontCollectionsToLoad(
        1,
        [nft],
        [slug, `${contract}_${otherCreatorId}`],
        {},
        new Set([slug]),
        new Set()
      )
    ).toEqual([]);
  });

  it('requests a concentrated creator before one whose tokens cover fewer of that creator', () => {
    const wideId = (index: number) => ((3n << 96n) + (BigInt(index) << 40n) + 1n).toString();
    const narrowId = (index: number) => ((4n << 96n) + (BigInt(index) << 40n) + 1n).toString();
    const wideSlug = `${contract}_${wideId(1)}`;
    const narrowSlug = `${contract}_${narrowId(1)}`;
    const owned = [wideSlug, narrowSlug];

    for (let index = 2; index <= 6; index += 1) owned.push(`${contract}_${wideId(index)}`);
    owned.push(`${contract}_${narrowId(2)}`, `${contract}_${narrowId(3)}`);

    expect(
      sharedStorefrontCollectionsToLoad(
        1,
        [
          { ...nft, identifier: wideId(1), collection: 'wide-collection' },
          { ...nft, identifier: narrowId(1), collection: 'narrow-collection' }
        ],
        owned,
        {},
        new Set([wideSlug, narrowSlug]),
        new Set()
      )
    ).toEqual([
      { collection: 'wide-collection', contractAddress: contract },
      { collection: 'narrow-collection', contractAddress: contract }
    ]);
  });

  it('skips a creator whose tokens already fall into enough collections to average two or fewer', () => {
    const creatorId = (index: number) => ((5n << 96n) + (BigInt(index) << 40n) + 1n).toString();
    const owned = [1, 2, 3, 4, 5, 6].map(index => `${contract}_${creatorId(index)}`);

    expect(
      sharedStorefrontCollectionsToLoad(
        1,
        [1, 2, 3].map(index => ({ ...nft, identifier: creatorId(index), collection: `collection-${index}` })),
        owned,
        {},
        new Set(owned.slice(0, 3)),
        new Set()
      )
    ).toEqual([]);
  });

  it('skips the collection when this response names the sibling', () => {
    expect(
      sharedStorefrontCollectionsToLoad(1, [nft], [slug, sibling], {}, new Set([slug, sibling]), new Set())
    ).toEqual([]);
  });

  it('skips the collection when the wallet holds only that token', () => {
    expect(sharedStorefrontCollectionsToLoad(1, [nft], [slug], {}, new Set([slug]), new Set())).toEqual([]);
  });

  it('skips a non-storefront token', () => {
    const normal = address(3);

    expect(
      sharedStorefrontCollectionsToLoad(
        1,
        [{ ...nft, contract: normal, identifier: '1', collection: 'eulerbeats' }],
        [`${normal}_1`, `${normal}_2`],
        {},
        new Set([`${normal}_1`]),
        new Set()
      )
    ).toEqual([]);
  });

  it('requests the collection when Goldrush stored a contract name and OpenSea has not', () => {
    const creator = BigInt(sharedStorefrontCreatorAddress(tokenId) ?? '0');
    const thirdId = ((creator << 96n) + (22n << 40n) + 1n).toString();

    expect(
      sharedStorefrontCollectionsToLoad(
        1,
        [nft],
        [slug, sibling, `${contract}_${thirdId}`],
        {
          [sibling]: { address: contract, tokenId: siblingId, name: 'OpenSea Collections' },
          [`${contract}_${thirdId}`]: { address: contract, tokenId: thirdId, name: 'OpenSea Shared Storefront' }
        },
        new Set([slug]),
        new Set()
      )
    ).toEqual([{ collection: '3d-objects-voxtoglb', contractAddress: contract }]);
  });

  it('skips a collection already requested this session', () => {
    expect(
      sharedStorefrontCollectionsToLoad(1, [nft], [slug, sibling], {}, new Set(), new Set(['1:3d-objects-voxtoglb']))
    ).toEqual([]);
  });
});
