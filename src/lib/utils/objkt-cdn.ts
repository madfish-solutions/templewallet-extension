import { sha1 } from '@noble/hashes/legacy';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { trimEnd } from 'lodash';

import { IPFS_PROTOCOL, IpfsUriInfo, isInvalidIpfsMediaUri, parseMediaUri } from './ipfs';

/** See: https://gist.github.com/vhf/84d63f1bcb70e36d0d009788e4ab4c83 */
const OBJKT_ASSETS_BASE_URL = 'https://assets.objkt.media/file/assets-003';
const ONCHFS_PROTOCOL = 'onchfs://';

export type ObjktAssetRendition = 'artifact' | 'thumb288';

interface ObjktAssetPath {
  key: string;
  /** With leading `?` if applicable */
  search: string;
}

export const isObjktAssetUrl = (uri: string) => uri.startsWith('https://assets.objkt.media/');

export const buildObjktTokenThumbnailUrl = (address: string, id: string) =>
  `${OBJKT_ASSETS_BASE_URL}/${address}/${id}/thumb288`;

const fromIpfsInfo = ({ id, pathWithoutCid, search }: IpfsUriInfo): ObjktAssetPath => {
  const path = trimEnd(pathWithoutCid, '/');

  return { key: path ? `${id}/${path}` : id, search };
};

const splitSearch = (value: string): [string, string] => {
  const index = value.indexOf('?');

  return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index)];
};

const toAssetPaths = (uri: string): ObjktAssetPath[] => {
  if (uri.startsWith(ONCHFS_PROTOCOL)) {
    const [key, search] = splitSearch(uri.slice(ONCHFS_PROTOCOL.length));
    const trimmedKey = trimEnd(key, '/');

    return trimmedKey ? [{ key: trimmedKey, search }] : [];
  }

  const isHttp = /^https?:\/\//.test(uri);
  if (!uri.startsWith(IPFS_PROTOCOL) && !isHttp) return [];

  const ipfsInfo = parseMediaUri(uri).ipfsAware.ipfs;

  if (!isHttp) return ipfsInfo ? [fromIpfsInfo(ipfsInfo)] : [];

  // objkt keys http(s) sources by the SHA-1 of the exact URL; a gateway link may also be known by its CID
  const hashedPath = { key: bytesToHex(sha1(utf8ToBytes(uri))), search: '' };

  return ipfsInfo ? [hashedPath, fromIpfsInfo(ipfsInfo)] : [hashedPath];
};

export const buildObjktAssetUrls = (uri: string | undefined, rendition: ObjktAssetRendition): string[] => {
  if (!uri || isInvalidIpfsMediaUri(uri)) return [];

  if (isObjktAssetUrl(uri)) return [uri];

  return toAssetPaths(uri).map(({ key, search }) => `${OBJKT_ASSETS_BASE_URL}/${key}/${rendition}${search}`);
};
