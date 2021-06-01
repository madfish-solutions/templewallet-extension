export const IPFS_GATEWAY = "ipfs.io";

export function formatImgUri(origin: string) {
  if (origin.startsWith("ipfs://")) {
    return `https://${IPFS_GATEWAY}/ipfs/${origin.substring(7)}/`;
  }
  return origin;
}

export function sanitizeImgUri(url: string, x = 64, y = 64) {
  if (url.startsWith("http")) {
    return `https://img.templewallet.com/insecure/fit/${x}/${y}/ce/0/plain/${url}`;
  }
  return url;
}
