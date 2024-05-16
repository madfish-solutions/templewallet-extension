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
  <label className={clsx(className, 'flex flex-col')} htmlFor={id}>
    <span className="text-xs font-semibold text-text">{label}</span>

    {description && <span className="mt-1 text-xxxs font-light text-grey-1 max-w-9/10">{description}</span>}

    {warning && <span className="mt-1 text-xxxs font-medium text-error max-w-9/10">{warning}</span>}
  </label>
);
