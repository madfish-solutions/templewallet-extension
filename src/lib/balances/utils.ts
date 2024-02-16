import type { ReactiveTezosToolkit } from 'lib/temple/front';

export function getBalanceSWRKey(tezos: ReactiveTezosToolkit, assetSlug: string, address: string) {
  return ['balance', tezos.checksum, assetSlug, address];
}
