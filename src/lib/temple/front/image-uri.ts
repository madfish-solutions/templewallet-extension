import type { TokenMetadata } from 'lib/metadata';

type TcInfraMediaSize = 'small' | 'medium' | 'large' | 'raw';
type ObjktMediaTail = 'display' | 'artifact' | 'thumb288';

const IPFS_PROTOCOL_PREFIX = 'ipfs://';
const MEDIA_HOST = 'https://static.tcinfra.net';
const DEFAULT_MEDIA_SIZE: TcInfraMediaSize = 'small';
const OBJKT_MEDIA_HOST = 'https://assets.objkt.media/file/assets-003';

const SVG_DATA_URI_UTF8_PREFIX = 'data:image/svg+xml;charset=utf-8,';

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

export const buildCollectibleImageURLs = (
  { address, id, artifactUri, displayUri, thumbnailUri }: TokenMetadata,
  fullView = false
) => {
  // May wanna loose artifactSrc entirely for non-image media
  const artifactSrc = formatAssetUriToAllSizes(artifactUri, fullView);
  const displaySrc = formatAssetUriToAllSizes(displayUri, fullView);

  return fullView
    ? [
        buildObjktMediaURI(artifactUri, 'display'),
        buildObjktMediaURI(displayUri, 'display'),
        buildObjktMediaURI(thumbnailUri, 'display'),
        ...displaySrc,
        ...artifactSrc
      ]
    : [
        buildObjktMediaURI(artifactUri, 'thumb288'),
        buildObjktMediaURI(displayUri, 'thumb288'),
        buildObjktMediaURI(thumbnailUri, 'thumb288'),
        // Some image of video asset (see: KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_773019) only available through this option:
        buildObjktMediaUriForItemPath(`${address}/${id}`, 'thumb288'),
        ...formatAssetUriToAllSizes(thumbnailUri),
        ...displaySrc,
        ...artifactSrc
      ];
};

export const formatTcInfraImgUri = (url?: string, size: TcInfraMediaSize = DEFAULT_MEDIA_SIZE) => {
  if (!url) return;

  const itemPath = getIpfsItemPath(url);

  if (typeof itemPath === 'string') {
    return itemPath ? `${MEDIA_HOST}/media/${size}/ipfs/${itemPath}` : undefined;
  }

  if (url.startsWith('http')) {
    return `${MEDIA_HOST}/media/${size}/web/${url.replace(/^https?:\/\//, '')}`;
  }

  return;
};

export const buildObjktCollectibleArtifactUri = (artifactUri: string) =>
  buildObjktMediaURI(artifactUri, 'artifact') || artifactUri;

/** Black circle in `thumbnailUri`
 * See:
 * - KT1M2JnD1wsg7w2B4UXJXtKQPuDUpU2L7cJH_79
 * - KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_19484
 * - KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_3312
 */
const INVALID_IPFS_PATH = 'QmNrhZHUaEqxhyLfqoq1mtHSipkWHeT31LNHb1QEbDHgnc';

const getIpfsItemPath = (uri: string) => {
  if (!uri.startsWith(IPFS_PROTOCOL_PREFIX)) return;

  const itemPath = uri.substring(IPFS_PROTOCOL_PREFIX.length);

  return itemPath === INVALID_IPFS_PATH ? '' : itemPath;
};

const buildObjktMediaURI = (uri: string | undefined, tail: ObjktMediaTail) => {
  const itemPath = uri && getIpfsItemPath(uri);

  return (itemPath && buildObjktMediaUriForItemPath(itemPath, tail)) || undefined;
};

const buildObjktMediaUriForItemPath = (itemId: string, tail: ObjktMediaTail) => `${OBJKT_MEDIA_HOST}/${itemId}/${tail}`;
