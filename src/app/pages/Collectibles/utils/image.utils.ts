const IPFS_PROTOCOL_PREFIX = 'ipfs://';
const OBJKT_ORIGIN = 'https://assets.objkt.media/file';
const OBJKT_RESIZE_3 = 'assets-003';

const SVG_DATA_URI_UTF8_PREFIX = 'data:image/svg+xml;charset=utf-8,';

export const formatCollectibleObjktArtifactUri = (artifactUri: string) =>
  `${OBJKT_ORIGIN}/${OBJKT_RESIZE_3}/${
    artifactUri.startsWith(IPFS_PROTOCOL_PREFIX) ? artifactUri.substring(IPFS_PROTOCOL_PREFIX.length) : artifactUri
  }/artifact`;

export const isSvgDataUriInUtf8Encoding = (uri: string) =>
  uri.slice(0, SVG_DATA_URI_UTF8_PREFIX.length).toLowerCase() === SVG_DATA_URI_UTF8_PREFIX;
