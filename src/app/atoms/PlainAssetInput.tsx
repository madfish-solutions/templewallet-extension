import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

type PlainAssetInputProps = Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value?: number | string;
  min?: number;
  max?: number;
  assetDecimals?: number;
  onChange?: (v?: string) => void;
};

const PlainAssetInput: FC<PlainAssetInputProps> = ({
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  assetDecimals = 6,
  onChange,
  onFocus,
  onBlur,
  ...rest
}) => {
  const valueStr = useMemo(() => (value === undefined ? '' : new BigNumber(value).toFixed()), [value]);

  const [localValue, setLocalValue] = useState(valueStr);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setLocalValue(valueStr);
    }
  }, [setLocalValue, focused, valueStr]);

  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      let val = evt.target.value.replace(/ /g, '').replace(/,/g, '.');
      let numVal = new BigNumber(val || 0);
      const indexOfDot = val.indexOf('.');
      if (indexOfDot !== -1 && val.length - indexOfDot > assetDecimals + 1) {
        val = val.substring(0, indexOfDot + assetDecimals + 1);
        numVal = new BigNumber(val);
      }

      if (!numVal.isNaN() && numVal.isGreaterThanOrEqualTo(min) && numVal.isLessThanOrEqualTo(max)) {
        setLocalValue(val);
        if (onChange) {
          onChange(val !== '' ? numVal.toFixed() : undefined);
        }
      }
    },
    [assetDecimals, setLocalValue, min, max, onChange]
  );

  const handleFocus = useCallback(
    (evt: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (onFocus) {
        onFocus(evt);
        if (evt.defaultPrevented) {
          return;
        }
      }
    },
    [setFocused, onFocus]
  );

  const handleBlur = useCallback(
    (evt: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      if (onBlur) {
        onBlur(evt);
        if (evt.defaultPrevented) {
          return;
        }
      }
    },
    [setFocused, onBlur]
  );

  return (
    <input type="text" value={localValue} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} {...rest} />
  );
};

export default PlainAssetInput;
