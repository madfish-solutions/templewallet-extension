import type { TokenMetadata } from 'lib/metadata';

type TcInfraMediaSize = 'small' | 'medium' | 'large';

const MEDIA_HOST = 'https://static.tcinfra.net';
const DEFAULT_MEDIA_SIZE: TcInfraMediaSize = 'small';

const formatAssetUriToAllSizes = (url?: string, includeLarge = false) => {
  if (!url) return [];

  if (url.startsWith('ipfs://') || url.startsWith('http'))
    return [
      includeLarge ? formatTcInfraImgUri(url, 'large') : undefined,
      includeLarge ? formatTcInfraImgUri(url, 'medium') : undefined,
      formatTcInfraImgUri(url, 'small')
    ];

  if (url.startsWith('data:image/') || url.startsWith('chrome-extension') || url.startsWith('moz-extension')) {
    return [url];
  }

  return [];
};

export { formatAssetUriToAllSizes as buildTokenIconURLs };

export const buildCollectibleImageURLs = (assetSlug: string, metadata: TokenMetadata, includeLarge = false) => {
  if (metadata == null) return formatObjktSmallAssetUri(assetSlug);

  return [
    formatObjktSmallAssetUri(assetSlug),
    ...formatAssetUriToAllSizes(metadata.displayUri, includeLarge),
    ...formatAssetUriToAllSizes(metadata.artifactUri, includeLarge),
    ...formatAssetUriToAllSizes(metadata.thumbnailUri, includeLarge)
  ];
};

const formatTcInfraImgUri = (url?: string, size: TcInfraMediaSize = DEFAULT_MEDIA_SIZE) => {
  if (!url) return;

  if (url.startsWith('ipfs://')) {
    return `${MEDIA_HOST}/media/${size}/ipfs/${url.substring(7)}`;
  }

  if (url.startsWith('http')) {
    return `${MEDIA_HOST}/media/${size}/web/${url.replace(/^https?:\/\//, '')}`;
  }

  return;
};

const formatObjktSmallAssetUri = (assetSlug: string) => {
  const [address, id] = assetSlug.split('_');

  return `https://assets.objkt.media/file/assets-003/${address}/${id}/thumb288`;
};
