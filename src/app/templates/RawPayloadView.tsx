import FormField from "app/atoms/FormField";
import React from "react";

type RawPayloadViewProps = {
  label?: string;
  payload: string;
  className?: string;
  rows?: number;
};

const RawPayloadView = React.memo(
  ({ className, payload, label, rows }: RawPayloadViewProps) => (
    <FormField
      textarea
      rows={rows}
      id="sign-payload"
      label={label}
      value={payload}
      spellCheck={false}
      readOnly
      className={className}
      style={{
        resize: "none",
      }}
    />
  )
);

export default RawPayloadView;
