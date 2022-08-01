export const IPFS_GATEWAY = 'cloudflare-ipfs.com';

export function formatIpfsUri(url = '') {
  if (url.startsWith('ipfs://')) {
    return `https://${IPFS_GATEWAY}/ipfs/${url.substring(7)}/`;
  }
  return url;
}

const sanitizeImgUri = (url: string, x = 64, y = 64) => {
  if (url.startsWith('http')) {
    return `https://img.templewallet.com/insecure/fit/${x}/${y}/ce/0/plain/${url}`;
  }
  return url;
};

export const formatTokenUri = (thumbnailUri = '') => {
  const ipfsUri = formatIpfsUri(thumbnailUri);

  return sanitizeImgUri(ipfsUri);
};

export const formatObjktSmallAssetUri = (assetSlug: string) => {
  const [address, id] = assetSlug.split('_');

  return `https://assets.objkt.media/file/assets-003/${address}/${id}/thumb288`;
};
