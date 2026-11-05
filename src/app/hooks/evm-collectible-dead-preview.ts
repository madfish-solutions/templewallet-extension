import { useSyncExternalStore } from 'react';

import { toChainAssetSlug } from 'lib/assets/utils';
import { previewUrlIsOpenseaHosted } from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { TempleChainKind } from 'temple/types';

const failedSlugs = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

const previewUrl = (metadata: EvmCollectibleMetadata | undefined) => metadata?.images?.[0] ?? metadata?.image;

/**
 * Records a visible thumbnail that failed to load.
 * OpenSea CDN previews are ignored so a failed OpenSea image does not request OpenSea again.
 */
export const reportDeadEvmCollectiblePreview = (
  chainId: number | undefined,
  assetSlug: string | undefined,
  metadata: EvmCollectibleMetadata | undefined
) => {
  if (typeof chainId !== 'number' || !assetSlug) return;

  const url = previewUrl(metadata);
  if (!url || previewUrlIsOpenseaHosted(url)) return;

  const chainAssetSlug = toChainAssetSlug(TempleChainKind.EVM, chainId, assetSlug);
  if (failedSlugs.has(chainAssetSlug)) return;

  failedSlugs.add(chainAssetSlug);
  version += 1;
  listeners.forEach(listener => listener());
};

export const useDeadEvmCollectiblePreviewVersion = () =>
  useSyncExternalStore(
    onStoreChange => {
      listeners.add(onStoreChange);

      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => version
  );

export const deadEvmCollectiblePreviewSlugs = (): ReadonlySet<string> => failedSlugs;
