import React, { createContext, memo, RefObject, useContext } from 'react';

import { SimpleSegmentControl } from './SimpleSegmentControl';

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

    return (
      <SimpleSegmentControl
        ref={ref}
        firstTitle="Tokens"
        secondTitle="Collectibles"
        activeSecond={tabSlug === 'collectibles'}
        className={className}
        onFirstClick={onTokensTabClick}
        onSecondClick={onCollectiblesTabClick}
      />
    );
  }
);
