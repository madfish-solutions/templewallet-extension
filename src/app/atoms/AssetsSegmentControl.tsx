import React, { createContext, memo, RefObject, useCallback, useContext, useRef } from 'react';

import SegmentedControl from './SegmentedControl';

interface AssetsSegmentControlProps {
  tabSlug: string | null;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
  className?: string;
}

export const AssetsSegmentControlRefContext = createContext<RefObject<HTMLDivElement>>({
  current: null
});

export const useAssetsSegmentControlRef = () => useContext(AssetsSegmentControlRefContext);

export const AssetsSegmentControl = memo<AssetsSegmentControlProps>(
  ({ tabSlug, onTokensTabClick, onCollectiblesTabClick, className }) => {
    const ref = useAssetsSegmentControlRef();

    const setActiveSegment = useCallback(
      (val: string) => {
        if (val === 'tokens') onTokensTabClick();
        else onCollectiblesTabClick();
      },
      [onTokensTabClick, onCollectiblesTabClick]
    );

    return (
      <SegmentedControl
        name="assets-segment-control"
        setActiveSegment={setActiveSegment}
        controlRef={ref}
        className={className}
        defaultIndex={!tabSlug || tabSlug === 'tokens' ? 0 : 1}
        segments={[
          {
            label: 'Tokens',
            value: 'tokens',
            ref: useRef<HTMLDivElement>(null)
          },
          {
            label: 'Collectibles',
            value: 'collectibles',
            ref: useRef<HTMLDivElement>(null)
          }
        ]}
      />
    );
  }
);
