import React, {
  ComponentProps,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import BigNumber from "bignumber.js";

import FormField from "app/atoms/FormField";

type AssetFieldProps = Omit<ComponentProps<typeof FormField>, "onChange"> & {
  value?: number;
  min?: number;
  max?: number;
  assetSymbol?: ReactNode;
  assetDecimals?: number;
  onChange?: (v?: number) => void;
};

const AssetField = forwardRef<HTMLInputElement, AssetFieldProps>(
  (
    {
      value,
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      assetSymbol,
      assetDecimals = 6,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const valueStr = useMemo(
      () => (value === undefined ? "" : new BigNumber(value).toFixed()),
      [value]
    );

    const [localValue, setLocalValue] = useState(valueStr);
    const [focused, setFocused] = useState(false);

    useEffect(() => {
      if (!focused) {
        setLocalValue(valueStr);
      }
    }, [setLocalValue, focused, valueStr]);

    const handleChange = useCallback(
      (evt) => {
        let val = evt.target.value.replace(/ /g, "").replace(/,/g, ".");
        let numVal = +val;
        const indexOfDot = val.indexOf(".");
        if (indexOfDot !== -1 && val.length - indexOfDot > assetDecimals + 1) {
          val = val.substring(0, indexOfDot + assetDecimals + 1);
          numVal = +val;
        }

        if (!isNaN(numVal) && numVal >= min && numVal < max) {
          setLocalValue(val);
          if (onChange) {
            onChange(val !== "" ? numVal : undefined);
          }
        }
      },
      [assetDecimals, setLocalValue, min, max, onChange]
    );

    const handleFocus = useCallback(
      (evt) => {
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
      (evt) => {
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
      <FormField
        ref={ref}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        extraInner={assetSymbol}
        {...rest}
      />
    );
  }
);

export default AssetField;
