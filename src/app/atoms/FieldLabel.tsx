import React, { ReactNode } from 'react';

import clsx from 'clsx';

interface Props {
  className: string;
  labelContainerClassName?: string;
  label: ReactNode;
  description?: ReactNode;
  warning?: ReactNode;
  id?: string;
}

export const FieldLabel: React.FC<Props> = ({ label, className, description, warning, id }) => (
  <label className={clsx(className, 'text-font-description flex flex-col')} htmlFor={id}>
    <div className="font-semibold">{label}</div>

    {description && <div className="mt-1 text-grey-1">{description}</div>}

    {warning && <div className="mt-1 font-medium text-error">{warning}</div>}
  </label>
);
