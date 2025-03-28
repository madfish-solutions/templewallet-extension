import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

import SegmentedControl from './SegmentedControl';

interface AssetsSegmentControlProps {
  tabSlug: string | null;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
  className?: string;
}

export const AssetsSegmentControl = memo<AssetsSegmentControlProps>(
  ({ tabSlug, onTokensTabClick, onCollectiblesTabClick, className }) => {
    const [tab, setTab] = useState(tabSlug ?? 'tokens');

    const { setFiltersClosed, setManageInactive } = useAssetsViewState();

    useEffect(() => void setTab(tabSlug ?? 'tokens'), [tabSlug]);

    useWillUnmount(() => {
      setFiltersClosed();
      setManageInactive();
    });

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
        className={className}
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
