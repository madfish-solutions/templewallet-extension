import { MutableRefObject, useCallback, useEffect, useRef } from 'react';

import type { BannerElement, NativeElement } from '@hypelab/sdk-react';

import { useElementValue } from 'app/hooks/ads/use-element-value';

const deepChildrenObserverOptions = { childList: true, subtree: true };

export function useChildAdElementRef<T extends BannerElement | NativeElement>(
  parentRef: MutableRefObject<HTMLElement | null>,
  tagName: 'hype-banner' | 'hype-native'
): MutableRefObject<T | null> {
  const getAdElement = useCallback(() => parentRef.current?.querySelector(tagName) ?? null, [parentRef, tagName]);

  const adElement = useElementValue(parentRef, getAdElement, null, deepChildrenObserverOptions);
  const adElementRef = useRef<T | null>(null);
  useEffect(() => {
    adElementRef.current = adElement as T | null;
  }, [adElement]);

  return adElementRef;
}
