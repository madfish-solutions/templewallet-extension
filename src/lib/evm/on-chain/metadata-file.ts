import { isNotEmptyString } from '@rnw-community/shared';
import { AxiosResponse } from 'axios';

import { NftCollectionAttribute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { firstCollectibleArtifactUrl } from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { getIpfsGenericFile, getIpfsGenericFileInBulk, IpfsTransientError } from 'lib/utils/ipfs';
import { stripEmptyProps } from 'lib/utils/strip-props';

interface CollectibleMetadata {
  image?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  image_data?: unknown;
  name?: string;
  decimals?: number;
  description?: string;
  attributes?: NftCollectionAttribute[];
  external_url?: string;
  animation_url?: string;
}

interface MetadataFileResponse {
  data: CollectibleMetadata;
  headers?: AxiosResponse['headers'];
}

export type MetadataFileFetcher = (uri: string) => Promise<MetadataFileResponse>;

export const fetchMetadataFileInteractively: MetadataFileFetcher = uri => getIpfsGenericFile<CollectibleMetadata>(uri);

export const fetchMetadataFileInBulk = (uri: string, signal: AbortSignal) =>
  getIpfsGenericFileInBulk<CollectibleMetadata>(uri, signal);

type CollectibleProperties = Pick<
  EvmCollectibleMetadata,
  'image' | 'collectibleName' | 'description' | 'attributes' | 'externalUrl' | 'animationUrl' | 'artifactUrl'
>;

const getImageUri = ({ image, image_url, imageUrl, image_data }: CollectibleMetadata) => {
  const uri = [image, image_url, imageUrl].find(isNotEmptyString);

  if (uri || !isNotEmptyString(image_data)) return uri;

  if (image_data.startsWith('data:image/')) return image_data;

  return image_data.trimStart().startsWith('<svg') ? `data:image/svg+xml,${encodeURIComponent(image_data)}` : undefined;
};

export const getCollectiblePropertiesFromUri = async (
  metadataUri: string | undefined,
  fetchMetadataFile: MetadataFileFetcher
): Promise<CollectibleProperties> => {
  if (!metadataUri) throw new Error();

  const { data, headers } = await fetchMetadataFile(metadataUri);

  if (String(headers?.['content-type'] ?? '').startsWith('image/')) return { image: metadataUri };

  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error();

  const { name, description, decimals, attributes, external_url: externalUrl, animation_url: animationUrl } = data;
  const image = getImageUri(data);
  const artifactUrl = firstCollectibleArtifactUrl(animationUrl, image);

  return {
    image,
    collectibleName: name,
    description,
    ...stripEmptyProps({ artifactUrl, attributes, externalUrl, animationUrl, decimals })
  };
};

export const fetchERC1155MetadataFile = async (
  metadataUri: string,
  tokenId: bigint,
  fetchMetadataFile: MetadataFileFetcher
): Promise<[CollectibleProperties, string]> => {
  const hexUri = metadataUri.replace('{id}', tokenId.toString(16).padStart(64, '0'));

  if (hexUri === metadataUri)
    return [await getCollectiblePropertiesFromUri(metadataUri, fetchMetadataFile), metadataUri];

  let fromHex: CollectibleProperties | undefined;
  let hexFailure: unknown;
  try {
    fromHex = await getCollectiblePropertiesFromUri(hexUri, fetchMetadataFile);
  } catch (error) {
    hexFailure = error;
  }

  if (fromHex?.image) return [fromHex, hexUri];

  const decimalUri = metadataUri.replace('{id}', tokenId.toString());

  try {
    const fromDecimal = await getCollectiblePropertiesFromUri(decimalUri, fetchMetadataFile);

    return fromDecimal.image || !fromHex ? [fromDecimal, decimalUri] : [fromHex, hexUri];
  } catch (error) {
    if (fromHex) return [fromHex, hexUri];

    throw hexFailure instanceof IpfsTransientError ? hexFailure : error;
  }
};
