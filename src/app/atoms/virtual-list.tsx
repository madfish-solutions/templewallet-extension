import { ReactNode, RefObject, useLayoutEffect, useRef, useState } from 'react';

import {
  observeElementOffset,
  observeWindowOffset,
  useVirtualizer,
  useWindowVirtualizer,
  Virtualizer
} from '@tanstack/react-virtual';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';
import { getRestoredScrollTop } from 'app/layouts/PageLayout/ScrollRestorer';
import { useLocation } from 'lib/woozie';

const OVERSCAN_ITEMS = 10;

interface VirtualListProps<T> {
  items: T[];
  itemHeight: (item: T, rem: number) => number;
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  scrollElementId?: string;
}

// Looked up by id, not through a ref: the page scroller's ref is attached after its children's layout effects run
const getScrollElement = (scrollElementId?: string) =>
  document.getElementById(scrollElementId ?? APP_CONTENT_PAPER_DOM_ID);

const getRootFontSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

const useVirtualListOptions = <T,>(
  { items, itemHeight, itemKey, scrollElementId }: VirtualListProps<T>,
  scrollsWindow: boolean
) => {
  const { trigger, href } = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [rem] = useState(getRootFontSize);
  const [scrollMargin, setScrollMargin] = useState(0);

  const restoredOffset = () =>
    trigger === 'popstate' && !scrollElementId && !scrollsWindow ? getRestoredScrollTop(href) : undefined;

  const measureScrollMargin = () => {
    const root = rootRef.current;
    if (!root) return;

    const rootTop = root.getBoundingClientRect().top;
    const scroller = scrollsWindow ? null : getScrollElement(scrollElementId);
    const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
    const scrollOffset = scrollsWindow ? window.scrollY : (scroller?.scrollTop ?? 0);
    const margin = rootTop - viewportTop + scrollOffset;

    setScrollMargin(prev => (Math.abs(prev - margin) < 1 ? prev : margin));
  };

  useLayoutEffect(measureScrollMargin, [items, scrollElementId, scrollsWindow]);

  return {
    rootRef,
    scrollMargin,
    restoredOffset,
    options: {
      count: items.length,
      estimateSize: (index: number) => itemHeight(items[index], rem),
      getItemKey: (index: number) => itemKey(items[index]),
      overscan: OVERSCAN_ITEMS,
      scrollMargin,
      initialOffset: () => restoredOffset() ?? 0,
      onChange: measureScrollMargin
    }
  };
};

const renderVirtualItems = <T, S extends Element | Window>(
  rootRef: RefObject<HTMLDivElement | null>,
  scrollMargin: number,
  virtualizer: Virtualizer<S, Element>,
  { items, renderItem }: VirtualListProps<T>
) => (
  <div ref={rootRef} className="relative shrink-0" style={{ height: virtualizer.getTotalSize() }}>
    {virtualizer.getVirtualItems().map(virtualItem => (
      <div
        key={virtualItem.key}
        className="absolute inset-x-0"
        style={{ top: virtualItem.start - scrollMargin, height: virtualItem.size }}
      >
        {renderItem(items[virtualItem.index])}
      </div>
    ))}
  </div>
);

const ElementVirtualList = <T,>(props: VirtualListProps<T>) => {
  const { rootRef, scrollMargin, restoredOffset, options } = useVirtualListOptions(props, false);
  // oxlint-disable-next-line react-hooks-js/incompatible-library
  const virtualizer = useVirtualizer({
    ...options,
    getScrollElement: () => getScrollElement(props.scrollElementId),
    // tanstack writes its cached offset into the scroller on attach; report the offset it should hold first
    observeElementOffset: (instance, cb) => {
      cb(restoredOffset() ?? instance.scrollElement?.scrollTop ?? 0, false);
      return observeElementOffset(instance, cb);
    }
  });

  return renderVirtualItems(rootRef, scrollMargin, virtualizer, props);
};

const WindowVirtualList = <T,>(props: VirtualListProps<T>) => {
  // the compiler only recognises useVirtualizer as TanStack Virtual; compiled, the rows would be cached on the stable virtualizer
  'use no memo';
  const { rootRef, scrollMargin, options } = useVirtualListOptions(props, true);
  const virtualizer = useWindowVirtualizer({
    ...options,
    observeElementOffset: (instance, cb) => {
      cb(window.scrollY, false);
      return observeWindowOffset(instance, cb);
    }
  });

  return renderVirtualItems(rootRef, scrollMargin, virtualizer, props);
};

export const VirtualList = <T,>(props: VirtualListProps<T>) =>
  SCROLL_DOCUMENT && !props.scrollElementId ? <WindowVirtualList {...props} /> : <ElementVirtualList {...props} />;
