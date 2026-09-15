import axios, { AxiosRequestConfig } from 'axios';
import { CID } from 'multiformats/cid';

import { EnvVars } from 'lib/env';

import { delayUnlessAborted } from './delay-unless-aborted';

import { isTruthy } from '.';

export interface IpfsUriInfo {
  id: string;
  idV1: string;
  pathWithoutCid: string;
  /** With leading `?` if applicable */
  search: '' | `?${string}`;
}

export interface MediaUriInfo {
  uri?: string;
  ipfs: IpfsUriInfo | nullish;
}

type IpfsGate = SyncFn<IpfsUriInfo, string>;

export const IPFS_PROTOCOL = 'ipfs://';

/** Black circle in `thumbnailUri`
 * See:
 * - KT1M2JnD1wsg7w2B4UXJXtKQPuDUpU2L7cJH_79
 * - KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_19484
 * - KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_3312
 */
const INVALID_IPFS_ID = 'QmNrhZHUaEqxhyLfqoq1mtHSipkWHeT31LNHb1QEbDHgnc';

const joinCidPath = (cid: string, { pathWithoutCid, search }: IpfsUriInfo) => {
  const nestedPath = pathWithoutCid ? `/${pathWithoutCid}` : '';

  return `${cid}${nestedPath}${search}`;
};

const makeCidInPathIpfsGate =
  (domain: string): IpfsGate =>
  info =>
    `https://${domain}/ipfs/${joinCidPath(info.id, info)}`;

const makeCidInDomainIpfsGate =
  (domain: string): IpfsGate =>
  info => {
    const nestedPath = info.pathWithoutCid ? `/${info.pathWithoutCid}` : '';

    return `https://${info.idV1}.${domain}${nestedPath}${info.search}`;
  };

export const DEFAULT_IPFS_GATE = makeCidInPathIpfsGate('ipfs.filebase.io');
const LAST_RESORT_IPFS_GATE = makeCidInPathIpfsGate(EnvVars.LAST_RESORT_IPFS_GATEWAY_DOMAIN);
const PRIMARY_IPFS_GATES = [
  DEFAULT_IPFS_GATE,
  makeCidInDomainIpfsGate('ipfs.4everland.io'),
  makeCidInDomainIpfsGate('ipfs.dweb.link')
];

const tryRecoverIpfsUri = (url: string) => {
  const [urlBeforeSearch, searchWithoutMark = ''] = url.split('?');
  const search = searchWithoutMark ? `?${searchWithoutMark}` : '';
  const urlBeforeSearchParts = urlBeforeSearch.split('/');
  const cidIndex = urlBeforeSearchParts.findIndex(part => {
    try {
      CID.parse(part);

      return true;
    } catch {
      return false;
    }
  });

  if (cidIndex === -1) return;

  const cid = urlBeforeSearchParts[cidIndex];
  let nestedPath = urlBeforeSearchParts
    .slice(cidIndex + 1)
    .filter(isTruthy)
    .join('/');
  if (nestedPath) {
    nestedPath = `/${nestedPath}`;
  }

  return `${IPFS_PROTOCOL}${cid}${nestedPath}${search}`;
};

export const getIpfsItemInfo = (uri: string): IpfsUriInfo | null => {
  if (!uri.startsWith(IPFS_PROTOCOL)) {
    return null;
  }

  const [pathWithCid, search] = uri.slice(IPFS_PROTOCOL.length).split('?');
  const id = pathWithCid.split('/')[0];
  const pathWithoutCid = pathWithCid.slice(id.length + 1);

  if (!id || id === INVALID_IPFS_ID) {
    return null;
  }

  try {
    return {
      id,
      idV1: CID.parse(id).toV1().toString(),
      pathWithoutCid,
      search: search ? `?${search}` : ''
    };
  } catch {
    return null;
  }
};

export const getMediaUriInfo = (uri?: string): MediaUriInfo => ({
  uri,
  ipfs: uri ? getIpfsItemInfo(uri) : null
});

/** Native URI info plus IPFS info parsed from path-style HTTP gateways. */
export const parseMediaUri = (uri?: string) => {
  const native = getMediaUriInfo(uri);
  if (native.ipfs || !uri) return { native, ipfsAware: native };

  const ipfsUri = tryRecoverIpfsUri(uri);
  const ipfs = ipfsUri ? getIpfsItemInfo(ipfsUri) : null;
  if (!ipfs) return { native, ipfsAware: native };

  return { native, ipfsAware: { uri, ipfs } };
};

const buildGatewayUrls = (uri: string | undefined, gates: IpfsGate[]) => {
  if (!uri) return [];

  const { ipfsAware } = parseMediaUri(uri);
  const ipfsUriInfo = ipfsAware.ipfs;

  if (!ipfsUriInfo) return [uri];

  return gates.map(gate => gate(ipfsUriInfo)).filter(isTruthy);
};

export const buildPrimaryIpfsGatewayUrls = (uri?: string) => buildGatewayUrls(uri, PRIMARY_IPFS_GATES);
export const buildLastResortIpfsGatewayUrl = (uri?: string) => buildGatewayUrls(uri, [LAST_RESORT_IPFS_GATE])[0];

const DEFAULT_MAX_REDIRECTS = 4;
export const LAST_RESORT_IPFS_DELAY = 5_000;

export const getIpfsGenericFile = async <T>(
  uri: string,
  options: Omit<AxiosRequestConfig, 'signal'> & { controller?: AbortController } = {}
) => {
  const { controller = new AbortController(), maxRedirects = DEFAULT_MAX_REDIRECTS, ...otherOptions } = options;
  const { signal } = controller;
  const requestOptions = { signal, maxRedirects, ...otherOptions };

  const lastResortUri = buildLastResortIpfsGatewayUrl(uri);

  if (!lastResortUri) throw new Error();

  if (lastResortUri === uri) {
    return axios.get<T>(uri, requestOptions);
  }

  const requests = buildPrimaryIpfsGatewayUrls(uri)
    .map(uri => axios.get<T>(uri, requestOptions))
    .concat(delayUnlessAborted(LAST_RESORT_IPFS_DELAY, signal).then(() => axios.get<T>(lastResortUri, requestOptions)));
  requests.forEach(request => void request.catch(() => undefined));

  try {
    return await Promise.any(requests);
  } finally {
    controller.abort();
  }
};
