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

      const scrollBottom = node.scrollHeight - node.clientHeight - node.scrollTop;

      setContentHidingThrottled(node.scrollHeight > node.clientHeight && scrollBottom > 0);
    },
    []
  );

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(
        throttle<ResizeObserverCallback>(() => {
          const node = ref.current;

          if (!node) return;

          const scrollBottom = node.scrollHeight - node.clientHeight - node.scrollTop;

          setContentHidingThrottled(node.scrollHeight > node.clientHeight && scrollBottom > 0);
        }, 300)
      ),
    []
  );

  const refFn = useCallback((node: HTMLDivElement | null) => {
    ref.current = node;
    if (!node) return void setContentHiding(false);

    resizeObserver.observe(node);

    const scrollBottom = node.scrollHeight - node.clientHeight - node.scrollTop;

    setContentHiding(node.scrollHeight > node.clientHeight && scrollBottom > 0);
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
