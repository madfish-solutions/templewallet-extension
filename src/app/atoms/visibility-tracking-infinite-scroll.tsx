import React, {
  FC,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';

import InfiniteScroll from 'react-infinite-scroll-component';

import { combineRefs } from 'lib/ui/utils';

import { SimpleInfiniteScroll, SimpleInfiniteScrollProps } from './SimpleInfiniteScroll';

interface ListItemsVisibility {
  top: number;
  bottom: number;
}

/**
  Narrow the initial window so the first paint only renders a few items fully;
  the real window expands once updateScrollDimensions runs after layout.
*/
const INITIAL_VISIBLE_COUNT = 20;
// The scroll library reports the position at most every 150 ms; margin and slack must cover a fling's rows in that time.
const RENDER_MARGIN = 40;
const RENDER_SLACK = 15;

interface VisibilityStore {
  subscribe: (listener: EmptyFn) => EmptyFn;
  isVisible: (index: number) => boolean;
  update: (next: ListItemsVisibility) => void;
}

const createVisibilityStore = (sliding: boolean): VisibilityStore => {
  let rendered: ListItemsVisibility = { top: 0, bottom: INITIAL_VISIBLE_COUNT };
  const listeners = new Set<EmptyFn>();

  const move = (next: ListItemsVisibility) => {
    rendered = next;
    listeners.forEach(listener => listener());
  };

  return {
    subscribe: listener => {
      listeners.add(listener);

      return () => void listeners.delete(listener);
    },
    isVisible: index => index >= rendered.top && index <= rendered.bottom,
    update: next => {
      // an empty getElementsIndexes result arrives as ±Infinity through Math.min/max
      if (!Number.isFinite(next.top) || !Number.isFinite(next.bottom)) return;

      if (!sliding) {
        const top = Math.min(rendered.top, next.top);
        const bottom = Math.max(rendered.bottom, next.bottom);

        if (top !== rendered.top || bottom !== rendered.bottom) move({ top, bottom });

        return;
      }

      const withinTop = rendered.top === 0 || next.top - rendered.top >= RENDER_SLACK;
      const withinBottom = rendered.bottom - next.bottom >= RENDER_SLACK;

      if (!withinTop || !withinBottom) {
        move({ top: Math.max(0, next.top - RENDER_MARGIN), bottom: next.bottom + RENDER_MARGIN });
      }
    }
  };
};

const defaultVisibilityStore = createVisibilityStore(false);

const InfiniteScrollVisibilityContext = createContext<VisibilityStore>(defaultVisibilityStore);

const InfiniteScrollVisibilityContextProvider: FC<PropsWithChildren<{ sliding: boolean }>> = ({
  sliding,
  children
}) => {
  const [store] = useState(() => createVisibilityStore(sliding));

  return <InfiniteScrollVisibilityContext value={store}>{children}</InfiniteScrollVisibilityContext>;
};

export interface VisibilityTrackingInfiniteScrollProps extends PropsWithChildren<
  Omit<SimpleInfiniteScrollProps, 'onScroll'>
> {
  /** Return the indexes of the elements that are located at the height of `y` relatively to the scrollable node */
  getElementsIndexes: (y: number) => number[];
  /** Rows far out of view unmount; off by default, rows then stay rendered once seen. Read on mount. */
  slidingWindow?: boolean;
}

export const VisibilityTrackingInfiniteScroll: FC<VisibilityTrackingInfiniteScrollProps> = ({
  slidingWindow = false,
  ...props
}) => (
  <InfiniteScrollVisibilityContextProvider sliding={slidingWindow}>
    <VisibilityTrackingInfiniteScrollContent {...props} />
  </InfiniteScrollVisibilityContextProvider>
);

const VisibilityTrackingInfiniteScrollContent: FC<VisibilityTrackingInfiniteScrollProps> = ({
  children,
  getElementsIndexes,
  ref,
  ...restProps
}) => {
  const store = useContext(InfiniteScrollVisibilityContext);
  const internalScrollViewRef = useRef<InfiniteScroll>(null);
  const scrollViewRef = combineRefs(internalScrollViewRef, ref);

  const getScrollableNode = useCallback((): HTMLElement | nullish => {
    const scrollView = internalScrollViewRef.current;

    // @ts-expect-error: accessing private property
    return scrollView ? (scrollView.getScrollableTarget() ?? scrollView._infScroll) : null;
  }, []);

  const updateScrollDimensions = useCallback(() => {
    const scrollableNode = getScrollableNode();

    if (!scrollableNode) return;

    store.update({
      top: Math.min(...getElementsIndexes(scrollableNode.scrollTop)),
      bottom: Math.max(...getElementsIndexes(scrollableNode.scrollTop + scrollableNode.clientHeight))
    });
  }, [getElementsIndexes, getScrollableNode, store]);

  useEffect(() => {
    updateScrollDimensions();

    const scrollableNode = internalScrollViewRef.current?.getScrollableTarget();
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
  const store = useContext(InfiniteScrollVisibilityContext);

  return useSyncExternalStore(store.subscribe, () => index == null || store.isVisible(index));
};
