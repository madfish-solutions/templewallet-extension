import {
  FC,
  HTMLAttributes,
  PropsWithChildren,
  Ref,
  UIEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef
} from 'react';

import { combineRefs } from 'lib/ui/utils';
import * as Woozie from 'lib/woozie';

interface Props extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

let SCROLL_RESTORATION = new Map<string, number>();
const MEMOIZED_SCROLLS_LIMIT = 10;

export const ScrollRestorer: FC<PropsWithChildren<Props>> = ({ ref, ...props }) => {
  const { trigger, href } = Woozie.useLocation();

  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current!);

  useLayoutEffect(() => {
    // Only 'popstate' to location restores scroll position
    // Other navigation ways discard previous memoized position
    if (trigger !== 'popstate') return void SCROLL_RESTORATION.delete(href);

    if (SCROLL_RESTORATION.size > MEMOIZED_SCROLLS_LIMIT) {
      const slicedArray = Array.from(SCROLL_RESTORATION.entries()).slice(
        SCROLL_RESTORATION.size - MEMOIZED_SCROLLS_LIMIT
      );
      SCROLL_RESTORATION = new Map(slicedArray);
    }

    if (!localRef.current) return;

    const scrollTop = SCROLL_RESTORATION.get(href);
    if (scrollTop == null) return;
    localRef.current.scrollTop = scrollTop;
  }, [trigger, href]);

  return <div ref={combineRefs(localRef, ref)} onScroll={onScroll} {...props} />;
};

function onScroll(event: UIEvent<HTMLDivElement>) {
  SCROLL_RESTORATION.set(window.location.href, event.currentTarget.scrollTop);
}
