import React, { ReactNode } from 'react';

import clsx from 'clsx';

interface Props {
  className: string;
  label: ReactNode;
  description?: ReactNode;
  warning?: ReactNode;
  id?: string;
}

export const FieldLabel: React.FC<Props> = ({ label, className, description, warning, id }) => (
  <label className={clsx(className, 'leading-tight flex flex-col')} htmlFor={id}>
    <div className="text-base font-semibold text-gray-700">{label}</div>

    {description && <div className="mt-1 text-xs font-light text-gray-600 max-w-9/10">{description}</div>}

    {warning && <div className="mt-1 text-xs font-medium text-red-600 max-w-9/10">{warning}</div>}
  </label>
);
