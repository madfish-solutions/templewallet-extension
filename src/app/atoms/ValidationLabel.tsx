import React, { memo } from 'react';

import clsx from 'clsx';

interface ValidationLabelProps {
  text: string;
  status: 'default' | 'success' | 'error';
}

const statusesClassNames = {
  default: 'border-gray-300 bg-gray-200 text-gray-600',
  success: 'border-green-500 bg-opacity-15 bg-green-500 text-green-500',
  error: 'border-red-600 bg-red-700 bg-opacity-15 text-red-600'
};

export const ValidationLabel = memo<ValidationLabelProps>(({ text, status }) => (
  <div className={clsx('px-3 py-0.5 rounded border-0.5 text-xs leading-5', statusesClassNames[status])}>{text}</div>
));
