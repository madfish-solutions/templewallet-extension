import { isAlchemyChainId } from 'app/store/evm/collectibles-inventory/chains';
import type { AccountAsset } from 'lib/assets/types';

import { getCollectibleAssetStatus } from './utils';

export interface AccountCollectible extends AccountAsset {
  chainId: string | number;
  /** Set when the account added this NFT itself. */
  manual?: boolean;
}

interface StoredCollectible {
  status: AccountAsset['status'];
  manual?: boolean;
}

const toAccountCollectible = (
  slug: string,
  chainId: string | number,
  balance: string | undefined,
  stored: StoredCollectible | undefined,
  fallbackStatus: AccountAsset['status'] = 'idle'
): AccountCollectible | undefined => {
  const status = stored?.status ?? fallbackStatus;
  if (status === 'removed') return undefined;

  return {
    slug,
    chainId,
    manual: stored?.manual,
    status: getCollectibleAssetStatus(balance, stored ?? { status: fallbackStatus })
  };
};

/** Alchemy chains list the inventory, then any manually added NFT the inventory left out. */
export const evmAccountCollectiblesForChain = (
  chainId: number,
  stored: Record<string, StoredCollectible> | undefined,
  balances: Record<string, string | undefined> | undefined,
  inventory: { settled: boolean; loaded: ReadonlyArray<{ slug: string }> } | undefined
): AccountCollectible[] => {
  if (!isAlchemyChainId(chainId)) {
    if (!stored) return [];

    return Object.entries(stored).flatMap(([slug, asset]) => {
      const collectible = toAccountCollectible(slug, chainId, balances?.[slug], asset);

      return collectible ? [collectible] : [];
    });
  }

  const storedBySlug = new Map<string, StoredCollectible>();
  if (stored) {
    for (const [slug, asset] of Object.entries(stored)) {
      const key = slug.toLowerCase();
      const previous = storedBySlug.get(key);
      if (!previous || asset.status === 'removed' || asset.status === 'disabled') storedBySlug.set(key, asset);
    }
  }

  const listed = new Set<string>();
  const collectibles: AccountCollectible[] = [];
  const push = (slug: string, asset: StoredCollectible | undefined, fallbackStatus: AccountAsset['status']) => {
    const key = slug.toLowerCase();
    if (listed.has(key)) return;

    const collectible = toAccountCollectible(slug, chainId, balances?.[slug], asset, fallbackStatus);
    if (!collectible) return;

    listed.add(key);
    collectibles.push(collectible);
  };

  if (inventory?.settled) {
    for (const nft of inventory.loaded) push(nft.slug, storedBySlug.get(nft.slug.toLowerCase()), 'enabled');
  }

  if (stored) {
    for (const [slug, asset] of Object.entries(stored)) {
      if (!asset.manual) continue;

      push(slug, asset, asset.status);
    }
  }

  return collectibles;
};

export const tezosAccountCollectibles = (
  chainId: string,
  stored: Record<string, StoredCollectible>,
  balances: Record<string, string | undefined>
) =>
  Object.entries(stored).flatMap(([slug, asset]) => {
    const collectible = toAccountCollectible(slug, chainId, balances[slug], asset);

    return collectible ? [collectible] : [];
  });
