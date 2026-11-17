import { Semaphore } from 'async-mutex';
import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { CID } from 'multiformats/cid';

import { EnvVars } from 'lib/env';

import { acquireUnlessAborted } from './acquire-unless-aborted';
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

export const isInvalidIpfsMediaUri = (uri: string) => uri.includes(INVALID_IPFS_ID);

const joinCidPath = (cid: string, { pathWithoutCid, search }: IpfsUriInfo) => {
  const nestedPath = pathWithoutCid ? `/${pathWithoutCid}` : '';

  return `${cid}${nestedPath}${search}`;
};

const makeCidInPathIpfsGate =
  (domain: string): IpfsGate =>
  info =>
    `https://${domain}/ipfs/${joinCidPath(info.id, info)}`;

export const DEFAULT_IPFS_GATE = makeCidInPathIpfsGate('ipfs.filebase.io');
const LAST_RESORT_IPFS_GATE = makeCidInPathIpfsGate(EnvVars.LAST_RESORT_IPFS_GATEWAY_DOMAIN);
const PRIMARY_IPFS_GATES = [DEFAULT_IPFS_GATE];

const tryRecoverSubdomainIpfsUri = (url: string) => {
  try {
    const { hostname, pathname, search } = new URL(url);
    const labels = hostname.split('.');
    const cid = labels.at(0);

    if (!cid || labels.at(1) !== 'ipfs' || labels.length < 3) return;

    CID.parse(cid);

    return `${IPFS_PROTOCOL}${cid}${pathname === '/' ? '' : pathname}${search}`;
  } catch {
    return;
  }
};

const tryRecoverIpfsUri = (url: string) => {
  const subdomainIpfsUri = tryRecoverSubdomainIpfsUri(url);

  if (subdomainIpfsUri) return subdomainIpfsUri;

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

const getMediaUriInfo = (uri?: string): MediaUriInfo => ({
  uri,
  ipfs: uri ? getIpfsItemInfo(uri) : null
});

/** Native URI info plus IPFS info parsed from path-style and subdomain HTTP gateway URLs. */
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
const INTERACTIVE_IPFS_TIMEOUT_MS = 15_000;
const MAX_CONCURRENT_BULK_IPFS_FETCHES = 12;
const BULK_IPFS_TIMEOUT_MS = 8_000;
const BULK_IPFS_FAILURE_BACKOFF_MS = 60_000;
const BULK_IPFS_HOST_PAUSE_MS = 30_000;

export const getIpfsGenericFile = async <T>(
  uri: string,
  options: Omit<AxiosRequestConfig, 'signal'> & { controller?: AbortController } = {}
) => {
  const { controller = new AbortController(), maxRedirects = DEFAULT_MAX_REDIRECTS, ...otherOptions } = options;
  const { signal } = controller;
  const requestOptions = { signal, maxRedirects, timeout: INTERACTIVE_IPFS_TIMEOUT_MS, ...otherOptions };

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

export class IpfsBackoffError extends Error {
  constructor(uri: string) {
    super(`Backed off after a recent IPFS failure: ${uri}`);
    this.name = 'IpfsBackoffError';
  }
}

export class IpfsTransientError extends Error {
  constructor(
    uri: string,
    readonly retryAt: number,
    refused = false
  ) {
    super(refused ? `Backed off after a transient IPFS failure: ${uri}` : `Transient IPFS failure: ${uri}`);
    this.name = 'IpfsTransientError';
  }
}

const isTransientFailure = (error: unknown) =>
  isAxiosError(error) &&
  (error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ERR_NETWORK' ||
    (error.response?.status ?? 0) >= 500);

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};

class BulkIpfsFetcher {
  private readonly slots = new Semaphore(MAX_CONCURRENT_BULK_IPFS_FETCHES);
  private readonly failedUntil = new Map<string, { until: number; transient: boolean }>();
  private readonly hostPausedUntil = new Map<string, number>();

  async get<T>(uri: string, signal: AbortSignal): Promise<AxiosResponse<T>> {
    const url = buildPrimaryIpfsGatewayUrls(uri).at(0) ?? uri;
    const host = getHostname(url);

    while (true) {
      const refusal = this.getRefusal(uri);

      if (refusal) throw refusal;

      const pauseLeft = this.getPauseLeft(host);

      if (pauseLeft > 0) {
        await delayUnlessAborted(pauseLeft, signal);
        continue;
      }

      const [, release] = await acquireUnlessAborted(this.slots, signal);

      if (this.getRefusal(uri) || this.getPauseLeft(host) > 0) {
        release();
        continue;
      }

      try {
        const response = await axios.get<T>(url, {
          signal,
          timeout: BULK_IPFS_TIMEOUT_MS,
          maxRedirects: DEFAULT_MAX_REDIRECTS
        });
        this.failedUntil.delete(uri);

        return response;
      } catch (error) {
        if (host !== undefined && isAxiosError(error) && error.response?.status === 429) {
          this.hostPausedUntil.set(host, Date.now() + BULK_IPFS_HOST_PAUSE_MS);
          continue;
        }

        if (!signal.aborted) {
          const failure = { until: Date.now() + BULK_IPFS_FAILURE_BACKOFF_MS, transient: isTransientFailure(error) };
          this.failedUntil.set(uri, failure);

          if (failure.transient) throw new IpfsTransientError(uri, failure.until);
        }

        throw error;
      } finally {
        release();
      }
    }
  }

  private getRefusal(uri: string) {
    const failure = this.failedUntil.get(uri);

    if (!failure || Date.now() >= failure.until) return undefined;

    return failure.transient ? new IpfsTransientError(uri, failure.until, true) : new IpfsBackoffError(uri);
  }

  private getPauseLeft(host: string | undefined) {
    return host === undefined ? 0 : (this.hostPausedUntil.get(host) ?? 0) - Date.now();
  }
}

const bulkIpfsFetcher = new BulkIpfsFetcher();

export const getIpfsGenericFileInBulk = <T>(uri: string, signal: AbortSignal) => bulkIpfsFetcher.get<T>(uri, signal);
