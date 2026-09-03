import { uniq } from 'lodash';
import { CID } from 'multiformats/cid';

import type { ImageSourceStage } from 'lib/ui/race-image-urls';
import { isTruthy } from 'lib/utils';

import chainIdsMapping from './chain-id-to-image-chain-name.json';
import { EnvVars } from './env';
import { EvmAssetStandard } from './evm/types';
import type { TokenMetadata, EvmAssetMetadataBase, EvmCollectibleMetadata } from './metadata/types';

type TcInfraMediaSize = 'small' | 'medium' | 'large' | 'raw';
type ObjktMediaTail = 'display' | 'artifact' | 'thumb288';
type IpfsGate = (info: IpfsUriInfo) => string;

const COMPRESSED_TOKEN_ICON_SIZE = 80;
const COMPRESSED_COLLECTIBLE_ICON_SIZE = 250;

const IPFS_PROTOCOL = 'ipfs://';

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

const DEFAULT_IPFS_GATE = makeCidInPathIpfsGate('ipfs.filebase.io');
const LAST_RESORT_IPFS_GATE = makeCidInPathIpfsGate(EnvVars.LAST_RESORT_IPFS_GATEWAY_DOMAIN);
const PRIMARY_IPFS_GATES = [
  DEFAULT_IPFS_GATE,
  makeCidInDomainIpfsGate('ipfs.4everland.io'),
  makeCidInDomainIpfsGate('ipfs.dweb.link')
];
export const LAST_RESORT_IPFS_DELAY = 5_000;

const MEDIA_HOST = 'https://static.tcinfra.net/media';
const DEFAULT_MEDIA_SIZE: TcInfraMediaSize = 'small';
const OBJKT_MEDIA_HOST = 'https://assets.objkt.media/file/assets-003';

const SVG_DATA_URI_UTF8_PREFIX = 'data:image/svg+xml;charset=utf-8,';

export const isSvgDataUriInUtf8Encoding = (uri: string) =>
  uri.slice(0, SVG_DATA_URI_UTF8_PREFIX.length).toLowerCase() === SVG_DATA_URI_UTF8_PREFIX;

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

const flattenImageSourceStages = (stages: ImageSourceStage[]) => stages.flatMap(stage => stage.urls);

export const buildTokenImagesStack = (url?: string): string[] =>
  flattenImageSourceStages(buildTokenImageSourceStages(url));

export const buildTokenImageSourceStages = (url?: string): ImageSourceStage[] => {
  if (!url) return [];

  if (url.startsWith(IPFS_PROTOCOL) || url.startsWith('http')) {
    const tcinfraStages = buildTcInfraMediaUrls(url, ['small', 'medium'])
      .filter(isTruthy)
      .map(src => ({ urls: [src] }));

    return tcinfraStages.concat(buildIpfsGatewaySourceStages(url));
  }

  if (url.startsWith('data:image/') || url.startsWith('chrome-extension') || url.startsWith('moz-extension')) {
    return [{ urls: [url] }];
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

        ...buildTcInfraMediaUrls(displayUri, ['raw', 'large', 'medium', 'small']),
        ...buildTcInfraMediaUrls(artifactUri, ['raw', 'large', 'medium', 'small'])
      ]
    : [
        // Some image of video asset (see: KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton_773019) only available through this option:
        buildObjktMediaUriForItemPath(`${address}/${id}`, 'thumb288'),

        buildObjktMediaURI(artifactInfo.ipfs, 'thumb288'),
        buildObjktMediaURI(displayInfo.ipfs, 'thumb288'),
        buildObjktMediaURI(thumbnailInfo.ipfs, 'thumb288'),

        ...buildTcInfraMediaUrls(thumbnailUri, ['medium', 'small']),
        ...buildTcInfraMediaUrls(displayUri, ['medium', 'small']),
        ...buildTcInfraMediaUrls(artifactUri, ['medium', 'small'])
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

/** Native URI info plus IPFS info parsed from path-style HTTP gateways. */
const parseMediaUri = (uri?: string) => {
  const native = getMediaUriInfo(uri);
  if (native.ipfs || !uri) return { native, ipfsAware: native };

  const ipfsUri = tryRecoverIpfsUri(uri);
  const ipfs = ipfsUri ? getIpfsItemInfo(ipfsUri) : null;
  if (!ipfs) return { native, ipfsAware: native };

  return { native, ipfsAware: { uri, ipfs } };
};

const buildTcInfraMediaUrls = (uri: string | undefined, sizes: TcInfraMediaSize[]) => {
  const { native, ipfsAware } = parseMediaUri(uri);
  const infos = native === ipfsAware ? [native] : [native, ipfsAware];

  return sizes.flatMap(size => infos.map(info => buildIpfsMediaUriByInfo(info, size)));
};

interface IpfsUriInfo {
  id: string;
  idV1: string;
  pathWithoutCid: string;
  /** With leading `?` if applicable */
  search: '' | `?${string}`;
}

const getIpfsItemInfo = (uri: string): IpfsUriInfo | null => {
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

export const buildObjktMediaUriForItemPath = (itemId: string, tail: ObjktMediaTail) =>
  `${OBJKT_MEDIA_HOST}/${itemId}/${tail}`;

const toMediaHostIpfsPath = ({ id, pathWithoutCid, search }: IpfsUriInfo) => {
  const pathWithCid = pathWithoutCid ? `${id}/${pathWithoutCid}` : id;
  const prefix = pathWithCid.includes('ipfs/') ? '' : 'ipfs/';

  return `${prefix}${pathWithCid}${search}`;
};

const buildIpfsMediaUriByInfo = (
  { uri, ipfs: ipfsInfo }: MediaUriInfo,
  size: TcInfraMediaSize = DEFAULT_MEDIA_SIZE,
  useMediaHost = true,
  ipfsGate = DEFAULT_IPFS_GATE
) => {
  if (!uri) {
    return;
  }

  if (ipfsInfo) {
    return useMediaHost ? `${MEDIA_HOST}/${size}/${toMediaHostIpfsPath(ipfsInfo)}` : ipfsGate(ipfsInfo);
  }

  if (useMediaHost && uri.startsWith('http')) {
    // This option also serves as a proxy for any `http` source
    return `${MEDIA_HOST}/${size}/web/${uri.replace(/^https?:\/\//, '')}`;
  }

  return;
};

const buildGatewayUrls = (uri: string | undefined, gates: IpfsGate[]) => {
  if (!uri) return [];

  const { ipfsAware } = parseMediaUri(uri);
  if (!ipfsAware.ipfs) return [uri];

  return gates.map(gate => buildIpfsMediaUriByInfo(ipfsAware, 'small', false, gate)).filter(isTruthy);
};

export const buildPrimaryIpfsGatewayUrls = (uri?: string) => buildGatewayUrls(uri, PRIMARY_IPFS_GATES);

export const buildLastResortIpfsGatewayUrl = (uri?: string) => buildGatewayUrls(uri, [LAST_RESORT_IPFS_GATE])[0];

export const buildIpfsGatewaySourceStages = (uri?: string): ImageSourceStage[] => {
  const primaryUrls = buildPrimaryIpfsGatewayUrls(uri);
  if (primaryUrls.length === 0) return [];

  const lastResortUrl = buildLastResortIpfsGatewayUrl(uri);
  if (!lastResortUrl || (primaryUrls.length === 1 && lastResortUrl === primaryUrls[0])) {
    return [{ urls: primaryUrls }];
  }

  const stages: ImageSourceStage[] = [{ urls: primaryUrls }];
  if (!primaryUrls.includes(lastResortUrl)) {
    stages.push({ urls: [lastResortUrl], delayMs: LAST_RESORT_IPFS_DELAY });
  }

  return stages;
};

const chainIdsChainNamesRecord = chainIdsMapping as Record<string, string>;

const rainbowBaseUrl = 'https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/';
const llamaoBaseUrl = 'https://icons.llamao.fi/icons/chains/';

const getCompressedImageUrl = (imageUrl: string, size: number) =>
  `https://img.templewallet.com/insecure/fill/${size}/${size}/ce/0/plain/${imageUrl}`;

type NativeIconSource = 'rainbow' | 'llamao';

const getImageUrl = (source: NativeIconSource, chainName: string) => {
  if (source === 'llamao') return `${llamaoBaseUrl}rsz_${chainName}.jpg`;

  return `${rainbowBaseUrl}${chainName}/info/logo.png`;
};

export const getEvmNativeAssetIcon = (chainId: number, size?: number, source: NativeIconSource = 'rainbow') => {
  const chainName = chainIdsChainNamesRecord[chainId.toString()];
  if (!chainName) return null;

  const imageUrl = getImageUrl(source, chainName);

  if (size) return getCompressedImageUrl(imageUrl, size);

  return imageUrl;
};

const getEvmCustomChainIconUrl = (
  chainId: number,
  metadata: EvmAssetMetadataBase,
  nativeIconSource: NativeIconSource = 'rainbow'
) => {
  const chainName = chainIdsChainNamesRecord[chainId.toString()];

  if (!chainName) return null;

  return metadata.standard === EvmAssetStandard.NATIVE
    ? getEvmNativeAssetIcon(chainId, undefined, nativeIconSource)
    : `${rainbowBaseUrl}${chainName}/assets/${metadata.address}/logo.png`;
};

export const buildEvmTokenIconSources = (metadata: EvmAssetMetadataBase, chainId: number): string[] => {
  const fallbacks = [
    getEvmCustomChainIconUrl(chainId, metadata),
    metadata.standard === EvmAssetStandard.NATIVE && getEvmCustomChainIconUrl(chainId, metadata, 'llamao'),
    metadata.iconURL
  ];

  return fallbacks.filter(isTruthy).map(url => getCompressedImageUrl(url, COMPRESSED_TOKEN_ICON_SIZE));
};

export const buildEvmCollectibleIconSources = (
  metadata: EvmCollectibleMetadata,
  { includeCompressed = true }: { includeCompressed?: boolean } = {}
): ImageSourceStage[] => {
  const originalUrl = metadata.image;
  if (!originalUrl) return [];

  const gatewayStages = buildIpfsGatewaySourceStages(originalUrl);
  if (!includeCompressed) {
    return gatewayStages;
  }

  const { ipfsAware } = parseMediaUri(originalUrl);
  const mediaHostUrl = buildIpfsMediaUriByInfo(ipfsAware) ?? originalUrl;

  return [{ urls: [getCompressedImageUrl(mediaHostUrl, COMPRESSED_COLLECTIBLE_ICON_SIZE)] }].concat(
    gatewayStages.map(({ urls, ...rest }) => ({
      ...rest,
      urls: urls.map(url => getCompressedImageUrl(url, COMPRESSED_COLLECTIBLE_ICON_SIZE))
    })),
    gatewayStages
  );
};

export const buildHttpLinkFromUri = (uri?: string, ipfsGate = DEFAULT_IPFS_GATE) => {
  if (!uri) return undefined;

  const { ipfsAware } = parseMediaUri(uri);
  if (ipfsAware.ipfs) {
    return buildIpfsMediaUriByInfo(ipfsAware, 'small', false, ipfsGate);
  }

  return uri;
};
