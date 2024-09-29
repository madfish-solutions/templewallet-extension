import React, { ComponentProps, forwardRef, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { FormField } from 'app/atoms';
import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';

interface AssetFieldProps extends Omit<ComponentProps<typeof FormField>, 'onChange'> {
  value?: number | string;
  min?: number;
  max?: number;
  assetSymbol?: ReactNode;
  assetDecimals?: number;
  onlyInteger?: boolean;
  onChange?: (v?: string) => void;
}

const AssetField = forwardRef<HTMLInputElement, AssetFieldProps>(
  (
    {
      value,
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      assetSymbol,
      assetDecimals = 6,
      onlyInteger = false,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const valueStr = useMemo(
      () => (value === undefined || value === '' ? '' : new BigNumber(value).toFixed()),
      [value]
    );

    const [localValue, setLocalValue] = useState(valueStr);

    const { isFocused, onFocus: handleFocus, onBlur: handleBlur } = useFocusHandlers(onFocus, onBlur);

    useEffect(() => {
      if (!isFocused) {
        setLocalValue(valueStr);
      }
    }, [setLocalValue, isFocused, valueStr]);

    const handleChange = useCallback(
      (evt: React.ChangeEvent<HTMLInputElement> & React.ChangeEvent<HTMLTextAreaElement>) => {
        let val = evt.target.value.replace(/ /g, '').replace(/,/g, '.');
        const indexOfDot = val.indexOf('.');
        if (indexOfDot !== -1 && onlyInteger) return;
        let numVal = new BigNumber(val || 0);
        if (indexOfDot !== -1 && val.length - indexOfDot > assetDecimals + 1) {
          val = val.substring(0, indexOfDot + assetDecimals + 1);
          numVal = new BigNumber(val);
        }

        if (!numVal.isNaN() && numVal.isGreaterThanOrEqualTo(min) && numVal.isLessThanOrEqualTo(max)) {
          setLocalValue(val);
          onChange?.(val !== '' ? numVal.toFixed() : undefined);
        }
      },
      [onlyInteger, assetDecimals, min, max, onChange]
    );

    return (
      <FormField
        ref={ref}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        extraRightInner={assetSymbol}
        {...rest}
      />
    );
  }
);

export default AssetField;
