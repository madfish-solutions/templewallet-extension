import React, { FC, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { noop } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDebounce } from 'use-debounce';

import { IS_FIREFOX } from 'lib/env';

import { SimpleInfiniteScroll, SimpleInfiniteScrollProps } from './SimpleInfiniteScroll';

interface ListItemsVisibility {
  top: number;
  bottom: number;
}

const debounceOptions = {
  equalityFn: (a: ListItemsVisibility, b: ListItemsVisibility) => a.bottom === b.bottom && a.top === b.top
};

interface InfiniteScrollVisibilityContextValue {
  listItemsVisibility: { top: number; bottom: number };
  setListItemsVisibility: (v: { top: number; bottom: number }) => void;
}

const defaultContext: InfiniteScrollVisibilityContextValue = {
  listItemsVisibility: { top: 0, bottom: Infinity },
  setListItemsVisibility: noop
};

const InfiniteScrollVisibilityContext = createContext<InfiniteScrollVisibilityContextValue>(defaultContext);

const useInfiniteScrollVisibilityContext = () => useContext(InfiniteScrollVisibilityContext);

const InfiniteScrollVisibilityContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [listItemsVisibility, setListItemsVisibility] = useState({ top: 0, bottom: Infinity });
  const [listItemsVisibilityDebounced] = useDebounce(listItemsVisibility, 50, debounceOptions);

  const value = useMemo(
    () => ({ listItemsVisibility: listItemsVisibilityDebounced, setListItemsVisibility }),
    [listItemsVisibilityDebounced, setListItemsVisibility]
  );

  return <InfiniteScrollVisibilityContext value={value}>{children}</InfiniteScrollVisibilityContext>;
};

export interface VisibilityTrackingInfiniteScrollProps extends PropsWithChildren<
  Omit<SimpleInfiniteScrollProps, 'onScroll'>
> {
  /** Return the indexes of the elements that are located at the height of `y` relatively to the scrollable node */
  getElementsIndexes: (y: number) => number[];
}

export const VisibilityTrackingInfiniteScroll: FC<VisibilityTrackingInfiniteScrollProps> = props => (
  <InfiniteScrollVisibilityContextProvider>
    <VisibilityTrackingInfiniteScrollContent {...props} />
  </InfiniteScrollVisibilityContextProvider>
);

const VisibilityTrackingInfiniteScrollContent: FC<VisibilityTrackingInfiniteScrollProps> = ({
  children,
  getElementsIndexes,
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
      top: Math.min(...getElementsIndexes(scrollableNode.scrollTop)),
      bottom: Math.max(...getElementsIndexes(scrollableNode.scrollTop + scrollableNode.clientHeight))
    });
  }, [getElementsIndexes, setListItemsVisibility]);

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
  if (!IS_FIREFOX) return true;

  return useIsItemVisibleFirefox(index);
};

const useIsItemVisibleFirefox = (index: number | undefined) => {
  const { listItemsVisibility } = useInfiniteScrollVisibilityContext();

  return useMemo(() => {
    if (index == null) return true;

    return index >= listItemsVisibility.top && index <= listItemsVisibility.bottom;
  }, [index, listItemsVisibility]);
};
