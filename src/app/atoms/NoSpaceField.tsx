import * as React from "react";
import FormField from "app/atoms/FormField";

type NoSpaceFieldProps = React.ComponentProps<typeof FormField> & {
  value?: string;
  onChange?: (v: string) => void;
};

const NoSpaceField = React.forwardRef<HTMLTextAreaElement, NoSpaceFieldProps>(
  ({ value, onChange, ...rest }, ref) => {
    const format = React.useCallback(
      (val: string) => val.replace(/\s/g, ""),
      []
    );

    const handleChange = React.useCallback(
      (evt) => {
        const formatted = format(evt.target.value);
        if (onChange) {
          onChange(formatted);
        }
      },
      [format, onChange]
    );

    return (
      <FormField ref={ref} value={value} onChange={handleChange} {...rest} />
    );
  }
);

export default NoSpaceField;
