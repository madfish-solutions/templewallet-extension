import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';

import { MAX_SLIPPAGE_TOLERANCE_PERCENT } from './SlippageToleranceInput.validation';
import { SlippageTolerancePresetButton } from './SlippageTolerancePresetButton/SlippageTolerancePresetButton';

interface Props {
  name: string;
  value?: number;
  error?: boolean;
  onChange: (newValue?: number) => void;
}

const SLIPPAGE_PRESETS = [0.25, 0.5, 0.75];

export const SlippageToleranceInput = forwardRef<HTMLInputElement, Props>(({ name, value, error, onChange }, ref) => {
  const [customPercentageValue, setCustomPercentageValue] = useState<number>();
  const [inputWidth, setInputWidth] = useState(40);
  const contentCopyRef = useRef<HTMLDivElement | null>(null);

  const handlePresetClick = useCallback(
    (newValue: number) => {
      setCustomPercentageValue(undefined);
      onChange(newValue);
    },
    [onChange]
  );

  const handleCustomPercentageChange = useCallback(
    (newValue?: string) => {
      const newValueNum = newValue ? Number(newValue) : undefined;
      setCustomPercentageValue(newValueNum);
      onChange(newValueNum);
    },
    [onChange]
  );

  const assetFieldActive = !value || !SLIPPAGE_PRESETS.includes(value);

  const borderClassName = useMemo(() => {
    switch (true) {
      case error:
        return 'border-red-600';
      case assetFieldActive:
        return 'border-blue-600';
      default:
        return 'border-gray-300';
    }
  }, [assetFieldActive, error]);

  useEffect(() => {
    const contentCopyElement = contentCopyRef.current;
    if (contentCopyElement) {
      const contentWidth = Math.max(40, contentCopyElement.getBoundingClientRect().width + 20);
      setInputWidth(contentWidth);
    }
  }, [customPercentageValue]);

  return (
    <>
      {SLIPPAGE_PRESETS.map(preset => (
        <SlippageTolerancePresetButton
          key={preset}
          active={value === preset}
          value={preset}
          onClick={handlePresetClick}
        />
      ))}
      <div className="relative" style={{ width: inputWidth }}>
        <span className="text-xs h-0 overflow-y-hidden absolute top-0 left-0" ref={contentCopyRef}>
          {customPercentageValue}
        </span>

        <AssetField
          className={classNames('rounded-md border bg-opacity-0 -mb-2 text-right', borderClassName)}
          containerClassName="relative"
          style={{
            padding: '0.09375rem 0.875rem 0.09375rem 0.25rem',
            minWidth: 'unset',
            fontSize: '0.75rem'
          }}
          name={name}
          ref={ref}
          value={customPercentageValue}
          min={0}
          max={MAX_SLIPPAGE_TOLERANCE_PERCENT}
          assetSymbol={
            <span
              className={classNames(
                'absolute text-xs right-1 pointer-events-none',
                assetFieldActive ? 'text-gray-700' : 'text-gray-600'
              )}
              style={{ top: '0.125rem' }}
            >
              %
            </span>
          }
          extraLeftInnerWrapper="none"
          extraRightInnerWrapper="none"
          assetDecimals={2}
          onChange={handleCustomPercentageChange}
        />
      </div>
    </>
  );
});
