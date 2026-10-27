import { OPENSEA_MULTICHAIN_NFTS_LIMIT } from 'lib/apis/temple/endpoints/evm';
import { toChainAssetSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

import {
  clearRequestedStorefrontNames,
  collectiblePreviewIsLastResort,
  collectOpenseaMetadataRecords,
  finishSharedStorefrontCollectionLoad,
  noteSharedStorefrontCollectionLoad,
  openseaNftRefsFromVisibleSlugs,
  sharedStorefrontCollectionsToLoad,
  buildOpenseaMultichainRefBatches
} from './opensea';
import { sharedStorefrontCreatorAddress } from './utils';

const IPFS_IMAGE = 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
const CDN_IMAGE = 'https://i2c.seadn.io/preview.png';
const RETIRED_GAE_IMAGE =
  'https://image-proxy.svc.prod.covalenthq.com/cdn-cgi/image/width=256,fit/https://i.seadn.io/gae/abc?w=500&auto=format';
const RETIRED_GCS_IMAGE = 'https://i.seadn.io/gcs/files/f9f6b97b526be158b0597eb7154bbccb.gif?w=500&auto=format';
const COVALENT_IPFS_IMAGE = `https://image-proxy.svc.prod.covalenthq.com/cdn-cgi/image/width=256,fit/https://ipfs.covalenthq.com/ipfs/${IPFS_IMAGE.slice('ipfs://'.length)}`;

const address = (id: number): HexString => `0x${id.toString(16).padStart(40, '0')}`;
const chainSlug = (chainId: number, contract: string, tokenId: string) =>
  toChainAssetSlug(TempleChainKind.EVM, chainId, `${contract}_${tokenId}`);

describe('openseaNftRefsFromVisibleSlugs', () => {
  it('keeps visible collectibles whose preview is still a last resort', () => {
    const ipfs = address(1);
    const cdn = address(2);
    const gae = address(5);
    const gcs = address(6);
    const covalentIpfs = address(7);
    const tezosSlug = toChainAssetSlug(TempleChainKind.Tezos, 'NetXdQprcVkpaWU', `${address(3)}_1`);

    const refs = openseaNftRefsFromVisibleSlugs(
      [
        chainSlug(1, ipfs, '5'),
        chainSlug(1, cdn, '4'),
        chainSlug(1, gae, '1'),
        chainSlug(1, gcs, '2'),
        chainSlug(1, covalentIpfs, '3'),
        tezosSlug,
        chainSlug(137, address(4), '8')
      ],
      {
        1: {
          [`${ipfs}_5`]: { address: ipfs, tokenId: '5', image: IPFS_IMAGE },
          [`${cdn}_4`]: { address: cdn, tokenId: '4', name: 'Named', image: CDN_IMAGE },
          [`${gae}_1`]: { address: gae, tokenId: '1', name: 'Named', image: RETIRED_GAE_IMAGE },
          [`${gcs}_2`]: { address: gcs, tokenId: '2', image: RETIRED_GCS_IMAGE },
          [`${covalentIpfs}_3`]: { address: covalentIpfs, tokenId: '3', images: [COVALENT_IPFS_IMAGE] }
        }
      }
    );

    expect(refs).toEqual([
      { chainId: 1, contractAddress: ipfs, tokenId: '5' },
      { chainId: 1, contractAddress: gcs, tokenId: '2' },
      { chainId: 1, contractAddress: covalentIpfs, tokenId: '3' },
      { chainId: 137, contractAddress: address(4), tokenId: '8' }
    ]);
  });

  it('stops at one OpenSea batch', () => {
    const slugs = Array.from({ length: OPENSEA_MULTICHAIN_NFTS_LIMIT + 1 }, (_, index) =>
      chainSlug(1, address(index + 1), String(index))
    );

    const refs = openseaNftRefsFromVisibleSlugs(slugs, undefined);

    expect(refs).toHaveLength(OPENSEA_MULTICHAIN_NFTS_LIMIT);
    expect(refs.at(-1)?.tokenId).toBe(String(OPENSEA_MULTICHAIN_NFTS_LIMIT - 1));
  });

  it('does not treat an OpenSea CDN audio file without a cover as a missing preview', () => {
    expect(
      collectiblePreviewIsLastResort({
        address: address(1),
        tokenId: '345',
        artifactUrl:
          'https://raw2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/fab1ca77c0652e0753dcf9a98ec2d6/74fab1ca77c0652e0753dcf9a98ec2d6.mp3'
      })
    ).toBe(false);
    expect(collectiblePreviewIsLastResort({ address: address(1), tokenId: '1' })).toBe(true);
  });

  it('requests OpenSea for a thumbnail that failed outside the OpenSea CDN', () => {
    const dead = address(8);
    const cdn = address(2);
    const detailOnly = address(9);
    const deadSlug = chainSlug(1, dead, '1');
    const cdnSlug = chainSlug(1, cdn, '4');
    const detailSlug = chainSlug(137, detailOnly, '3');

    const refs = openseaNftRefsFromVisibleSlugs(
      [deadSlug, cdnSlug],
      {
        1: {
          [`${dead}_1`]: { address: dead, tokenId: '1', image: 'https://example.com/missing.png' },
          [`${cdn}_4`]: { address: cdn, tokenId: '4', name: 'Named', image: CDN_IMAGE }
        },
        137: {
          [`${detailOnly}_3`]: { address: detailOnly, tokenId: '3', image: 'https://example.com/also-missing.png' }
        }
      },
      new Set([deadSlug, cdnSlug, detailSlug])
    );

    expect(refs).toEqual([
      { chainId: 1, contractAddress: dead, tokenId: '1' },
      { chainId: 137, contractAddress: detailOnly, tokenId: '3' }
    ]);
  });

  it('requests a shared-storefront token whose stored name is only the Goldrush contract title', () => {
    const contract = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';

    expect(
      openseaNftRefsFromVisibleSlugs([chainSlug(1, contract, tokenId)], {
        1: {
          [`${contract}_${tokenId}`]: {
            address: contract,
            tokenId,
            name: 'OpenSea Shared Storefront',
            image: CDN_IMAGE
          }
        }
      })
    ).toEqual([{ chainId: 1, contractAddress: contract, tokenId }]);
  });

  it('does not request a shared-storefront token that already has an OpenSea collection', () => {
    const contract = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';

    expect(
      openseaNftRefsFromVisibleSlugs([chainSlug(1, contract, tokenId)], {
        1: {
          [`${contract}_${tokenId}`]: {
            address: contract,
            tokenId,
            name: '3d-objects-voxtoglb',
            openseaCollection: '3d-objects-voxtoglb',
            image: CDN_IMAGE
          }
        }
      })
    ).toEqual([]);
  });

  it('requests OpenSea once for a shared-storefront token that has a preview and no collection name', () => {
    const contract = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
    const slug = chainSlug(1, contract, tokenId);

    const refs = openseaNftRefsFromVisibleSlugs([slug], {
      1: { [`${contract}_${tokenId}`]: { address: contract, tokenId, image: CDN_IMAGE } }
    });

    expect(refs).toEqual([{ chainId: 1, contractAddress: contract, tokenId }]);
    expect(
      openseaNftRefsFromVisibleSlugs(
        [slug],
        { 1: { [`${contract}_${tokenId}`]: { address: contract, tokenId, image: CDN_IMAGE } } },
        undefined,
        new Set([slug])
      )
    ).toEqual([]);
  });

  it('skips a collection-name request when another NFT of that contract already has the name', () => {
    const contract = address(3);
    const unnamed = chainSlug(1, contract, '2');

    const refs = openseaNftRefsFromVisibleSlugs([unnamed], {
      1: {
        [`${contract}_1`]: { address: contract, tokenId: '1', name: 'eulerbeats', image: CDN_IMAGE },
        [`${contract}_2`]: { address: contract, tokenId: '2', image: CDN_IMAGE }
      }
    });

    expect(refs).toEqual([]);
  });

  it('still requests a shared-storefront token when another token of its contract has a collection name', () => {
    const contract = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
    const namedId = '105652905984981711355387048174102533489553866874432653063576599430133931048961';

    const refs = openseaNftRefsFromVisibleSlugs([chainSlug(1, contract, tokenId)], {
      1: {
        [`${contract}_${namedId}`]: {
          address: contract,
          tokenId: namedId,
          name: '3d-objects-voxtoglb',
          image: CDN_IMAGE
        },
        [`${contract}_${tokenId}`]: { address: contract, tokenId, image: CDN_IMAGE }
      }
    });

    expect(refs).toEqual([{ chainId: 1, contractAddress: contract, tokenId }]);
  });

  it('skips a name-only shared-storefront request while that contract collection is loading', () => {
    const contract: HexString = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
    const metadata = {
      1: { [`${contract}_${tokenId}`]: { address: contract, tokenId, image: CDN_IMAGE } }
    };

    noteSharedStorefrontCollectionLoad(1, contract);

    expect(openseaNftRefsFromVisibleSlugs([chainSlug(1, contract, tokenId)], metadata)).toEqual([]);

    finishSharedStorefrontCollectionLoad(1, contract);

    expect(openseaNftRefsFromVisibleSlugs([chainSlug(1, contract, tokenId)], metadata)).toEqual([
      { chainId: 1, contractAddress: contract, tokenId }
    ]);
  });

  it('still requests a shared-storefront preview while the collection page is loading', () => {
    const contract: HexString = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';

    noteSharedStorefrontCollectionLoad(1, contract);

    expect(
      openseaNftRefsFromVisibleSlugs([chainSlug(1, contract, tokenId)], {
        1: { [`${contract}_${tokenId}`]: { address: contract, tokenId, image: IPFS_IMAGE } }
      })
    ).toEqual([{ chainId: 1, contractAddress: contract, tokenId }]);

    finishSharedStorefrontCollectionLoad(1, contract);
  });
});

describe('collectOpenseaMetadataRecords', () => {
  const contract = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
  const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
  const slug = `${contract}_${tokenId}`;
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

  it('stores the OpenSea collection slug when the contract has no name', () => {
    const records = collectOpenseaMetadataRecords(
      [slug],
      [{ ...nft, imageUrl: CDN_IMAGE, displayImageUrl: CDN_IMAGE }],
      [],
      []
    );

    expect(records[slug]?.name).toBe('3d-objects-voxtoglb');
  });

  it('copies the collection slug onto stored metadata when the OpenSea preview stays a last resort', () => {
    const records = collectOpenseaMetadataRecords([slug], [{ ...nft, imageUrl: IPFS_IMAGE }], [], [], undefined, {
      [slug]: { address: contract, tokenId, image: CDN_IMAGE }
    });

    expect(records[slug]).toMatchObject({ name: '3d-objects-voxtoglb', image: CDN_IMAGE });
  });

  it('stores a last-resort OpenSea preview when nothing is stored yet', () => {
    const ordinary = '0xA42fD5d2F0A5d733917f718609501cf6105D085D';
    const ordinaryId = '5760';
    const ordinarySlug = `${ordinary}_${ordinaryId}`;

    const records = collectOpenseaMetadataRecords(
      [ordinarySlug],
      [
        {
          ...nft,
          identifier: ordinaryId,
          contract: ordinary,
          collection: 'polygon-parcels',
          tokenStandard: 'erc721',
          name: 'Parcel 5760',
          imageUrl: IPFS_IMAGE
        }
      ],
      [],
      []
    );

    expect(records[ordinarySlug]).toMatchObject({
      name: 'polygon-parcels',
      collectibleName: 'Parcel 5760',
      image: IPFS_IMAGE
    });
  });

  it('keeps a Goldrush preview ahead of an IPFS OpenSea image', () => {
    const records = collectOpenseaMetadataRecords([slug], [{ ...nft, imageUrl: IPFS_IMAGE }], [], [], {
      address: contract,
      updated_at: new Date(0),
      items: [
        {
          contract_name: 'Voxels',
          contract_ticker_symbol: 'VOX',
          contract_address: contract,
          supports_erc: ['erc1155'],
          is_spam: false,
          last_transfered_at: new Date(0),
          balance: '1',
          balance_24h: '1',
          type: 'nft',
          floor_price_quote: 0,
          pretty_floor_price_quote: '0',
          floor_price_native_quote: 0,
          nft_data: [
            {
              token_id: tokenId,
              token_url: 'ipfs://metadata',
              original_owner: '',
              current_owner: '',
              asset_cached: false,
              image_cached: false,
              external_data: {
                name: 'Voxel',
                description: '',
                asset_url: CDN_IMAGE,
                asset_file_extension: 'png',
                asset_mime_type: 'image/png',
                asset_size_bytes: '1',
                image: CDN_IMAGE,
                image_256: CDN_IMAGE,
                image_512: '',
                image_1024: '',
                animation_url: '',
                external_url: '',
                attributes: []
              }
            }
          ]
        }
      ]
    });

    expect(records[slug]).toMatchObject({
      name: '3d-objects-voxtoglb',
      openseaCollection: '3d-objects-voxtoglb',
      image: CDN_IMAGE
    });
    expect(records[slug]?.images?.[0]).toBe(CDN_IMAGE);
  });
});

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

describe('buildOpenseaMultichainRefBatches', () => {
  const enabled = { status: 'enabled' as const };
  const contract = address(1);
  const storefrontTokenId = (creator: number, index = 1) =>
    ((BigInt(creator) << 96n) + (BigInt(index) << 40n) + 1n).toString();

  beforeEach(() => clearRequestedStorefrontNames());

  it('keeps the requested refs first and fills spare slots in one pass', () => {
    const requested = [{ chainId: 1, contractAddress: contract, tokenId: '1' }];
    const [batch] = buildOpenseaMultichainRefBatches(
      requested,
      {
        1: {
          [`${contract}_9`]: enabled,
          [`${contract}_1`]: enabled,
          [`${contract}_2`]: { status: 'disabled' },
          [`${contract}_3`]: { status: 'removed' },
          [`${contract}_4`]: enabled
        }
      },
      {
        1: {
          [`${contract}_9`]: { address: contract, tokenId: '9', image: CDN_IMAGE }
        }
      }
    );

    expect(batch).toEqual([requested[0], { chainId: 1, contractAddress: contract, tokenId: '4' }]);
  });

  it('does not scan once the batch is already full', () => {
    const requested = Array.from({ length: OPENSEA_MULTICHAIN_NFTS_LIMIT }, (_, index) => ({
      chainId: 1,
      contractAddress: address(index + 1),
      tokenId: String(index)
    }));

    expect(buildOpenseaMultichainRefBatches(requested, { 1: { [`${contract}_99`]: enabled } }, undefined)[0]).toBe(
      requested
    );
  });

  it('puts the same contract and token id from another chain in a later request and fills both', () => {
    const requested = [
      { chainId: 1, contractAddress: contract, tokenId: '1' },
      { chainId: 137, contractAddress: contract.toUpperCase(), tokenId: '1' }
    ];
    const extras: Record<string, typeof enabled> = {};

    for (let index = 0; index < OPENSEA_MULTICHAIN_NFTS_LIMIT * 2; index++) {
      extras[`${address(index + 2)}_${index}`] = enabled;
    }

    const batches = buildOpenseaMultichainRefBatches(requested, { 1: extras }, undefined);

    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(OPENSEA_MULTICHAIN_NFTS_LIMIT);
    expect(batches[1]).toHaveLength(OPENSEA_MULTICHAIN_NFTS_LIMIT);
    expect(batches[0][0]).toEqual(requested[0]);
    expect(batches[1][0]).toEqual(requested[1]);
    expect(batches[0].some(ref => ref.chainId === 137)).toBe(false);

    for (const batch of batches) {
      const keys = batch.map(ref => `${ref.contractAddress.toLowerCase()}-${ref.tokenId}`);

      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('fills spare slots with one nameless storefront token per creator before other previews', () => {
    const storefront = address(9);
    const creatorA = storefrontTokenId(1);
    const creatorAAgain = storefrontTokenId(1, 2);
    const creatorB = storefrontTokenId(2);
    const requested = [{ chainId: 1, contractAddress: contract, tokenId: '1' }];
    const collectibles = {
      1: {
        [`${storefront}_${creatorA}`]: enabled,
        [`${storefront}_${creatorAAgain}`]: enabled,
        [`${storefront}_${creatorB}`]: enabled,
        [`${contract}_4`]: enabled
      }
    };
    const metadata = {
      1: {
        [`${storefront}_${creatorA}`]: { address: storefront, tokenId: creatorA, image: CDN_IMAGE },
        [`${storefront}_${creatorAAgain}`]: { address: storefront, tokenId: creatorAAgain, image: CDN_IMAGE },
        [`${storefront}_${creatorB}`]: { address: storefront, tokenId: creatorB, image: CDN_IMAGE }
      }
    };

    const [batch] = buildOpenseaMultichainRefBatches(requested, collectibles, metadata);

    expect(batch).toEqual([
      requested[0],
      { chainId: 1, contractAddress: storefront, tokenId: creatorA },
      { chainId: 1, contractAddress: storefront, tokenId: creatorB },
      { chainId: 1, contractAddress: storefront, tokenId: creatorAAgain },
      { chainId: 1, contractAddress: contract, tokenId: '4' }
    ]);
    expect(
      openseaNftRefsFromVisibleSlugs([chainSlug(1, storefront, creatorA)], {
        1: { [`${storefront}_${creatorA}`]: { address: storefront, tokenId: creatorA, image: CDN_IMAGE } }
      })
    ).toEqual([]);

    const [nextBatch] = buildOpenseaMultichainRefBatches(requested, collectibles, metadata);

    expect(nextBatch).toEqual([requested[0], { chainId: 1, contractAddress: contract, tokenId: '4' }]);
  });

  it('does not spend a spare slot on a creator the requested refs already include', () => {
    const storefront = address(9);
    const creatorA = storefrontTokenId(3);
    const creatorB = storefrontTokenId(4);
    const requested = [{ chainId: 1, contractAddress: storefront, tokenId: creatorA }];

    const [batch] = buildOpenseaMultichainRefBatches(
      requested,
      {
        1: {
          [`${storefront}_${creatorA}`]: enabled,
          [`${storefront}_${storefrontTokenId(3, 2)}`]: enabled,
          [`${storefront}_${creatorB}`]: enabled
        }
      },
      {
        1: {
          [`${storefront}_${creatorA}`]: { address: storefront, tokenId: creatorA, image: CDN_IMAGE },
          [`${storefront}_${storefrontTokenId(3, 2)}`]: {
            address: storefront,
            tokenId: storefrontTokenId(3, 2),
            image: CDN_IMAGE
          },
          [`${storefront}_${creatorB}`]: { address: storefront, tokenId: creatorB, image: CDN_IMAGE }
        }
      }
    );

    expect(batch).toEqual([
      requested[0],
      { chainId: 1, contractAddress: storefront, tokenId: creatorB },
      { chainId: 1, contractAddress: storefront, tokenId: storefrontTokenId(3, 2) }
    ]);
  });

  it('does not sample a storefront contract while its collection page is loading', () => {
    const storefront = address(9);
    const creatorA = storefrontTokenId(5);

    noteSharedStorefrontCollectionLoad(1, storefront);

    const [batch] = buildOpenseaMultichainRefBatches(
      [{ chainId: 1, contractAddress: contract, tokenId: '1' }],
      { 1: { [`${storefront}_${creatorA}`]: enabled, [`${contract}_4`]: enabled } },
      { 1: { [`${storefront}_${creatorA}`]: { address: storefront, tokenId: creatorA, image: CDN_IMAGE } } }
    );

    finishSharedStorefrontCollectionLoad(1, storefront);

    expect(batch).toEqual([
      { chainId: 1, contractAddress: contract, tokenId: '1' },
      { chainId: 1, contractAddress: contract, tokenId: '4' }
    ]);
  });
});
