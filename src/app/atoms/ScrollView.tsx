import React, { FC, UIEventHandler, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';

import { useSafeState } from 'lib/ui/hooks';

interface Props extends PropsWithChildren {
  className?: string;
}

export const ScrollView: FC<Props> = ({ className, children }) => {
  const [contentHiding, setContentHiding] = useSafeState(false);

  const ref = useRef<HTMLDivElement | nullish>();

  const setContentHidingThrottled = useMemo(() => throttle((value: boolean) => setContentHiding(value), 300), []);

  const onScroll = useMemo<UIEventHandler<HTMLDivElement>>(
    () => event => {
      const node = event.currentTarget;

      setContentHidingThrottled(isContentHidingBelow(node));
    },
    []
  );

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(
        throttle<ResizeObserverCallback>(() => {
          const node = ref.current;

          if (node) setContentHidingThrottled(isContentHidingBelow(node));
        }, 300)
      ),
    []
  );

  const refFn = useCallback((node: HTMLDivElement | null) => {
    ref.current = node;
    if (!node) return void setContentHiding(false);

    resizeObserver.observe(node);

    setContentHiding(isContentHidingBelow(node));
  }, []);

  return (
    <div
      ref={refFn}
      className={clsx('flex-grow flex flex-col overflow-y-auto', className, contentHiding && 'shadow-inner-bottom')}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};

function isContentHidingBelow(node: HTMLDivElement) {
  const scrollBottom = node.scrollHeight - node.clientHeight - node.scrollTop;

  return node.scrollHeight > node.clientHeight && scrollBottom > 0;
}
