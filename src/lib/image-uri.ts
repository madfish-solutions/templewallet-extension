export const IPFS_GATEWAY = 'ipfs.io';

export function formatImgUri(origin = '') {
  if (origin.startsWith('ipfs://')) {
    return `https://${IPFS_GATEWAY}/ipfs/${origin.substring(7)}/`;
  }
  return origin;
}

export function sanitizeImgUri(url = '', x = 64, y = 64) {
  if (url.startsWith('http')) {
    return `https://img.templewallet.com/insecure/fit/${x}/${y}/ce/0/plain/${url}`;
  }
  return url;
}

export const formatCollectibleUri = (address: string, id: string) => {
  return `https://assets.objkt.com/file/assets-001/${address}/${id.length > 1 ? id[id.length - 2] : 0}/${
    id[id.length - 1]
  }/${id}/thumb400`;
};
