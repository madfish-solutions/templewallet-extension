import { RefObject, useEffect, useSyncExternalStore } from 'react';

export const EVM_COLLECTIBLE_VISIBILITY_PUBLISH_DELAY_MS = 200;

const visibleCounts = new Map<string, number>();
const listeners = new Set<() => void>();
let visibleSlugs: readonly string[] = [];
let publishTimer = 0;

const publishVisibleSlugs = () => {
  visibleSlugs = Array.from(visibleCounts.keys());
  console.log('publishVisibleSlugs', visibleSlugs);
  listeners.forEach(listener => listener());
};

const schedulePublish = () => {
  window.clearTimeout(publishTimer);
  publishTimer = window.setTimeout(publishVisibleSlugs, EVM_COLLECTIBLE_VISIBILITY_PUBLISH_DELAY_MS);
};

/** Ref-counted. Each mounted tile reports its own enter and leave. */
const reportEvmCollectibleVisibility = (chainAssetSlug: string, isVisible: boolean) => {
  const count = visibleCounts.get(chainAssetSlug) ?? 0;
  const nextCount = count + (isVisible ? 1 : -1);

  if (nextCount > 0) {
    visibleCounts.set(chainAssetSlug, nextCount);
    if (count > 0) return;
  } else if (count > 0) {
    visibleCounts.delete(chainAssetSlug);
  } else {
    return;
  }

  schedulePublish();
};

export const useVisibleEvmCollectibleSlugs = () =>
  useSyncExternalStore(
    onStoreChange => {
      listeners.add(onStoreChange);

      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => visibleSlugs
  );

const reportedVisibility = new WeakMap<Element, boolean>();
let sharedObserver: IntersectionObserver | undefined;
const observedSlugs = new Map<Element, string>();

const ensureObserver = () => {
  if (sharedObserver) return sharedObserver;

  sharedObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const chainAssetSlug = observedSlugs.get(entry.target);
      if (!chainAssetSlug) continue;
      if (reportedVisibility.get(entry.target) === entry.isIntersecting) continue;

      reportedVisibility.set(entry.target, entry.isIntersecting);
      reportEvmCollectibleVisibility(chainAssetSlug, entry.isIntersecting);
    }
  });

  return sharedObserver;
};

const observeEvmCollectible = (element: Element, chainAssetSlug: string) => {
  if (typeof IntersectionObserver === 'undefined') {
    reportEvmCollectibleVisibility(chainAssetSlug, true);

    return () => reportEvmCollectibleVisibility(chainAssetSlug, false);
  }

  observedSlugs.set(element, chainAssetSlug);
  ensureObserver().observe(element);

  return () => {
    const wasVisible = reportedVisibility.get(element);
    reportedVisibility.delete(element);
    observedSlugs.delete(element);
    sharedObserver?.unobserve(element);
    if (wasVisible) reportEvmCollectibleVisibility(chainAssetSlug, false);
  };
};

/** Calls `reportEvmCollectibleVisibility` when `elemRef` enters or leaves the viewport. */
export const useReportEvmCollectibleVisibility = (
  chainAssetSlug: string | undefined,
  elemRef: RefObject<Element | null>
) => {
  useEffect(() => {
    const element = elemRef.current;
    if (!chainAssetSlug || !element) return;

    return observeEvmCollectible(element, chainAssetSlug);
  }, [chainAssetSlug, elemRef]);
};
