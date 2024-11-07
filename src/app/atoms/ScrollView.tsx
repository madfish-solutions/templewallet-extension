import React, { FC, UIEventHandler, useCallback } from 'react';

import clsx from 'clsx';

import { useResizeDependentValue } from 'app/hooks/use-resize-dependent-value';

interface Props extends PropsWithChildren {
  className?: string;
}

export const ScrollView: FC<Props> = ({ className, children }) => {
  const {
    value: contentHiding,
    setValue: setContentHiding,
    refFn
  } = useResizeDependentValue(isContentHidingBelow, false, 300);

  const onScroll = useCallback<UIEventHandler<HTMLDivElement>>(
    event => {
      const node = event.currentTarget;

      setContentHiding(isContentHidingBelow(node));
    },
    [setContentHiding]
  );

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
