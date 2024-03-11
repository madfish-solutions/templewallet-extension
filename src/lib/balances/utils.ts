export function getBalanceSWRKey(rpcUrl: string, assetSlug: string, address: string) {
  return ['balance', rpcUrl, assetSlug, address];
}
