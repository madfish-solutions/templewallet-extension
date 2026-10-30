import React, {
  FC,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';

import InfiniteScroll from 'react-infinite-scroll-component';

import { getRestoredScrollTop } from 'app/layouts/PageLayout/ScrollRestorer';
import { combineRefs } from 'lib/ui/utils';
import * as Woozie from 'lib/woozie';

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

interface VisibilityStore {
  subscribe: (listener: EmptyFn) => EmptyFn;
  isVisible: (index: number) => boolean;
  update: (next: ListItemsVisibility) => void;
}

const createVisibilityStore = (): VisibilityStore => {
  let rendered: ListItemsVisibility = { top: 0, bottom: INITIAL_VISIBLE_COUNT };
  const listeners = new Set<EmptyFn>();

  return {
    subscribe: listener => {
      listeners.add(listener);

      return () => void listeners.delete(listener);
    },
    isVisible: index => index >= rendered.top && index <= rendered.bottom,
    update: next => {
      // an empty getElementsIndexes result arrives as ±Infinity through Math.min/max
      if (!Number.isFinite(next.top) || !Number.isFinite(next.bottom)) return;

      const top = Math.min(rendered.top, next.top);
      const bottom = Math.max(rendered.bottom, next.bottom);

      if (top === rendered.top && bottom === rendered.bottom) return;

      rendered = { top, bottom };
      listeners.forEach(listener => listener());
    }
  };
};

const defaultVisibilityStore = createVisibilityStore();

const InfiniteScrollVisibilityContext = createContext<VisibilityStore>(defaultVisibilityStore);

const InfiniteScrollVisibilityContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [store] = useState(createVisibilityStore);

  return <InfiniteScrollVisibilityContext value={store}>{children}</InfiniteScrollVisibilityContext>;
};

interface VisibilityTrackingInfiniteScrollProps extends PropsWithChildren<Omit<SimpleInfiniteScrollProps, 'onScroll'>> {
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
  ref,
  ...restProps
}) => {
  const store = useContext(InfiniteScrollVisibilityContext);
  const { trigger, href } = Woozie.useLocation();
  const internalScrollViewRef = useRef<InfiniteScroll>(null);
  const scrollViewRef = combineRefs(internalScrollViewRef, ref);
  const restoredRef = useRef(false);

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

  // Back navigation restores the scroll position after this effect; the rows there must already be real ones in the
  // first paint, or their later swap-in leaves the browser without a scroll anchor if the header or promo changes size.
  useLayoutEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const scrollTop = trigger === 'popstate' ? getRestoredScrollTop(href) : undefined;
    const scrollableNode = getScrollableNode();

    if (scrollTop == null || !scrollableNode) return;

    store.update({
      top: Math.min(...getElementsIndexes(scrollTop)),
      bottom: Math.max(...getElementsIndexes(scrollTop + scrollableNode.clientHeight))
    });
  }, [trigger, href, getScrollableNode, getElementsIndexes, store]);

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
