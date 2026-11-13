import { collectOpenseaMetadataRecords } from './opensea-records';

const IPFS_IMAGE = 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
const CDN_IMAGE = 'https://i2c.seadn.io/preview.png';

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
