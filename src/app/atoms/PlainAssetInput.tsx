import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';

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
  const { isFocused: focused, onFocus: handleFocus, onBlur: handleBlur } = useFocusHandlers(onFocus, onBlur);

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

  return (
    <input type="text" value={localValue} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} {...rest} />
  );
};

export default PlainAssetInput;
