import { NftTokenContractBalanceItem, OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import {
  assignSingleContractCollectionNames,
  buildEvmCollectibleMetadataFromFetched,
  buildEvmCollectibleMetadataFromOpensea,
  collectibleCollectionName,
  evmContractCollectionName,
  isSharedStorefrontTokenId,
  sharedStorefrontCreatorAddress,
  singleContractCollectionNames
} from './utils';

const VIDEO =
  'https://raw2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/aef5861c2ff9855c0dd6292e30039b/dcaef5861c2ff9855c0dd6292e30039b.mp4';
const FRAME = `${VIDEO.replace('https://raw2.seadn.io', 'https://i2.seadn.io')}?frame-time=1&w=500`;
const COVER = 'https://i2c.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/cover.png';
const AUDIO = 'https://i2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/track.mp3';
const MODEL = 'https://i2.seadn.io/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/model.glb';
const HTML = 'https://i2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/token.html';
const CONTRACT = '0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58';

const openseaNft = (partial: Partial<OpenseaNftDetailed>): OpenseaNftDetailed => ({
  identifier: '438',
  collection: 'collection',
  contract: CONTRACT,
  tokenStandard: 'erc721',
  openseaUrl: 'https://opensea.io/item/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/438',
  updatedAt: '2026-10-22T00:00:00.000Z',
  isDisabled: false,
  isNsfw: false,
  traits: [],
  ...partial
});

describe('buildEvmCollectibleMetadataFromOpensea', () => {
  it('stores a video file and previews its frame', () => {
    const metadata = buildEvmCollectibleMetadataFromOpensea(
      openseaNft({ imageUrl: VIDEO, displayImageUrl: VIDEO }),
      CONTRACT,
      '438'
    );

    expect(metadata.image).toBe(FRAME);
    expect(metadata.images).toEqual([FRAME]);
    expect(metadata.artifactUrl).toBe(VIDEO);
  });

  it('stores audio, a model, or HTML beside the cover image', () => {
    const audio = buildEvmCollectibleMetadataFromOpensea(
      openseaNft({ imageUrl: COVER, animationUrl: AUDIO }),
      CONTRACT,
      '1'
    );
    const model = buildEvmCollectibleMetadataFromOpensea(
      openseaNft({ displayImageUrl: COVER, originalAnimationUrl: MODEL }),
      CONTRACT,
      '2'
    );
    const html = buildEvmCollectibleMetadataFromOpensea(
      openseaNft({ imageUrl: COVER, animationUrl: HTML }),
      CONTRACT,
      '3'
    );

    expect(audio).toMatchObject({ image: COVER, artifactUrl: AUDIO });
    expect(model).toMatchObject({ image: COVER, artifactUrl: MODEL });
    expect(html).toMatchObject({ image: COVER, artifactUrl: HTML });
    expect(audio.images).toEqual([COVER]);
  });

  it('stores an audio file when the image fields are that file and an extensionless copy', () => {
    const mp3 =
      'https://raw2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/fab1ca77c0652e0753dcf9a98ec2d6/74fab1ca77c0652e0753dcf9a98ec2d6.mp3';
    const metadata = buildEvmCollectibleMetadataFromOpensea(
      openseaNft({
        imageUrl: mp3,
        displayImageUrl: mp3,
        originalImageUrl: 'ipfs://bafkreidsyjlppb77c6yjngnvut67xis27ra2emenazdhaovir7nqbelsie'
      }),
      CONTRACT,
      '345'
    );

    expect(metadata.artifactUrl).toBe(mp3);
    expect(metadata.image).toBeUndefined();
    expect(metadata.images).toBeUndefined();
  });
});

describe('buildEvmCollectibleMetadataFromFetched', () => {
  const contract: NftTokenContractBalanceItem = {
    contract_name: 'Collection',
    contract_ticker_symbol: 'COL',
    contract_address: CONTRACT,
    supports_erc: [EvmAssetStandard.ERC721],
    is_spam: false,
    last_transfered_at: new Date(0),
    balance: '1',
    balance_24h: '1',
    type: 'nft',
    floor_price_quote: 0,
    pretty_floor_price_quote: '0',
    floor_price_native_quote: 0,
    nft_data: []
  };

  it('stores a Goldrush video as an artifact and previews the frame', () => {
    const metadata = buildEvmCollectibleMetadataFromFetched(
      {
        token_id: '438',
        token_url: 'ipfs://metadata',
        original_owner: '',
        current_owner: '',
        asset_cached: false,
        image_cached: false,
        external_data: {
          name: 'Video',
          description: '',
          asset_url: VIDEO,
          asset_file_extension: 'mp4',
          asset_mime_type: 'video/mp4',
          asset_size_bytes: '1',
          image: VIDEO,
          image_256: VIDEO,
          image_512: '',
          image_1024: '',
          animation_url: VIDEO,
          external_url: '',
          attributes: []
        }
      },
      contract
    );

    expect(metadata.image).toBe(FRAME);
    expect(metadata.images).toEqual([FRAME]);
    expect(metadata.artifactUrl).toBe(VIDEO);
  });
});

describe('isSharedStorefrontTokenId', () => {
  const min = (2n ** 96n).toString();

  it('compares the numeric value, including ids with leading zeros', () => {
    expect(isSharedStorefrontTokenId(min)).toBe(true);
    expect(isSharedStorefrontTokenId((2n ** 96n - 1n).toString())).toBe(false);
    expect(isSharedStorefrontTokenId(`0${(2n ** 96n - 1n).toString()}`)).toBe(false);
    expect(isSharedStorefrontTokenId('550226233603')).toBe(false);
    expect(isSharedStorefrontTokenId('not-a-number')).toBe(false);
    expect(isSharedStorefrontTokenId(undefined)).toBe(false);
  });

  it('reads the creator address from the top 160 bits', () => {
    const tokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';

    expect(sharedStorefrontCreatorAddress(tokenId)).toBe('0xe9956cf72cc8e49d903478142dc8dadb4ee328ff');
    expect(sharedStorefrontCreatorAddress('1')).toBeUndefined();
  });
});

describe('assignSingleContractCollectionNames', () => {
  const contract: HexString = '0x8754F54074400CE745a7CEddC928FB1b7E985eD6';
  const shared: HexString = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
  const sharedTokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';

  it('copies the one collection name onto nameless NFTs of that contract', () => {
    const records: StringRecord<EvmCollectibleMetadata> = {
      [`${contract}_1`]: { address: contract, tokenId: '1', name: 'eulerbeats' },
      [`${contract}_2`]: { address: contract, tokenId: '2' }
    };

    assignSingleContractCollectionNames(records);

    expect(records[`${contract}_2`].name).toBe('eulerbeats');
  });

  it('leaves NFTs unnamed when the contract already has two collection names', () => {
    const records: StringRecord<EvmCollectibleMetadata> = {
      [`${contract}_1`]: { address: contract, tokenId: '1', name: 'eulerbeats' },
      [`${contract}_2`]: { address: contract, tokenId: '2', name: 'terraforms' },
      [`${contract}_3`]: { address: contract, tokenId: '3' }
    };

    assignSingleContractCollectionNames(records);

    expect(records[`${contract}_3`].name).toBeUndefined();
  });

  it('does not copy a name across a shared-storefront contract', () => {
    const records: StringRecord<EvmCollectibleMetadata> = {
      [`${shared}_${sharedTokenId}`]: { address: shared, tokenId: sharedTokenId, name: '3d-objects-voxtoglb' },
      [`${shared}_2`]: {
        address: shared,
        tokenId: '105652905984981711355387048174102533489553866874432653063576599430133931048961'
      }
    };

    assignSingleContractCollectionNames(records);

    expect(records[`${shared}_2`].name).toBeUndefined();
  });

  it('drops a Goldrush contract name on a shared-storefront token until OpenSea names it', () => {
    const records: StringRecord<EvmCollectibleMetadata> = {
      [`${shared}_${sharedTokenId}`]: { address: shared, tokenId: sharedTokenId, name: 'OpenSea Shared Storefront' }
    };

    assignSingleContractCollectionNames(records);

    expect(records[`${shared}_${sharedTokenId}`].name).toBeUndefined();
  });

  it('keeps an OpenSea collection slug on a shared-storefront token', () => {
    const records: StringRecord<EvmCollectibleMetadata> = {
      [`${shared}_${sharedTokenId}`]: {
        address: shared,
        tokenId: sharedTokenId,
        name: '3d-objects-voxtoglb',
        openseaCollection: '3d-objects-voxtoglb'
      }
    };

    assignSingleContractCollectionNames(records);

    expect(records[`${shared}_${sharedTokenId}`].name).toBe('3d-objects-voxtoglb');
  });
});

describe('evmContractCollectionName', () => {
  const contract: HexString = '0xA42fD5d2F0A5d733917f718609501cf6105D085D';
  const namedSlug = `${contract}_6277`;
  const unnamedSlug = `${contract}_7102`;

  const names = () =>
    singleContractCollectionNames({
      137: {
        [namedSlug]: { address: contract, tokenId: '6277', name: 'h20-nft-test' }
      }
    });

  it('groups an NFT that has no metadata under the one collection of its contract', () => {
    expect(evmContractCollectionName(names(), 137, unnamedSlug)).toBe('h20-nft-test');
  });

  it('keeps a name already stored on the NFT', () => {
    expect(evmContractCollectionName(names(), 137, unnamedSlug, 'other')).toBe('other');
  });

  it('does not assign a shared-storefront token', () => {
    const shared: HexString = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const sharedTokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
    const contractNames = new Map<string, string>([[`1:${shared.toLowerCase()}`, 'h20-nft-test']]);

    expect(evmContractCollectionName(contractNames, 1, `${shared}_${sharedTokenId}`)).toBeUndefined();
  });

  it('does not group the other tokens of a contract that hosts more than one collection', () => {
    const shared: HexString = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const sharedTokenId = '105652905984981711355387048174102533489553866874432653063576599429034419421185';
    const contractNames = singleContractCollectionNames({
      1: {
        [`${shared}_${sharedTokenId}`]: { address: shared, tokenId: sharedTokenId, name: '3d-objects-voxtoglb' },
        [`${shared}_2`]: { address: shared, tokenId: '2' }
      }
    });

    expect(evmContractCollectionName(contractNames, 1, `${shared}_2`)).toBeUndefined();
  });
});

describe('collectibleCollectionName', () => {
  it('uses a contract name, then a stored name, then the OpenSea collection slug', () => {
    expect(collectibleCollectionName('EulerBeats', 'stored', 'eulerbeats')).toBe('EulerBeats');
    expect(collectibleCollectionName(undefined, 'stored', 'eulerbeats')).toBe('stored');
    expect(collectibleCollectionName(undefined, undefined, 'eulerbeats')).toBe('eulerbeats');
    expect(collectibleCollectionName('', null, '')).toBeUndefined();
  });
});
