import { RefCallback, useCallback } from 'react';

import { throttle } from 'lodash';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';
import {
  useEvmCollectibleMetadataSelector,
  useIsEvmCollectibleCheckedSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';

interface ObservedTarget {
  chainId: number;
  assetSlug: string;
  visible: boolean;
}

const NOTIFY_THROTTLE_MS = 300;

const requestCounts = new Map<number, Map<string, number>>();
const listeners = new Set<EmptyFn>();
const observers = new Map<Element | null, IntersectionObserver>();
const observedCounts = new Map<Element | null, number>();
const targets = new Map<Element, ObservedTarget>();
let snapshot = 0;

export const subscribeToRequestedEvmCollectibles = (listener: EmptyFn): EmptyFn => {
  listeners.add(listener);

  return () => void listeners.delete(listener);
};

export const getRequestedEvmCollectiblesSnapshot = () => snapshot;

export const getRequestedEvmCollectibleSlugs = (): Record<number, string[]> => {
  const result: Record<number, string[]> = {};

  for (const [chainId, slugs] of requestCounts) result[chainId] = Array.from(slugs.keys());

  return result;
};

const notify = throttle(
  () => {
    snapshot++;
    listeners.forEach(listener => listener());
  },
  NOTIFY_THROTTLE_MS,
  { leading: false }
);

const register = (chainId: number, assetSlug: string) => {
  const slugs = requestCounts.get(chainId) ?? new Map<string, number>();
  const count = slugs.get(assetSlug) ?? 0;

  slugs.set(assetSlug, count + 1);
  requestCounts.set(chainId, slugs);

  if (count === 0) notify();
};

const unregister = (chainId: number, assetSlug: string) => {
  const slugs = requestCounts.get(chainId);
  const count = slugs?.get(assetSlug);

  if (!slugs || count === undefined) return;

  if (count > 1) {
    slugs.set(assetSlug, count - 1);

    return;
  }

  slugs.delete(assetSlug);
  if (slugs.size === 0) requestCounts.delete(chainId);
  notify();
};

const handleIntersections = (entries: IntersectionObserverEntry[]) => {
  for (const { target, isIntersecting } of entries) {
    const observed = targets.get(target);

    if (!observed || observed.visible === isIntersecting) continue;

    observed.visible = isIntersecting;

    if (isIntersecting) register(observed.chainId, observed.assetSlug);
    else unregister(observed.chainId, observed.assetSlug);
  }
};

const getScrollRoot = () => (SCROLL_DOCUMENT ? null : document.getElementById(APP_CONTENT_PAPER_DOM_ID));

const observe = (element: Element, chainId: number, assetSlug: string): EmptyFn => {
  const root = getScrollRoot();
  const observer =
    observers.get(root) ?? new IntersectionObserver(handleIntersections, { root, rootMargin: '50% 0px' });
  const target: ObservedTarget = { chainId, assetSlug, visible: false };

  observers.set(root, observer);
  observedCounts.set(root, (observedCounts.get(root) ?? 0) + 1);
  targets.set(element, target);
  observer.observe(element);

  return () => {
    observer.unobserve(element);
    targets.delete(element);

    if (target.visible) unregister(chainId, assetSlug);

    const count = observedCounts.get(root) ?? 0;

    if (count > 1) {
      observedCounts.set(root, count - 1);

      return;
    }

    observedCounts.delete(root);
    observers.delete(root);
    observer.disconnect();
  };
};

const useRequestEvmCollectibleMetadata = (chainId: number, assetSlug: string, enabled: boolean) =>
  useCallback<RefCallback<Element>>(
    element => {
      if (!element || !enabled) return;

      if (typeof IntersectionObserver === 'undefined') {
        register(chainId, assetSlug);

        return () => unregister(chainId, assetSlug);
      }

      return observe(element, chainId, assetSlug);
    },
    [chainId, assetSlug, enabled]
  );

export const useEvmCollectibleTileMetadata = (
  accountPkh: HexString | undefined,
  chainId: number,
  assetSlug: string
) => {
  const metadata = useEvmCollectibleMetadataSelector(chainId, assetSlug);
  const checked = useIsEvmCollectibleCheckedSelector(accountPkh, chainId, assetSlug);
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();
  const wrapperElemRef = useRequestEvmCollectibleMetadata(chainId, assetSlug, !metadata);

  return { metadata, metadataLoading: (!checked && !metadata) || metadatasLoading, wrapperElemRef };
};
