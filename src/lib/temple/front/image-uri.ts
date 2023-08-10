import type { TokenMetadata } from 'lib/metadata';

type TcInfraMediaSize = 'small' | 'medium' | 'large' | 'raw';

const IPFS_PROTOCOL_PREFIX = 'ipfs://';
const MEDIA_HOST = 'https://static.tcinfra.net';
const DEFAULT_MEDIA_SIZE: TcInfraMediaSize = 'small';
const OBJKT_MEDIA_HOST = 'https://assets.objkt.media/file/assets-003';

export const SVG_DATA_URI_UTF8_PREFIX = 'data:image/svg+xml;charset=utf-8,';

export const isSvgDataUriInUtf8Encoding = (uri: string) =>
  uri.slice(0, SVG_DATA_URI_UTF8_PREFIX.length).toLowerCase() === SVG_DATA_URI_UTF8_PREFIX;

const formatAssetUriToAllSizes = (url?: string, includeLarge = false) => {
  if (!url) return [];

  if (url.startsWith(IPFS_PROTOCOL_PREFIX) || url.startsWith('http'))
    return [
      includeLarge ? formatTcInfraImgUri(url, 'raw') : undefined,
      includeLarge ? formatTcInfraImgUri(url, 'large') : undefined,
      // Some `small` tokens icons are absent, while `medium` are present
      formatTcInfraImgUri(url, 'medium'),
      formatTcInfraImgUri(url, 'small')
    ];

  if (url.startsWith('data:image/') || url.startsWith('chrome-extension') || url.startsWith('moz-extension')) {
    return [url];
  }

  return [];
};

export { formatAssetUriToAllSizes as buildTokenIconURLs };

export const buildCollectibleImageURLs = (metadata: TokenMetadata, fullView = false) => {
  // May wanna loose artifactSrc for non-image media
  const artifactSrc = formatAssetUriToAllSizes(metadata.artifactUri, fullView);
  const displaySrc = formatAssetUriToAllSizes(metadata.displayUri, fullView);

  /* Not including `thumbnailUri` for the full view of NFTs' images - letting them fallback.
    Some non-image NFTs have black circle for `thumbnailUri`
  */

  /* Using OBJKT as a source for some 'broken' ones.
    Precicely, `KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_282881` has MP4 file @ `artifactUri` & `displayUri`
    (MIME type does not reflect that - seeing `image/gif` instead).
    Then, it has a black circle for `thumbnailUri`.
  */

  return fullView
    ? [...artifactSrc, ...displaySrc, buildObjktImageURI(metadata.artifactUri, 'display')]
    : [
        ...artifactSrc,
        ...displaySrc,
        buildObjktImageURI(metadata.artifactUri, 'thumb288'),
        ...formatAssetUriToAllSizes(metadata.thumbnailUri)
      ];
};

export const formatTcInfraImgUri = (url?: string, size: TcInfraMediaSize = DEFAULT_MEDIA_SIZE) => {
  if (!url) return;

  if (url.startsWith(IPFS_PROTOCOL_PREFIX)) {
    return `${MEDIA_HOST}/media/${size}/ipfs/${url.substring(7)}`;
  }

  if (url.startsWith('http')) {
    return `${MEDIA_HOST}/media/${size}/web/${url.replace(/^https?:\/\//, '')}`;
  }

  return;
};

export const buildObjktCollectibleArtifactUri = (artifactUri: string) =>
  buildObjktImageURI(artifactUri, 'artifact') || artifactUri;

const getIpfsItemId = (uri: string) =>
  uri.startsWith(IPFS_PROTOCOL_PREFIX) ? uri.substring(IPFS_PROTOCOL_PREFIX.length) : undefined;

const buildObjktImageURI = (uri: string | undefined, tail: 'display' | 'artifact' | 'thumb288') => {
  const itemId = uri ? getIpfsItemId(uri) : undefined;

  return itemId ? `${OBJKT_MEDIA_HOST}/${itemId}/${tail}` : undefined;
};
