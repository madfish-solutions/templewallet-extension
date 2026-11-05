import { RefCallback, useCallback, useEffect, useRef, useState } from 'react';

import { throttle } from 'lodash';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';
import {
  useEvmCollectibleMetadataSelector,
  useIsEvmCollectibleCheckedSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useUpdatableRef } from 'lib/ui/hooks';

interface ObservedTarget {
  chainId: number;
  assetSlug: string;
  visible: boolean;
  requestsMetadata: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

const NOTIFY_THROTTLE_MS = 300;
const IN_VIEW_DWELL_MS = 250;

const requestCounts = new Map<number, Map<string, number>>();
const listeners = new Set<EmptyFn>();
const observers = new Map<Element | null, { observer: IntersectionObserver; count: number }>();
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

const setRequestsMetadata = (target: ObservedTarget, requestsMetadata: boolean) => {
  if (target.requestsMetadata === requestsMetadata) return;

  target.requestsMetadata = requestsMetadata;

  if (!target.visible) return;

  if (requestsMetadata) register(target.chainId, target.assetSlug);
  else unregister(target.chainId, target.assetSlug);
};

const handleIntersections = (entries: IntersectionObserverEntry[]) => {
  for (const { target, isIntersecting } of entries) {
    const observed = targets.get(target);

    if (!observed || observed.visible === isIntersecting) continue;

    observed.visible = isIntersecting;

    if (observed.requestsMetadata) {
      if (isIntersecting) register(observed.chainId, observed.assetSlug);
      else unregister(observed.chainId, observed.assetSlug);
    }

    observed.onVisibilityChange(isIntersecting);
  }
};

const getScrollRoot = () => (SCROLL_DOCUMENT ? null : document.getElementById(APP_CONTENT_PAPER_DOM_ID));

const observe = (element: Element, target: ObservedTarget): EmptyFn => {
  const root = getScrollRoot();
  const shared = observers.get(root) ?? {
    observer: new IntersectionObserver(handleIntersections, { root, rootMargin: '50% 0px' }),
    count: 0
  };

  shared.count += 1;
  observers.set(root, shared);
  targets.set(element, target);
  shared.observer.observe(element);

  return () => {
    shared.observer.unobserve(element);
    targets.delete(element);

    if (target.visible && target.requestsMetadata) unregister(target.chainId, target.assetSlug);

    shared.count -= 1;

    if (shared.count > 0) return;

    observers.delete(root);
    shared.observer.disconnect();
  };
};

const showWithoutObserver = (target: ObservedTarget): EmptyFn => {
  target.visible = true;

  if (target.requestsMetadata) register(target.chainId, target.assetSlug);

  return () => {
    if (target.requestsMetadata) unregister(target.chainId, target.assetSlug);
  };
};

const useEvmCollectibleTileObserver = (chainId: number, assetSlug: string, requestsMetadata: boolean) => {
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined');
  const targetRef = useRef<ObservedTarget | null>(null);
  const requestsMetadataRef = useUpdatableRef(requestsMetadata);

  const wrapperElemRef = useCallback<RefCallback<Element>>(
    element => {
      if (!element) return;

      let dwellTimeoutId: ReturnType<typeof setTimeout> | undefined;
      const target: ObservedTarget = {
        chainId,
        assetSlug,
        visible: false,
        requestsMetadata: requestsMetadataRef.current,
        onVisibilityChange: visible => {
          clearTimeout(dwellTimeoutId);

          if (visible) dwellTimeoutId = setTimeout(() => setInView(true), IN_VIEW_DWELL_MS);
          else setInView(false);
        }
      };
      targetRef.current = target;

      const stopObserving =
        typeof IntersectionObserver === 'undefined' ? showWithoutObserver(target) : observe(element, target);

      return () => {
        clearTimeout(dwellTimeoutId);
        stopObserving();
        if (targetRef.current === target) targetRef.current = null;
      };
    },
    [chainId, assetSlug, requestsMetadataRef]
  );

  useEffect(() => {
    if (targetRef.current) setRequestsMetadata(targetRef.current, requestsMetadata);
  }, [requestsMetadata]);

  return { wrapperElemRef, inView };
};

export const useEvmCollectibleTileMetadata = (
  accountPkh: HexString | undefined,
  chainId: number,
  assetSlug: string
) => {
  const metadata = useEvmCollectibleMetadataSelector(chainId, assetSlug);
  const checked = useIsEvmCollectibleCheckedSelector(accountPkh, chainId, assetSlug);
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();
  const { wrapperElemRef, inView } = useEvmCollectibleTileObserver(chainId, assetSlug, !metadata?.image);

  return { metadata, metadataLoading: (!checked && !metadata) || metadatasLoading, wrapperElemRef, inView };
};
