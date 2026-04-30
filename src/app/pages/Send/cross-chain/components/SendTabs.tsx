import React, { memo, useMemo, useRef } from 'react';

import SegmentedControl from 'app/atoms/SegmentedControl';

export type SendTab = 'default' | 'cross-chain';

interface Props {
  activeTab: SendTab;
  onChange: SyncFn<SendTab>;
  crossChainDisabled?: boolean;
  className?: string;
}

export const SendTabs = memo<Props>(({ activeTab, onChange, crossChainDisabled, className }) => {
  const defaultRef = useRef<HTMLDivElement>(null);
  const crossChainRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(
    () => [
      { label: 'Default', value: 'default' as const, ref: defaultRef },
      {
        label: 'Cross-chain',
        value: 'cross-chain' as const,
        ref: crossChainRef,
        disabled: crossChainDisabled
      }
    ],
    [crossChainDisabled]
  );

  return (
    <SegmentedControl<SendTab>
      name="send-tabs"
      segments={segments}
      activeSegment={activeTab}
      setActiveSegment={onChange}
      className={className}
    />
  );
});
