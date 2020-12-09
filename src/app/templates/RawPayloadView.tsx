import * as React from "react";
import FormField from "app/atoms/FormField";

type RawPayloadViewProps = {
  payload: string;
  rows?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  fieldWrapperBottomMargin?: boolean;
};

const RawPayloadView = React.memo(
  ({
    className,
    payload,
    label,
    rows,
    style = {},
    fieldWrapperBottomMargin,
  }: RawPayloadViewProps) => (
    <FormField
      textarea
      rows={rows}
      id="sign-payload"
      label={label}
      value={payload}
      spellCheck={false}
      readOnly
      fieldWrapperBottomMargin={fieldWrapperBottomMargin}
      className={className}
      style={{
        resize: "none",
        ...style,
      }}
    />
  )
);

export default RawPayloadView;
