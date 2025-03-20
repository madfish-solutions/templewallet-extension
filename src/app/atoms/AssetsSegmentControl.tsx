import React, { createContext, memo, RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { t } from 'lib/i18n';

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

    const [tab, setTab] = useState(tabSlug ?? 'tokens');

    useEffect(() => void setTab(tabSlug ?? 'tokens'), [tabSlug]);

    const setActiveSegment = useCallback(
      (val: string) => {
        if (val === 'tokens') onTokensTabClick();
        else onCollectiblesTabClick();
        setTab(val);
      },
      [onTokensTabClick, onCollectiblesTabClick]
    );

    return (
      <SegmentedControl
        name="assets-segment-control"
        activeSegment={tab}
        setActiveSegment={setActiveSegment}
        controlRef={ref}
        className={className}
        segments={[
          {
            label: t('tokens'),
            value: 'tokens',
            ref: useRef<HTMLDivElement>(null)
          },
          {
            label: t('collectibles'),
            value: 'collectibles',
            ref: useRef<HTMLDivElement>(null)
          }
        ]}
      />
    );
  }
);
