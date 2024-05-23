import React, { memo } from 'react';

import clsx from 'clsx';

interface ValidationLabelProps {
  text: string;
  status: 'default' | 'success' | 'error';
}

const statusesClassNames = {
  default: 'border-lines bg-grey-4 text-grey-1',
  success: 'border-success bg-success-low text-success',
  error: 'border-error bg-error-low text-error'
};

export const ValidationLabel = memo<ValidationLabelProps>(({ text, status }) => (
  <div className={clsx('px-3 py-1 rounded border-0.5 text-font-small', statusesClassNames[status])}>{text}</div>
));
