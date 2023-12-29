import { uniq } from 'lodash';

import type { TokenMetadata } from 'lib/metadata';
import { isTruthy } from 'lib/utils';

type TcInfraMediaSize = 'small' | 'medium' | 'large' | 'raw';
type ObjktMediaTail = 'display' | 'artifact' | 'thumb288';

const IPFS_PROTOCOL = 'ipfs://';
const IPFS_GATE = 'https://cloudflare-ipfs.com/ipfs';
const MEDIA_HOST = 'https://static.tcinfra.net/media';
const DEFAULT_MEDIA_SIZE: TcInfraMediaSize = 'small';
const OBJKT_MEDIA_HOST = 'https://assets.objkt.media/file/assets-003';

const SVG_DATA_URI_UTF8_PREFIX = 'data:image/svg+xml;charset=utf-8,';

export const isSvgDataUriInUtf8Encoding = (uri: string) =>
  uri.slice(0, SVG_DATA_URI_UTF8_PREFIX.length).toLowerCase() === SVG_DATA_URI_UTF8_PREFIX;

export const buildTokenImagesStack = (url?: string): string[] => {
  if (!url) return [];

  if (url.startsWith(IPFS_PROTOCOL) || url.startsWith('http')) {
    const uriInfo = getMediaUriInfo(url);
    return [buildIpfsMediaUriByInfo(uriInfo, 'small'), buildIpfsMediaUriByInfo(uriInfo, 'medium')].filter(isTruthy);
  }

  if (url.startsWith('data:image/') || url.startsWith('chrome-extension') || url.startsWith('moz-extension')) {
    return [url];
  }

  return [];
};

export const buildCollectibleImagesStack = (
  { address, id, artifactUri, displayUri, thumbnailUri }: TokenMetadata,
  fullView = false
): string[] => {
  // May wanna loose artifactUri entirely for non-image media
  const artifactInfo = getMediaUriInfo(artifactUri);
  const displayInfo = getMediaUriInfo(displayUri);
  const thumbnailInfo = getMediaUriInfo(thumbnailUri);

  const result = fullView
    ? [
        buildObjktMediaURI(artifactInfo.ipfs, 'display'),
        buildObjktMediaURI(displayInfo.ipfs, 'display'),
        buildObjktMediaURI(thumbnailInfo.ipfs, 'display'),

        buildIpfsMediaUriByInfo(displayInfo, 'raw'),
        buildIpfsMediaUriByInfo(displayInfo, 'large'),
        buildIpfsMediaUriByInfo(displayInfo, 'medium'),
        buildIpfsMediaUriByInfo(displayInfo, 'small'),

        buildIpfsMediaUriByInfo(artifactInfo, 'raw'),
        buildIpfsMediaUriByInfo(artifactInfo, 'large'),
        buildIpfsMediaUriByInfo(artifactInfo, 'medium'),
        buildIpfsMediaUriByInfo(artifactInfo, 'small')
      ]
    : [
        // Some image of video asset (see: KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_773019) only available through this option:
        buildObjktMediaUriForItemPath(`${address}/${id}`, 'thumb288'),

        buildObjktMediaURI(artifactInfo.ipfs, 'thumb288'),
        buildObjktMediaURI(displayInfo.ipfs, 'thumb288'),
        buildObjktMediaURI(thumbnailInfo.ipfs, 'thumb288'),

        buildIpfsMediaUriByInfo(thumbnailInfo, 'medium'),
        buildIpfsMediaUriByInfo(thumbnailInfo, 'small'),

        buildIpfsMediaUriByInfo(displayInfo, 'medium'),
        buildIpfsMediaUriByInfo(displayInfo, 'small'),

        buildIpfsMediaUriByInfo(artifactInfo, 'medium'),
        buildIpfsMediaUriByInfo(artifactInfo, 'small')
      ];

  return uniq(result.filter(isTruthy));
};

interface MediaUriInfo {
  uri?: string;
  ipfs: IpfsUriInfo | nullish;
}

const getMediaUriInfo = (uri?: string): MediaUriInfo => ({
  uri,
  ipfs: uri ? getIpfsItemInfo(uri) : null
});

interface IpfsUriInfo {
  id: string;
  path: string;
  /** With leading `?` if applicable */
  search: '' | `?${string}`;
}

const getIpfsItemInfo = (uri: string): IpfsUriInfo | null => {
  if (!uri.startsWith(IPFS_PROTOCOL)) {
    return null;
  }

  const [path, search] = uri.slice(IPFS_PROTOCOL.length).split('?');
  const id = path.split('/')[0];

  if (id === INVALID_IPFS_ID) {
    return null;
  }

  return {
    id,
    path,
    search: search ? `?${search}` : ''
  };
};

/** Black circle in `thumbnailUri`
 * See:
 * - KT1M2JnD1wsg7w2B4UXJXtKQPuDUpU2L7cJH_79
 * - KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_19484
 * - KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_3312
 */
const INVALID_IPFS_ID = 'QmNrhZHUaEqxhyLfqoq1mtHSipkWHeT31LNHb1QEbDHgnc';

export const buildObjktCollectibleArtifactUri = (artifactUri: string) =>
  buildObjktMediaURI(getIpfsItemInfo(artifactUri), 'artifact') || artifactUri;

const buildObjktMediaURI = (ipfsInfo: IpfsUriInfo | nullish, tail: ObjktMediaTail) => {
  if (!ipfsInfo) {
    return;
  }

  let result = buildObjktMediaUriForItemPath(ipfsInfo.id, tail);
  if (ipfsInfo.search) {
    result += `/index.html${ipfsInfo.search}`;
  }

  return result;
};

const buildObjktMediaUriForItemPath = (itemId: string, tail: ObjktMediaTail) => `${OBJKT_MEDIA_HOST}/${itemId}/${tail}`;

const buildIpfsMediaUriByInfo = (
  { uri, ipfs: ipfsInfo }: MediaUriInfo,
  size: TcInfraMediaSize = DEFAULT_MEDIA_SIZE,
  useMediaHost = true
) => {
  if (!uri) {
    return;
  }

  if (ipfsInfo) {
    return useMediaHost
      ? `${MEDIA_HOST}/${size}/ipfs/${ipfsInfo.path}${ipfsInfo.search}`
      : `${IPFS_GATE}/${ipfsInfo.path}${ipfsInfo.search}`;
  }

  if (useMediaHost && uri.startsWith('http')) {
    // This option also serves as a proxy for any `http` source
    return `${MEDIA_HOST}/${size}/web/${uri.replace(/^https?:\/\//, '')}`;
  }

  return;
};
