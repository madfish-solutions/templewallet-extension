import { uniq } from 'lodash';

import type { ImageSourceStage } from 'lib/ui/race-image-urls';
import { isTruthy } from 'lib/utils';

import chainIdsMapping from './chain-id-to-image-chain-name.json';
import { EvmAssetStandard } from './evm/types';
import type { TokenMetadata, EvmAssetMetadataBase, EvmCollectibleMetadata } from './metadata/types';
import {
  buildLastResortIpfsGatewayUrl,
  buildPrimaryIpfsGatewayUrls,
  DEFAULT_IPFS_GATE,
  IPFS_PROTOCOL,
  IpfsUriInfo,
  isInvalidIpfsMediaUri,
  LAST_RESORT_IPFS_DELAY,
  MediaUriInfo,
  parseMediaUri
} from './utils/ipfs';
import {
  buildObjktAssetUrls,
  buildObjktTokenThumbnailUrl,
  isObjktAssetUrl,
  ObjktAssetRendition
} from './utils/objkt-cdn';

type TcInfraMediaSize = 'small' | 'medium' | 'large' | 'raw';

const COMPRESSED_TOKEN_ICON_SIZE = 80;
const COMPRESSED_COLLECTIBLE_ICON_SIZE = 250;

const MEDIA_HOST = 'https://static.tcinfra.net/media';
const DEFAULT_MEDIA_SIZE: TcInfraMediaSize = 'small';

const SVG_DATA_URI_UTF8_PREFIX = 'data:image/svg+xml;charset=utf-8,';

export const isSvgDataUriInUtf8Encoding = (uri: string) =>
  uri.slice(0, SVG_DATA_URI_UTF8_PREFIX.length).toLowerCase() === SVG_DATA_URI_UTF8_PREFIX;

const isImageDataUri = (uri: string) => uri.startsWith('data:image/');

const flattenImageSourceStages = (stages: ImageSourceStage[]) => stages.flatMap(stage => stage.urls);

export const buildTokenImageSourceStages = (url?: string): ImageSourceStage[] => {
  if (!url) return [];

  if (url.startsWith(IPFS_PROTOCOL) || url.startsWith('http')) {
    const tcinfraStages = buildTcInfraMediaUrls(url, ['small', 'medium'])
      .filter(isTruthy)
      .map(src => ({ urls: [src] }));

    return tcinfraStages.concat(buildIpfsGatewaySourceStages(url));
  }

  if (isImageDataUri(url) || url.startsWith('chrome-extension') || url.startsWith('moz-extension')) {
    return [{ urls: [url] }];
  }

  return [];
};

const isGatewayFallbackUri = (uri: string) =>
  !isInvalidIpfsMediaUri(uri) && !isObjktAssetUrl(uri) && (uri.startsWith(IPFS_PROTOCOL) || uri.startsWith('http'));

const dedupeStages = (stages: ImageSourceStage[]): ImageSourceStage[] => {
  const seen = new Set<string>();

  return stages.flatMap(stage => {
    const urls = stage.urls.filter(url => !seen.has(url));
    urls.forEach(url => seen.add(url));

    return urls.length > 0 ? [{ ...stage, urls }] : [];
  });
};

const buildObjktStages = (uris: Array<string | undefined>, rendition: ObjktAssetRendition): ImageSourceStage[] =>
  uris
    .filter(isTruthy)
    .flatMap(uri => (isImageDataUri(uri) ? [uri] : buildObjktAssetUrls(uri, rendition)))
    .map(url => ({ urls: [url] }));

/** objkt's CDN first, then the IPFS gateways for the first URI they can serve. */
const buildTezosMediaStages = (uris: Array<string | undefined>, rendition: ObjktAssetRendition) => {
  const gatewayUri = uris.filter(isTruthy).find(isGatewayFallbackUri);

  return dedupeStages(buildObjktStages(uris, rendition).concat(buildIpfsGatewaySourceStages(gatewayUri)));
};

export const buildCollectibleImageSourceStages = (
  { address, id, artifactUri, displayUri, thumbnailUri }: TokenMetadata,
  fullView = false
): ImageSourceStage[] => {
  if (fullView) return buildTezosMediaStages([displayUri, artifactUri, thumbnailUri], 'artifact');

  const previewStages = buildTezosMediaStages([thumbnailUri, displayUri], 'artifact');

  return dedupeStages([
    { urls: [buildObjktTokenThumbnailUrl(address, id)] },
    ...(previewStages.length > 0 ? previewStages : buildTezosMediaStages([artifactUri], 'artifact'))
  ]);
};

export const buildCollectionLogoSourceStages = (logoUri?: string): ImageSourceStage[] =>
  dedupeStages(buildObjktStages([logoUri], 'thumb288').concat(buildTezosMediaStages([logoUri], 'artifact')));

export const buildCollectionLogoSources = (logoUri?: string): string[] =>
  flattenImageSourceStages(buildCollectionLogoSourceStages(logoUri));

export const appendExtraSource = (stages: ImageSourceStage[], extraSrc?: string): ImageSourceStage[] =>
  extraSrc && !stages.some(stage => stage.urls.includes(extraSrc)) ? stages.concat({ urls: [extraSrc] }) : stages;

const isDirectlyLoadableUri = (uri: string) => /^(https?|data|blob):/.test(uri);

export const buildObjktCollectibleArtifactUris = (artifactUri: string): string[] => {
  const objktUrls = buildObjktAssetUrls(artifactUri, 'artifact');
  const fallbacks = objktUrls.length === 0 || isDirectlyLoadableUri(artifactUri) ? [artifactUri] : [];

  return uniq(objktUrls.concat(fallbacks));
};

export const buildObjktCollectibleArtifactUri = (artifactUri: string) =>
  isDirectlyLoadableUri(artifactUri) ? artifactUri : buildObjktAssetUrls(artifactUri, 'artifact').at(0);

const buildTcInfraMediaUrls = (uri: string | undefined, sizes: TcInfraMediaSize[]) => {
  const { native, ipfsAware } = parseMediaUri(uri);
  const infos = native === ipfsAware ? [native] : [native, ipfsAware];

  return sizes.flatMap(size => infos.map(info => buildIpfsMediaUriByInfo(info, size)));
};

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

  return [
    {
      urls: [getCompressedImageUrl(mediaHostUrl, COMPRESSED_COLLECTIBLE_ICON_SIZE)]
    }
  ].concat(
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
