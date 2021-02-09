export const IPFS_GATEWAY = "ipfs.io";

export function sanitizeImgUri(origin: string) {
  if (origin.startsWith("ipfs://")) {
    return `https://${IPFS_GATEWAY}/ipfs/${origin.substring(7)}/`;
  }

  return origin;
}
