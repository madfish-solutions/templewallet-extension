import React, { CSSProperties, memo } from "react";

import FormField from "app/atoms/FormField";

type RawPayloadViewProps = {
  payload: string;
  rows?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
  fieldWrapperBottomMargin?: boolean;
};

const RawPayloadView = memo(
  ({
    className,
    payload,
    label,
    rows,
    style = {},
    fieldWrapperBottomMargin = false,
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
        marginBottom: 0,
        ...style,
      }}
    />
  )
);

export default RawPayloadView;
