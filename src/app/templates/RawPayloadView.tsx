import React, { CSSProperties, memo } from 'react';

import { FormField } from 'app/atoms';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

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
    style = EMPTY_FROZEN_OBJ,
    fieldWrapperBottomMargin = false
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
        resize: 'none',
        marginBottom: 0,
        ...style
      }}
    />
  )
);

export default RawPayloadView;
