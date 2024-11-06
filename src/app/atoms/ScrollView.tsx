import React, { FC, HTMLAttributes, UIEventHandler, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';

import { useSafeState } from 'lib/ui/hooks';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const ScrollView: FC<Props> = ({ className, children, ...rest }) => {
  const [contentHiding, setContentHiding] = useSafeState(false);

  const ref = useRef<HTMLDivElement | nullish>();

  const setContentHidingThrottled = useMemo(() => throttle((value: boolean) => setContentHiding(value), 300), []);

  const onScroll = useCallback<UIEventHandler<HTMLDivElement>>(event => {
    const node = event.currentTarget;

    setContentHidingThrottled(isContentHidingBelow(node));
  }, []);

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(() => {
        const node = ref.current;

        if (node) setContentHidingThrottled(isContentHidingBelow(node));
      }),
    []
  );

  useWillUnmount(() => void resizeObserver.disconnect());

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
      {...rest}
    >
      {children}
    </div>
  );
};

function isContentHidingBelow(node: HTMLDivElement) {
  const scrollBottom = node.scrollHeight - node.clientHeight - node.scrollTop;

  return node.scrollHeight > node.clientHeight && scrollBottom > 0;
}
