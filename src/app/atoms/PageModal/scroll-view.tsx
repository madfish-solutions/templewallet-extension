import { HTMLAttributes, Ref, memo, useRef } from 'react';

import clsx from 'clsx';

import { useScrollEdgesVisibility } from 'app/hooks/use-scroll-edges-visibility';
import { setTestID, TestIDProps } from 'lib/analytics';
import { combineRefs } from 'lib/ui/utils';

export interface ScrollViewProps extends HTMLAttributes<HTMLDivElement>, TestIDProps {
  onBottomEdgeVisibilityChange?: SyncFn<boolean>;
  bottomEdgeThreshold?: number;
  onTopEdgeVisibilityChange?: SyncFn<boolean>;
  topEdgeThreshold?: number;
  ref?: Ref<HTMLDivElement>;
}

export const ScrollView = memo<ScrollViewProps>(
  ({
    className,
    onBottomEdgeVisibilityChange,
    bottomEdgeThreshold,
    onTopEdgeVisibilityChange,
    topEdgeThreshold,
    testID,
    ref,
    ...restProps
  }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useScrollEdgesVisibility(
      rootRef,
      onBottomEdgeVisibilityChange,
      bottomEdgeThreshold,
      onTopEdgeVisibilityChange,
      topEdgeThreshold
    );

    return (
      <div
        {...setTestID(testID)}
        className={clsx('px-4 flex-1 flex flex-col overflow-y-auto', className)}
        ref={combineRefs(rootRef, ref)}
        {...restProps}
      />
    );
  }
);
