import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import constate from 'constate';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDebounce } from 'use-debounce';

import { SimpleInfiniteScroll, SimpleInfiniteScrollProps } from './SimpleInfiniteScroll';

interface ListItemsVisibility {
  top: number;
  bottom: number;
}

const debounceOptions = {
  equalityFn: (a: ListItemsVisibility, b: ListItemsVisibility) => a.bottom === b.bottom && a.top === b.top
};

const [InfiniteScrollVisibilityContextProvider, useInfiniteScrollVisibilityContext] = constate(() => {
  const [listItemsVisibility, setListItemsVisibility] = useState({ top: 0, bottom: Infinity });
  const [listItemsVisibilityDebounced] = useDebounce(listItemsVisibility, 50, debounceOptions);

  return { listItemsVisibility: listItemsVisibilityDebounced, setListItemsVisibility };
});

export interface VisibilityTrackingInfiniteScrollProps
  extends PropsWithChildren<Omit<SimpleInfiniteScrollProps, 'onScroll'>> {
  /** Return the index of the element that is located at the height of `y` relatively to the scrollable node */
  getElementIndex: (y: number) => number;
}

export const VisibilityTrackingInfiniteScroll: FC<VisibilityTrackingInfiniteScrollProps> = props => (
  <InfiniteScrollVisibilityContextProvider>
    <VisibilityTrackingInfiniteScrollContent {...props} />
  </InfiniteScrollVisibilityContextProvider>
);

const VisibilityTrackingInfiniteScrollContent: FC<VisibilityTrackingInfiniteScrollProps> = ({
  children,
  getElementIndex,
  ...restProps
}) => {
  const { setListItemsVisibility } = useInfiniteScrollVisibilityContext();
  const scrollViewRef = useRef<InfiniteScroll>(null);

  const updateScrollDimensions = useCallback(() => {
    const scrollView = scrollViewRef.current;

    if (!scrollView) return;

    // @ts-expect-error: accessing private property
    const scrollableNode: HTMLElement | nullish = scrollView.getScrollableTarget() ?? scrollView._infScroll;

    if (!scrollableNode) return;

    setListItemsVisibility({
      top: getElementIndex(scrollableNode.scrollTop),
      bottom: getElementIndex(scrollableNode.scrollTop + scrollableNode.clientHeight)
    });
  }, [getElementIndex, setListItemsVisibility]);

  useEffect(() => {
    updateScrollDimensions();

    const scrollableNode = scrollViewRef.current?.getScrollableTarget();
    if (scrollableNode) {
      const resizeObserver = new ResizeObserver(() => updateScrollDimensions());
      resizeObserver.observe(scrollableNode);

      return () => resizeObserver.disconnect();
    }

    return;
  }, [updateScrollDimensions]);

  return (
    <SimpleInfiniteScroll onScroll={updateScrollDimensions} ref={scrollViewRef} {...restProps}>
      {children}
    </SimpleInfiniteScroll>
  );
};

export const useIsItemVisible = (index: number | undefined) => {
  const [isVisible, setIsVisible] = useState(true);
  const tokensTabBaseContext = useInfiniteScrollVisibilityContext();
  useEffect(() => {
    if (index != null && tokensTabBaseContext && navigator.userAgent.match(/firefox/i)) {
      const { top, bottom } = tokensTabBaseContext.listItemsVisibility;
      setIsVisible(index >= top && index <= bottom);
    } else {
      setIsVisible(true);
    }
  }, [index, tokensTabBaseContext]);

  return isVisible;
};
