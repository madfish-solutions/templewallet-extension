import * as React from "react";
import FormField from "app/atoms/FormField";

type AssetFieldProps = React.ComponentProps<typeof FormField> & {
  value?: number;
  min?: number;
  max?: number;
  assetSymbol?: React.ReactNode;
  onChange?: (v?: number) => void;
};

const AssetField = React.forwardRef<HTMLInputElement, AssetFieldProps>(
  (
    {
      value,
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      assetSymbol,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const valueStr = React.useMemo(
      () => (value !== undefined && value !== 0 ? value.toString() : ""),
      [value]
    );

    const [localValue, setLocalValue] = React.useState(valueStr);
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
      if (!focused) {
        setLocalValue(valueStr);
      }
    }, [setLocalValue, focused, valueStr]);

    const handleChange = React.useCallback(
      (evt) => {
        const decimals = 6;
        let val = evt.target.value.replace(/ /g, "").replace(/,/g, ".");
        let numVal = +val;
        const indexOfDot = val.indexOf(".");
        if (indexOfDot !== -1 && val.length - indexOfDot > decimals + 1) {
          val = val.substring(0, indexOfDot + decimals + 1);
          numVal = +val;
        }

        if (!isNaN(numVal) && numVal >= min && numVal < max) {
          setLocalValue(val);
          if (onChange) {
            onChange(numVal);
          }
        }
      },
      [setLocalValue, min, max, onChange]
    );

    const handleFocus = React.useCallback(
      (evt) => {
        if (onFocus) {
          onFocus(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }
        setFocused(true);
      },
      [setFocused, onFocus]
    );

    const handleBlur = React.useCallback(
      (evt) => {
        if (onBlur) {
          onBlur(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }
        setFocused(false);
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
