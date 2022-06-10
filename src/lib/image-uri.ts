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

export const formatCollectibleObjktBigUri = (assetSlug: string) => {
  const [address, id] = assetSlug.split('_');

  console.log('big');

  return `https://assets.objkt.media/file/assets-001/${address}/${id.length > 1 ? id[id.length - 2] : 0}/${
    id[id.length - 1]
  }/${id}/thumb400`;
};

export const formatCollectibleObjktMediumUri = (assetSlug: string) => {
  const [address, id] = assetSlug.split('_');

  console.log('med');

  return `https://assets.objkt.media/file/assets-003/${address}/${id}/thumb288`;
};
