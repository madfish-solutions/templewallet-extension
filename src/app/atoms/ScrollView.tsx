import React, { FC, HTMLAttributes, UIEventHandler, useCallback } from 'react';

import clsx from 'clsx';

import { useResizeDependentValue } from 'app/hooks/use-resize-dependent-value';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const ScrollView: FC<Props> = ({ className, children, ...rest }) => {
  const { value: contentHiding, updateValue, refFn } = useResizeDependentValue(isContentHidingBelow, false, 300);

  const onScroll = useCallback<UIEventHandler<HTMLDivElement>>(
    event => updateValue(event.currentTarget),
    [updateValue]
  );

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
